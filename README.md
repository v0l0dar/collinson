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
`http://localhost:5173`. Open the web app, start typing a city (e.g.
"Chamonix" or "Ode"), and pick one from the list.

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

- Ambiguous place names (e.g. more than one "Odessa"): the search shows
  every real match with its region/country, so the user picks the exact
  one instead of the app guessing.
- No matches while typing: the list says so, no crash.
- Open-Meteo unreachable or erroring: a "try again" message.
- Surfing for a place with no coast: the whole row shows one plain
  message ("This place has no coast") instead of 7 repeated
  "Not available" tags, and it is never scored as a misleading 0
  (Open-Meteo's Marine API only covers coastlines).

## Assumptions (short version — full reasoning in AI_NOTES.md)

- Indoor sightseeing is treated as mostly weather-independent, reduced
  only by extreme/storm conditions — not boosted just because outdoor
  conditions are bad.
- Scores are a hand-picked weighted-factor heuristic, not a scientific or
  machine-learned model. See AI_NOTES.md for the exact weights and why.

## Deploy

Both the frontend (Cloudflare Pages) and the backend (a Cloudflare
Worker, same GraphQL server code) run on Cloudflare, so the whole app
lives on one platform.

- Web app: https://collinson-weather.pages.dev
- API: https://collinson-weather-api.8081-bbd.workers.dev/graphql

To redeploy:

```bash
npm run deploy -w apps/api                                          # Worker
npm run build -w apps/web && cd apps/web && npx wrangler pages deploy dist --project-name=collinson-weather
```

## Time log

Rough, honest tracking of effort against the half-day target from the
brief. Times are wall-clock, not "focused work only."

| Date | Time | What I did |
|---|---|---|
| 2026-09-06 | ~12:00-13:45 | Read the brief, planned the architecture, scaffolded the monorepo, built the GraphQL backend (Open-Meteo integration, 4 scoring functions, tests), built the React frontend (search, loading/error/success states, PrimeReact + Tailwind UI), fixed a dependency version conflict (duplicate Vite/Vitest versions across workspaces) and a styling bug (PrimeReact's own CSS was overriding Tailwind color classes on score badges), verified the app end-to-end in a real browser with Playwright. |
| 2026-09-06 | ~14:00-14:15 | Pushed to GitHub, deployed the API to a Cloudflare Worker and the frontend to Cloudflare Pages, verified the live deployment end-to-end with Playwright. |
| 2026-09-07 | ~13:45-14:10 | Upgraded wrangler to v4 to clear 4 high/2 moderate npm audit findings in dev tooling. Replaced free-text search with a debounced place autocomplete (real candidates from Open-Meteo, e.g. "Ode" -> Odesa/Odessa/Odense) so the backend never has to guess; switched score tooltips from the native browser title to PrimeReact's Tooltip; collapsed an all-"Not available" row (surfing with no coast) into one message instead of 7 repeated tags; minor spacing/contrast pass on the table. Verified in a real browser with Playwright. |
| 2026-09-07 | ~14:15-15:10 | Self-review pass: fixed a units bug in skiing's rain math (cm vs mm), stopped `fetchMarine` from swallowing real outages as "no coast", made score reasons visible text instead of hover-only, fixed a misleading "Overcast or stormy" label, removed unused fields, de-duplicated error copy between server and client, added a lightweight Open-Meteo response-shape guard, added an aria-live region and a "Best: &lt;day&gt;" callout per activity. Added `notes/session-log.md` — a raw, chronological account of the whole build, not just this summary table. Tried three ways to quiet a noisy jsdom test-log warning; none worked for a structural reason (documented in AI_NOTES.md) — left it rather than risk a fix that could hide a real test failure. |
