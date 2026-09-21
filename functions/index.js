const fs = require('fs')
const path = require('path')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https')
const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const { getStorage } = require('firebase-admin/storage')
const { getMessaging } = require('firebase-admin/messaging')

const app = initializeApp()
// Same named database as the client (src/shared/firebase.js) — see CLAUDE.md #008.
const db = getFirestore(app, 'anix')

const HANDLE_PATTERN = /^[a-z0-9][a-z0-9-]{2,23}$/
const MAX_PER_TYPE = 3
const STALE_MS = 5 * 60 * 1000
const INACTIVE_MS = 2 * 24 * 60 * 60 * 1000
const BATCH_LIMIT = 200
const CODE_CHARS = 'abcdefghjkmnpqrstuvwxyz23456789' // no 0/o/1/i/l — unambiguous in a URL
const CODE_LENGTH = 6
const CODE_GEN_ATTEMPTS = 5

function generateCode() {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  return code
}

// --- Create/delete ---
//
// The doc id (and the actual URL id, /r/:code or /m/:code) is a random
// code, not the handle — the handle is just a cosmetic label (shown in
// the UI and, optionally, as a trailing /handle segment on the link for
// readability, e.g. /r/uu23g/movie-night — that segment is decorative
// only, never read by the app). This is why the handle doesn't need to
// be globally unique (2026-09-19 — it originally *was* the doc id, and
// had to be; changed after the user asked whether a unique code could
// come first specifically to avoid that conflict).
//
// The 3-per-account cap still needs an atomic check-then-write rules
// can't express (they can't count existing docs) — done here via the
// Admin SDK. Code collisions are vanishingly unlikely at this scale
// (31^6 ≈ 887M) but are still retried rather than assumed away.
async function createHandleDoc(collectionName, ownerId, { handle, themeColor }) {
  const normalizedHandle = (handle || '').trim().toLowerCase()
  if (!HANDLE_PATTERN.test(normalizedHandle)) {
    throw new HttpsError(
      'invalid-argument',
      'Handle must be 3-24 characters: lowercase letters, numbers, or hyphens.',
    )
  }

  for (let attempt = 0; attempt < CODE_GEN_ATTEMPTS; attempt++) {
    const code = generateCode()
    const docRef = db.collection(collectionName).doc(code)

    try {
      await db.runTransaction(async (tx) => {
        const existing = await tx.get(docRef)
        if (existing.exists) {
          throw new HttpsError('already-exists', 'code collision, retry')
        }

        const owned = await tx.get(db.collection(collectionName).where('ownerId', '==', ownerId))
        if (owned.size >= MAX_PER_TYPE) {
          throw new HttpsError('resource-exhausted', `You can only have ${MAX_PER_TYPE} of these.`)
        }

        const data = {
          ownerId,
          handle: normalizedHandle,
          themeColor: themeColor || null,
          bannerImageUrl: null,
          createdAt: FieldValue.serverTimestamp(),
        }
        if (collectionName === 'rooms') {
          data.status = 'closed'
          data.lastActivityAt = FieldValue.serverTimestamp()
        }

        tx.set(docRef, data)
      })

      return { id: code, handle: normalizedHandle }
    } catch (err) {
      if (err instanceof HttpsError && err.code === 'resource-exhausted') throw err
      if (attempt === CODE_GEN_ATTEMPTS - 1) {
        throw new HttpsError('internal', 'Could not generate a unique code — try again.')
      }
      // Otherwise a code collision on this attempt — loop and try a new one.
    }
  }
}

async function deleteHandleDoc(collectionName, ownerId, id, subcollections) {
  const docRef = db.collection(collectionName).doc(id)
  const snapshot = await docRef.get()
  if (!snapshot.exists) return
  if (snapshot.data().ownerId !== ownerId) {
    throw new HttpsError('permission-denied', "That's not yours to delete.")
  }

  for (const sub of subcollections) {
    const subSnapshot = await docRef.collection(sub).get()
    if (subSnapshot.empty) continue
    const batch = db.batch()
    subSnapshot.docs.forEach((doc) => batch.delete(doc.ref))
    await batch.commit()
  }

  if (snapshot.data().bannerImageUrl) {
    await getStorage()
      .bucket()
      .deleteFiles({ prefix: `anix/${collectionName === 'rooms' ? 'rooms' : 'endpoints'}/${id}/banner/` })
      .catch(() => {}) // best-effort — a missing/already-gone file shouldn't fail the delete
  }

  await docRef.delete()
}

