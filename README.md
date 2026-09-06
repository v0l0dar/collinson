# Weather Activity Ranker

Enter a city. This app checks the weather for the next 7 days and scores
how good each day looks for four activities: skiing, surfing, outdoor
sightseeing, and indoor sightseeing.

Weather data comes from [Open-Meteo](https://open-meteo.com/) (free, no
API key). See [AI_NOTES.md](./AI_NOTES.md) for the scoring logic, the
open questions in the brief, and the assumptions I made to close them.

## Project layout

```
apps/api/   GraphQL backend (Node.js + TypeScript + graphql-yoga)
apps/web/   Frontend (React 19 + TypeScript + Tailwind + PrimeReact)
```

No data is stored. Every search calls Open-Meteo live.

## How to run it

Needs Node.js 20+.

```bash
npm install
npm run dev
```

This starts the API on `http://localhost:4000/graphql` and the web app on
`http://localhost:5173`. Open the web app and enter a city, for example
"Chamonix" or "Biarritz".

Run each part alone with `npm run dev:api` or `npm run dev:web`.

## Tests

```bash
npm run test
```

Runs the backend's scoring and error-handling tests (Vitest) and the
frontend's loading/error/success UI tests (Vitest + React Testing
Library).

## Build

```bash
npm run build
```

## Edge cases handled

- Empty search box: the search button stays disabled.
- Place not found: a plain message, no crash.
- Open-Meteo unreachable or erroring: a separate "try again" message.
- Surfing for a place with no coast: shown as "Not available", not a
  misleading low score (Open-Meteo's Marine API only covers coastlines).

## Assumptions (short version — full reasoning in AI_NOTES.md)

- Ambiguous place names (e.g. more than one "Paris") use Open-Meteo's top
  match. No picker for alternatives.
- Indoor sightseeing is treated as mostly weather-independent, reduced
  only by extreme/storm conditions — not boosted just because outdoor
  conditions are bad.
- Scores are a hand-picked weighted-factor heuristic, not a scientific or
  machine-learned model. See AI_NOTES.md for the exact weights and why.

## Deploy

Both the frontend (Cloudflare Pages) and the backend (a Cloudflare
Worker, same GraphQL server code) are meant to run on Cloudflare so the
whole app lives on one platform. *(Live links go here once deployed.)*

## Time log

Rough, honest tracking of effort against the half-day target from the
brief. Times are wall-clock, not "focused work only."

| Date | Time | What I did |
|---|---|---|
| 2026-09-06 | ~12:00-13:45 | Read the brief, planned the architecture, scaffolded the monorepo, built the GraphQL backend (Open-Meteo integration, 4 scoring functions, tests), built the React frontend (search, loading/error/success states, PrimeReact + Tailwind UI), fixed a dependency version conflict (duplicate Vite/Vitest versions across workspaces) and a styling bug (PrimeReact's own CSS was overriding Tailwind color classes on score badges), verified the app end-to-end in a real browser with Playwright. |
