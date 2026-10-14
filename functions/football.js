// Football rooms, stage 2 (2026-10-14): live match data for the match
// card. One scheduled function keeps `footballMatches/{id}` current for
// every room at once — rooms only read; nobody's browser calls the APIs.
//
// Sources (both free tiers; keys are Secret Manager secrets):
//   football-data.org  (FOOTBALL_DATA_TOKEN) — 12 big competitions (PL,
//     CL, La Liga, Serie A, Bundesliga, Ligue 1, Championship, World
//     Cup…). 10 requests/min; free scores lag a few minutes; no minute
//     field (the card estimates it from kickoff).
//   API-Football       (API_FOOTBALL_KEY) — ~100 requests/day, every
//     league; used only for Nigeria: NPFL, Federation Cup and the Super
//     Eagles. Gives the real minute.
//
// Cost control: one state doc (`football/state`) holds the day's match
// summary, so a tick reads 1 doc; match docs are written only when
// something changed; API-Football calls are counted against a daily cap.
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { defineSecret } = require('firebase-functions/params')
const { Timestamp } = require('firebase-admin/firestore')

const FD_TOKEN = defineSecret('FOOTBALL_DATA_TOKEN')
const AF_KEY = defineSecret('API_FOOTBALL_KEY')

const MIN = 60_000
const HOUR = 60 * MIN
const FD_LIST_EVERY = 30 * MIN // fixture list refresh when nothing is live
const AF_LIST_EVERY = 3 * HOUR // ~16 calls/day (today + tomorrow)
const AF_LIVE_EVERY = 6 * MIN // live refresh while a Nigerian match is on
const AF_DAILY_CAP = 85 // free tier is 100/day — keep headroom
const AF_LEAGUES = new Set([399, 1231]) // NPFL, Federation Cup
const KEEP_FROM = 4 * HOUR // matches that kicked off up to 4h ago…
const KEEP_UNTIL = 36 * HOUR // …until 36h ahead

const day = (ms) => new Date(ms).toISOString().slice(0, 10)

// ---------- normalising both APIs into one shape ----------
const FD_STATUS = {
  SCHEDULED: 'upcoming',
  TIMED: 'upcoming',
  IN_PLAY: 'live',
  PAUSED: 'ht',
  FINISHED: 'ft',
  AWARDED: 'ft',
  POSTPONED: 'off',
  SUSPENDED: 'off',
  CANCELLED: 'off',
}
const AF_STATUS = (s) =>
  ['1H', '2H', 'ET', 'P', 'LIVE', 'INT', 'BT'].includes(s)
    ? 'live'
    : s === 'HT'
      ? 'ht'
      : ['FT', 'AET', 'PEN', 'AWD', 'WO'].includes(s)
        ? 'ft'
        : ['PST', 'CANC', 'ABD', 'SUSP'].includes(s)
          ? 'off'
          : 'upcoming'

function fromFootballData(m) {
  return {
    id: `fd-${m.id}`,
    source: 'fd',
    comp: m.competition?.name || '',
    compCode: m.competition?.code || '',
    home: { name: m.homeTeam?.name || 'TBD', short: m.homeTeam?.shortName || m.homeTeam?.name || 'TBD' },
    away: { name: m.awayTeam?.name || 'TBD', short: m.awayTeam?.shortName || m.awayTeam?.name || 'TBD' },
    kickoff: Date.parse(m.utcDate),
    status: FD_STATUS[m.status] || 'upcoming',
    minute: null,
    score: { home: m.score?.fullTime?.home ?? null, away: m.score?.fullTime?.away ?? null },
  }
}

function fromApiFootball(f) {
  return {
    id: `af-${f.fixture.id}`,
    source: 'af',
    comp: f.league?.name === 'NPFL' ? 'NPFL' : f.league?.name || '',
    compCode: String(f.league?.id || ''),
    home: { name: f.teams.home.name, short: f.teams.home.name },
    away: { name: f.teams.away.name, short: f.teams.away.name },
    kickoff: f.fixture.timestamp * 1000,
    status: AF_STATUS(f.fixture.status?.short),
    minute: f.fixture.status?.elapsed ?? null,
    score: { home: f.goals?.home ?? null, away: f.goals?.away ?? null },
  }
}

const isNigerian = (f) =>
  AF_LEAGUES.has(f.league?.id) || f.teams?.home?.name === 'Nigeria' || f.teams?.away?.name === 'Nigeria'

// in its "could be live" window: from 10 min before kickoff to 2.5h after
const inPlayWindow = (m, now) => m.status === 'live' || m.status === 'ht' || (m.status === 'upcoming' && now >= m.kickoff - 10 * MIN && now <= m.kickoff + 150 * MIN)

// ---------- HTTP ----------
async function getJson(url, headers) {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(20_000) })
  if (!res.ok) throw new Error(`${url} → ${res.status}`)
  return res.json()
}

// ---------- room announcements (kick-off, goals, half/full time) ----------
function announcement(prev, next) {
  const line = `${next.home.short} ${next.score.home ?? 0}–${next.score.away ?? 0} ${next.away.short}`
  if (!prev) return null
  if (prev.status === 'upcoming' && next.status === 'live') return `🟢 kick-off — ${next.home.short} v ${next.away.short}`
  const goals = (s) => (s?.home ?? 0) + (s?.away ?? 0)
  if (goals(next.score) > goals(prev.score)) {
    const scorer = (next.score.home ?? 0) > (prev.score?.home ?? 0) ? next.home.short : next.away.short
    return `⚽ GOAL ${scorer}! ${line}`
  }
  if (prev.status === 'live' && next.status === 'ht') return `⏸️ half time — ${line}`
  if (prev.status !== 'ft' && next.status === 'ft') return `🏁 full time — ${line}`
  return null
}

