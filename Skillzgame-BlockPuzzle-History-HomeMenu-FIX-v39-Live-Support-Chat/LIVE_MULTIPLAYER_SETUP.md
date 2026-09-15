# Skillz Base — Live 1v1 Multiplayer Setup

This version adds a dedicated WebSocket live-game transport while keeping the existing HTTP API for authentication, matchmaking, wallet deduction, and settlement.

## Architecture

- Frontend: Vite/React (Vercel/Netlify/static hosting is fine)
- API + database: the existing Express + MongoDB service
- Live transport: `server/liveServer.mjs` with WebSocket `/live`
- Database: MongoDB Atlas

## Environment

Frontend:

```env
VITE_API_BASE_URL=https://YOUR-API-HOST/api
VITE_LIVE_WS_URL=wss://YOUR-LIVE-HOST
```

Live server:

```env
MONGODB_URI=...
TOKEN_SECRET=...
ADMIN_PHONE=...
ADMIN_PASSWORD=...
CRON_SECRET=...
LIVE_PORT=8787
```

## Run locally

Terminal 1:

```bash
npm run live-server
```

Terminal 2:

```bash
npm run dev
```

Set `VITE_API_BASE_URL=http://localhost:8787/api` and `VITE_LIVE_WS_URL=ws://localhost:8787` for a same-machine test.

## Important deployment note

Do not deploy `server/liveServer.mjs` as a Vercel serverless function. WebSockets need a long-lived Node process. Put the live server on a WebSocket-capable host such as Railway, Render, Fly.io, or a VPS, and point `VITE_LIVE_WS_URL` at it. The frontend can remain on Vercel/Netlify.

## What is now synchronized

- Opponent board state
- Opponent score
- Lines cleared
- Move order / duplicate move protection
- Server-side placement validation
- Server-side score calculation for live moves
- Server-side live game deadline
- WebSocket presence / connection status
- Existing HTTP settlement remains the final wallet authority

The live state is also persisted in MongoDB, so reconnecting clients can receive the latest board/score state.