exports.createRoom = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required.')
  return createHandleDoc('rooms', request.auth.uid, request.data)
})

exports.createMessageEndpoint = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required.')
  return createHandleDoc('messageEndpoints', request.auth.uid, request.data)
})

exports.deleteRoom = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required.')
  await deleteHandleDoc('rooms', request.auth.uid, request.data.id, [
    'messages',
    'typing',
    'presence',
    'reports',
  ])
  return { ok: true }
})

exports.deleteMessageEndpoint = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required.')
  await deleteHandleDoc('messageEndpoints', request.auth.uid, request.data.id, ['messages'])
  return { ok: true }
})

// --- Push notifications (#006, 2026-09-21) ---
//
// Only a room/endpoint's *owner* can ever receive a push — they're the
// only party with a real account (fcmTokens live on users/{uid}); an
// anonymous room participant or message sender has no account to
// attach a token to, so "notify the other person when your message
// gets a reply" isn't possible here, only "notify the owner."
async function sendToOwner(ownerId, notification) {
  const userSnap = await db.doc(`users/${ownerId}`).get()
  const tokens = userSnap.data()?.fcmTokens || []
  if (!tokens.length) return

  const response = await getMessaging().sendEachForMulticast({ tokens, notification })
  const deadTokens = response.responses
    .map((result, i) => (result.success ? null : tokens[i]))
    .filter(Boolean)
  if (deadTokens.length) {
    await db.doc(`users/${ownerId}`).update({ fcmTokens: FieldValue.arrayRemove(...deadTokens) })
  }
}

exports.onEndpointMessage = onDocumentCreated(
  'messageEndpoints/{endpointId}/messages/{messageId}',
  async (event) => {
    const endpoint = (await db.doc(`messageEndpoints/${event.params.endpointId}`).get()).data()
    if (!endpoint?.ownerId) return
    await sendToOwner(endpoint.ownerId, {
      title: 'New anonymous message',
      body: `Someone sent you a message on ${endpoint.handle}.`,
    })
  },
)

exports.onRoomMessage = onDocumentCreated('rooms/{roomId}/messages/{messageId}', async (event) => {
  const room = (await db.doc(`rooms/${event.params.roomId}`).get()).data()
  if (!room?.ownerId) return
  await sendToOwner(room.ownerId, {
    title: 'New activity in your room',
    body: `New message in ${room.handle}.`,
  })
})

exports.onRoomReport = onDocumentCreated('rooms/{roomId}/reports/{reportId}', async (event) => {
  const room = (await db.doc(`rooms/${event.params.roomId}`).get()).data()
  if (!room?.ownerId) return
  await sendToOwner(room.ownerId, {
    title: 'A message was reported',
    body: `Someone flagged a message in ${room.handle}.`,
  })
})

// --- Scheduled hygiene ---

async function pruneStaleDocs(roomRef, subcollection) {
  const cutoff = new Date(Date.now() - STALE_MS)
  const snapshot = await roomRef.collection(subcollection).where('updatedAt', '<', cutoff).get()
  if (snapshot.empty) return

  const batch = db.batch()
  snapshot.docs.forEach((doc) => batch.delete(doc.ref))
  await batch.commit()
}

exports.pruneStalePresence = onSchedule('every 24 hours', async () => {
  const snapshot = await db.collection('rooms').limit(BATCH_LIMIT).get()

  await Promise.all(
    snapshot.docs.flatMap((doc) => [
      pruneStaleDocs(doc.ref, 'typing'),
      pruneStaleDocs(doc.ref, 'presence'),
    ]),
  )
})

// Reinstated 2026-09-19: rooms are back to being one of up to 3
// user-created, user-named rooms (not a single permanent per-account
// room), so auto-deleting a quiet one is the right behavior again —
// per explicit request ("chat rooms get deleted automatically if not
// used in the next 2 days").
exports.expireInactiveRooms = onSchedule('every 24 hours', async () => {
  const cutoff = new Date(Date.now() - INACTIVE_MS)
  const snapshot = await db
    .collection('rooms')
    .where('lastActivityAt', '<', cutoff)
    .limit(BATCH_LIMIT)
    .get()

  await Promise.all(
    snapshot.docs.map((doc) => deleteHandleDoc('rooms', doc.data().ownerId, doc.id, [
      'messages',
      'typing',
      'presence',
      'reports',
    ])),
  )
})