module.exports = function footballFunctions(db) {
  async function announce(matchId, text) {
    const rooms = await db.collection('rooms').where('pinnedMatch', '==', matchId).limit(50).get()
    await Promise.all(
      rooms.docs.map((room) =>
        room.ref.collection('messages').add({ type: 'event', text, createdAt: Timestamp.now() }),
      ),
    )
  }

  // Upsert normalised matches; returns the summary to keep in state.
  async function save(matches, previous) {
    const now = Date.now()
    const kept = matches.filter((m) => m.kickoff >= now - KEEP_FROM && m.kickoff <= now + KEEP_UNTIL)
    const batch = db.batch()
    let writes = 0
    const notices = []
    for (const m of kept) {
      const prev = previous[m.id]
      const changed =
        !prev ||
        prev.status !== m.status ||
        prev.h !== m.score.home ||
        prev.a !== m.score.away ||
        prev.min !== m.minute ||
        prev.k !== m.kickoff
      if (!changed) continue
      batch.set(db.doc(`footballMatches/${m.id}`), {
        ...m,
        kickoff: Timestamp.fromMillis(m.kickoff),
        updatedAt: Timestamp.now(),
      })
      writes++
      const text = announcement(
        prev && { status: prev.status, score: { home: prev.h, away: prev.a } },
        m,
      )
      if (text) notices.push([m.id, text])
    }
    if (writes) await batch.commit()
    await Promise.all(notices.map(([id, text]) => announce(id, text)))
    return Object.fromEntries(
      kept.map((m) => [m.id, { status: m.status, h: m.score.home, a: m.score.away, min: m.minute, k: m.kickoff, src: m.source }]),
    )
  }

  const footballSync = onSchedule(
    { schedule: 'every 2 minutes', region: 'europe-west1', secrets: [FD_TOKEN, AF_KEY], timeoutSeconds: 60, memory: '256MiB' },
    async () => {
      const now = Date.now()
      const stateRef = db.doc('football/state')
      const state = (await stateRef.get()).data() || {}
      const summary = state.matches || {}
      const live = (src) =>
        Object.values(summary).some((m) => m.src === src && inPlayWindow({ status: m.status, kickoff: m.k }, now))
      const next = { ...state }
      let collected = []

      // football-data: the whole ±1 day list in one call — every tick
      // while something's on, otherwise every 30 min.
      if (!state.fdAt || now - state.fdAt > FD_LIST_EVERY || live('fd')) {
        try {
          const data = await getJson(
            `https://api.football-data.org/v4/matches?dateFrom=${day(now - 86_400_000)}&dateTo=${day(now + 86_400_000)}`,
            { 'X-Auth-Token': FD_TOKEN.value() },
          )
          collected = collected.concat((data.matches || []).map(fromFootballData))
          next.fdAt = now
        } catch (err) {
          console.error('football-data fetch failed', err.message)
        }
      }

      // API-Football: Nigerian fixtures — list every 3h, live every 6 min
      // while one is on, never past the daily cap.
      if (next.afDay !== day(now)) {
        next.afDay = day(now)
        next.afCount = 0
      }
      const afCall = async (query) => {
        if (next.afCount >= AF_DAILY_CAP) return []
        next.afCount++
        const data = await getJson(`https://v3.football.api-sports.io/fixtures?${query}`, { 'x-apisports-key': AF_KEY.value() })
        if (data.errors && Object.keys(data.errors).length) throw new Error(JSON.stringify(data.errors))
        return data.response || []
      }
      try {
        if (!state.afAt || now - state.afAt > AF_LIST_EVERY) {
          for (const d of [day(now), day(now + 86_400_000)]) {
            collected = collected.concat((await afCall(`date=${d}`)).filter(isNigerian).map(fromApiFootball))
          }
          next.afAt = now
          next.afLiveAt = now
        } else if (live('af') && now - (state.afLiveAt || 0) > AF_LIVE_EVERY) {
          const ids = Object.entries(summary)
            .filter(([, m]) => m.src === 'af' && inPlayWindow({ status: m.status, kickoff: m.k }, now))
            .map(([id]) => id.slice(3))
            .slice(0, 20)
          if (ids.length) collected = collected.concat((await afCall(`ids=${ids.join('-')}`)).map(fromApiFootball))
          next.afLiveAt = now
        }
      } catch (err) {
        console.error('api-football fetch failed', err.message)
      }

      if (!collected.length) {
        if (next.afCount !== state.afCount || next.afDay !== state.afDay) await stateRef.set(next)
        return
      }
      // merge: keep summary entries we didn't refetch this tick (e.g. AF
      // fixtures between list refreshes)
      const fresh = await save(collected, summary)
      const merged = { ...summary, ...fresh }
      for (const [id, m] of Object.entries(merged)) {
        if (m.k < now - KEEP_FROM || m.k > now + KEEP_UNTIL) delete merged[id]
      }
      await stateRef.set({ ...next, matches: merged })
    },
  )

  return { footballSync }
}
