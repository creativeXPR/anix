# Anix

Anonymous chat rooms and anonymous messages, with seasonal theming — built
for the best anonymous experience possible.

## Setup

```bash
npm install
cp .env.example .env   # fill in Firebase client config
npm run dev
```

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — production build
- `npm run lint` — run ESLint
- `npm run preview` — preview the production build locally

## Project structure

Feature-based: each screen/feature owns its own folder under `src/features/`;
anything shared across features (Firebase client, anonymous-id generator,
shared UI/hooks as they're added) lives under `src/shared/`.

```
src/
  features/
    home/                  — landing page after sign-in
    auth/                  — sign in / sign up
    chatroom/              — a chat room opened via /r/:roomId
    anonymous-messages/    — the "send me a message" page at /m/:userId
  shared/
    firebase.js            — Firebase client init (reads VITE_-prefixed env vars)
    utils/anonymous-id.js  — short random id generator for anonymous participants
```

File naming: PascalCase for components (`ChatRoomScreen.jsx`), kebab-case
for everything else (`anonymous-id.js`).

## Features

1. **Anonymous chat room** — a user opens a room and shares the link;
   everyone who joins gets a unique per-room id so they can talk without
   recognizing each other. Links, images allowed; no videos.
2. **Anonymous messages** — a user shares their personal link (like NGL);
   anyone with the link can send them an anonymous message.
3. **Season settings** — per-room or per-message-link theme customization
   (color/font/theme), swappable for occasions (e.g. a Christmas theme, a
   movie-night theme).

## Routes (current skeleton)

- `/` — home (open a room, copy your message link)
- `/auth` — sign in / sign up
- `/r/:roomId` — a chat room
- `/m/:userId` — send an anonymous message to `userId`

## Status

Scaffolding stage — routing skeleton and shared Firebase/anonymous-id
utilities are in place; the actual screens are placeholders. Visual design
(layout, chat bubble design, icons/loaders, color palette) hasn't been
decided yet — see the Design Playbook at `C:\Users\Extra\Documents\code\Stores\CLAUDE.md`
(topics #001, #002, #003, #004) for that pass.