// --- Dynamic link-preview meta tags ---
//
// A static SPA can't show a per-room/per-endpoint banner image when its
// link is pasted into WhatsApp/Twitter/etc. — those crawlers read meta
// tags from the initial HTML response, before any JS runs. This
// function sits in front of /r/** and /m/** (see firebase.json's
// hosting rewrites) and, for a *detected crawler only*, rewrites the
// template's og:image/title/description to that specific room/
// endpoint's banner+handle before serving it.
//
// Real visitors get the untouched template immediately, with **no**
// Firestore read and **no** network fetch — the template is bundled
// alongside this function's own code (functions/index-template.html,
// copied from dist/index.html by `npm run build`) and read once at cold
// start, not fetched over the network per-request. An earlier version
// fetched `https://anix.web.app/index.html` on every request (bots and
// real users alike, to avoid needing a bot-detection list) — that added
// 1.5-5s of latency to *every* room/message-link visit and occasionally
// failed outright (ERR_SOCKET_NOT_CONNECTED), a bad trade for visitors
// who were never going to be read by a crawler anyway.
// The landscape banner (public/banner.png), not the raw square icon —
// a link-preview surface expects a ~1200x630 image; the square icon
// either gets cropped oddly or shown tiny depending on the platform.
const DEFAULT_BANNER = 'https://anix.web.app/banner.png'
const INDEX_TEMPLATE = fs.readFileSync(path.join(__dirname, 'index-template.html'), 'utf8')
const CRAWLER_PATTERN =
  /bot|facebookexternalhit|whatsapp|telegrambot|slackbot|discordbot|linkedinbot|pinterest|redditbot|applebot|vkshare|w3c_validator|embedly|quora link preview|outbrain|skypeuripreview/i

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function injectMeta(html, { title, description, image }) {
  return html
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(
      /<meta name="description" content=".*?" \/>/,
      `<meta name="description" content="${escapeHtml(description)}" />`,
    )
    .replace(
      /<meta property="og:title" content=".*?" \/>/,
      `<meta property="og:title" content="${escapeHtml(title)}" />`,
    )
    .replace(
      /<meta property="og:description" content=".*?" \/>/,
      `<meta property="og:description" content="${escapeHtml(description)}" />`,
    )
    .replace(/<meta property="og:image" content=".*?" \/>/, `<meta property="og:image" content="${image}" />`)
    .replace(/<meta name="twitter:image" content=".*?" \/>/, `<meta name="twitter:image" content="${image}" />`)
}

exports.linkPreview = onRequest(async (req, res) => {
  const isCrawler = CRAWLER_PATTERN.test(req.get('User-Agent') || '')

  // Explicit no-store for real visitors — this response's content is
  // tied to whatever build is currently deployed (the referenced JS/CSS
  // filenames are content-hashed and change every deploy); anything a
  // CDN/browser cached from an older deploy must never be reused here.
  if (!isCrawler) {
    res.set('Cache-Control', 'no-store')
    res.status(200).send(INDEX_TEMPLATE)
    return
  }

  const pathMatch = req.path.match(/^\/(r|m)\/([^/]+)/)
  if (!pathMatch) {
    res.set('Cache-Control', 'no-store')
    res.status(200).send(INDEX_TEMPLATE)
    return
  }

  const [, kind, id] = pathMatch
  const collectionName = kind === 'r' ? 'rooms' : 'messageEndpoints'

  try {
    const snapshot = await db.collection(collectionName).doc(id).get()
    const data = snapshot.exists ? snapshot.data() : null
    const handle = data?.handle || id
    const image = data?.bannerImageUrl || DEFAULT_BANNER
    const title = kind === 'r' ? `Join ${handle} on Anix` : `Send ${handle} an anonymous message`
    const description =
      kind === 'r' ? 'An anonymous chat room on Anix.' : 'Send an anonymous message on Anix.'

    res.set('Cache-Control', 'public, max-age=300')
    res.status(200).send(injectMeta(INDEX_TEMPLATE, { title, description, image }))
  } catch (err) {
    console.error('linkPreview error', err)
    res.status(200).send(INDEX_TEMPLATE)
  }
})
