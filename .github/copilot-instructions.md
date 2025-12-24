# Copilot instructions — live-data-vista

Purpose: short, actionable guidance so AI coding agents can be immediately productive in this repo.

## Quick setup ✅
- Install dependencies: `npm i`
- Start backend (local plant API): `node server.js` (listens on port 3001)
- Start the frontend dev server: `npm run dev` (Vite, default port 8080)
- Lint: `npm run lint`

## Big picture (what matters) 🔧
- Frontend: Vite + React + TypeScript in `src/`. UI primitives live under `src/components/ui/` (shadcn patterns). Small feature components live in `src/components/`.
- Hooks encapsulate side effects and integration: `src/hooks/usePlantData.ts`, `usePLCDirect.ts`, `useWebSocket.ts`.
- Backend: lightweight Express + SQLite in `server.js` exposing `/api/plant` endpoints used by `usePlantData`.
- PLC integration:
  - Two modes: HTTP CSV endpoints proxied during dev (`/getvar.csv` and `/setvar.csv`) and WebSocket streams for live cameras / data.
  - Vite proxies `/getvar.csv` and `/setvar.csv` to the PLC IP configured at the top of `vite.config.ts` (change `PLC_IP` for local PLC testing).

## Project-specific patterns & conventions 💡
- Absolute imports use the `@` alias. See `vite.config.ts -> resolve.alias`.
- Use the `cn` helper in `src/lib/utils.ts` for merging Tailwind classes (twMerge + clsx).
- UI components follow shadcn / Radix primitives. Reuse those primitives when adding UI.
- Hook responsibilities:
  - `usePlantData`: handles fetching/creating/updating plant rows via `http://<PLC_OR_HOST>:3001/api` (the constant `API_BASE` is in that file).
  - `usePLCDirect`: polls `/getvar.csv`, posts to `/setvar.csv` and contains the PLC ID mapping (`internalToPlcMap`) — modify here when PLC variable IDs change.
  - `useWebSocket`: generic websocket hook; it will mark status `blocked` if a page served over HTTPS attempts to connect to `ws://` (use `wss://` instead).

## Operational tips / gotchas ⚠️
- Dev PLC proxy: update `PLC_IP` in `vite.config.ts` then restart `npm run dev` to proxy CSV endpoints to your PLC. Example:
  - `vite.config.ts` top: `const PLC_IP = 'http://192.168.100.70'`
- Local plant API host: `usePlantData.ts` currently uses `API_BASE = 'http://192.168.0.229:3001/api'`. For local work change to `http://localhost:3001/api` or run the server on that IP.
- WebSocket security: if your site runs over HTTPS, use `wss://` for camera/PLC sockets; otherwise `useWebSocket` will return `connectionStatus: 'blocked'`.
- Camera: default live cam URL is set in `src/components/LiveGrowCam.tsx` (default `ws://192.168.0.158:8090`). Update as needed.

## Concrete examples (where to edit) ✍️
- Change PLC proxy target (dev): edit `vite.config.ts` → `PLC_IP`.
- Change plant API base: edit `src/hooks/usePlantData.ts` → `const API_BASE = 'http://localhost:3001/api'`.
- Add/adjust PLC variable IDs: edit `src/hooks/usePLCDirect.ts` → `internalToPlcMap`.

## Useful files to inspect 📁
- `vite.config.ts` — dev server, PLC proxy and `@` alias
- `server.js` — Express API and SQLite DB bootstrapping
- `src/hooks/usePlantData.ts`, `usePLCDirect.ts`, `useWebSocket.ts` — integration patterns
- `src/components/LiveGrowCam.tsx` — example of binary WebSocket image handling
- `src/components/ui/*` — shared UI primitives (shadcn)
- `src/lib/utils.ts` — `cn` class helper

## When to ask for clarification ❓
- If the PLC variable mapping is unclear, point to `usePLCDirect.ts` and request the device's ID map.
- If a change needs to be exposed to production, verify whether Lovable deployment (see `README.md`) is used and whether `PLC_IP` or API host needs environmentization.

---
If any behaviour is unclear or you want more detail (examples, test harness, or a short task checklist), say which area and I'll expand the doc.