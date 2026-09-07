# AI Notes

This file is the "how I worked" part of the exercise. It explains the open
questions in the brief, the calls I made, and why. I used Claude (Sonnet 5,
in Claude Code) as my pair programmer for the whole build — planning, domain
research, code, and tests. The exercise says model choice does not matter,
so I did not force a specific model; I used the one available in my coding
session.

## How I used AI for the domain research

I am not a skier or a surfer. Before writing any scoring code, I asked
Claude two plain questions: "what makes a good ski day?" and "what do
surfers look at in a forecast?". The answers were the common, well-known
heuristics:

- Skiing: fresh snow, cold enough that it does not melt, low wind (lifts
  close in high wind), rain is a bad sign.
- Surfing: wave height and wave period (a longer period means an
  organised, powerful swell, not just wind chop), and calm wind.

I did not take this on faith. I checked it against real Open-Meteo data for
places I could reason about (Chamonix for skiing, Biarritz for surfing) and
looked at whether the resulting scores matched what I would expect for
those places on those days. I also used Claude to find the exact Open-Meteo
API shape (which endpoint, which daily fields exist) and confirmed every
field name by calling the live API myself before writing code against it.

This is a heuristic model, not a scientific one. There is no ground truth
to check the scores against, so "good" here means "matches common sense
about the activity," not "matches a verified formula."

## Scoring method (same shape for every activity)

Each activity has a small set of weather factors. Each factor turns one
weather value into a 0-100 sub-score. The factors are combined with
weights into one final 0-100 score, then bucketed into a label (Great /
OK / Poor / Bad). The code for this lives in `apps/api/src/scoring/`, one
file per activity, plus `helpers.ts` for the shared math.

- **Skiing**: fresh snowfall (40%), cold enough (25%), dry not rainy
  (15%), calm wind (20%). First version subtracted `snowfall_sum` (cm)
  from `precipitation_sum` (mm) to estimate rain — that mixes two
  different units and quietly punished pure-powder days for imaginary
  rain. Fixed by reading Open-Meteo's own `rain_sum` (mm, rain only)
  directly instead of deriving it.
- **Surfing**: wave height (50%), wave period (30%), calm wind (20%). Wave
  height uses a "sweet spot" shape (both too flat and too big score low),
  centered on 1.0-2.2m, since that is a reasonable target for an average
  recreational surfer, not a specific skill level or board.
- **Outdoor sightseeing**: comfortable temperature (35%), dry (25%), clear
  sky by weather code (25%), calm wind (15%).
- **Indoor sightseeing**: see the open question below — this one does not
  use the weighted-factor model on purpose.

## Open questions I closed myself (per the exercise's instructions)

The brief says: where you would normally check something with a product
manager, note the question and the assumption, and keep moving. Here is
that list.

1. **What does "indoor sightseeing" even mean, weather-wise?**
   Question: does bad outdoor weather make indoor sightseeing *better* (a
   good excuse to go to a museum), or is it mostly weather-independent?
   Assumption: I went with "mostly weather-independent." A museum is the
   same museum whether it is sunny or rainy outside — the weather does not
   make the exhibits better. So indoor sightseeing starts at a high score
   and is only reduced by conditions that make it hard to *get there*:
   a storm, extreme heat, or extreme cold. It does not go up just because
   outdoor conditions are bad. This is why it uses a simpler
   baseline-minus-penalties model instead of the weighted-factor one.

2. **What happens when a place has no coast?**
   Open-Meteo's Marine API only has data near coastlines. I tested this
   directly: an inland point (Chamonix) returns HTTP 200 with every wave
   value set to `null`, not an error. Assumption: I treat that as "not
   applicable," not "score 0." The API returns `score: null` and
   `label: "Not available"` for surfing in that case, and the frontend
   shows that plainly instead of a misleading low number.

3. **What if the place name is ambiguous** (e.g., more than one "Odessa")?
   First pass: I took Open-Meteo's top geocoding result and moved on. In
   practice that felt bad to use — typing "Ode" would silently resolve to
   whichever Odessa/Odense Open-Meteo ranks first, with no way to tell it
   meant a different one. I replaced free-text search with a
   `searchPlaces(query)` query that returns real candidates as the user
   types (debounced, via a PrimeReact `AutoComplete`), each labeled with
   its region, e.g. "Odesa, Ukraine" vs "Odessa, Texas, United States".
   `forecast` now takes the exact latitude/longitude/name/country the user
   picked, so there is no guessing left on the backend at all.

4. **How much history/skill level should scoring assume?**
   Assumption: none. There is no snow depth or base data in Open-Meteo, so
   skiing only scores "is this day getting good conditions" (fresh snow,
   cold, calm), not "is there a rideable base right now." Surfing assumes
   an average recreational surfer, not a specific skill level or board.
   This is a real limitation, not hidden: a genuinely great ski day needs
   an existing base, which this cannot see.

5. **GraphQL client on the frontend.**
   The app has exactly one query. I used a small hand-typed `fetch` call
   instead of Apollo or urql, and hand-wrote the matching TypeScript types
   instead of setting up GraphQL codegen. Both would be reasonable at a
   larger scale; here they would just be extra moving parts (YAGNI).

6. **Deploy target: GitHub Pages or Cloudflare?**
   Assumption: both frontend and backend on Cloudflare (Pages + a Worker),
   instead of splitting GitHub Pages (frontend) from Cloudflare (backend).
   GitHub Pages cannot run the GraphQL API at all (it is static-only), so
   the backend needed Cloudflare regardless — putting the frontend there
   too avoids managing two providers and two CORS configurations for one
   small app.

## Second pass: self-review (2026-09-07)

I went back through the code looking specifically for the kind of mistakes
that are easy to make and easy to miss — wrong units, swallowed errors,
information that only reaches part of the audience. Found and fixed:

- **Unit mismatch in skiing's rain math** (see above): mixed cm and mm.
  Caught by checking a real pure-snow day's numbers by hand instead of
  trusting that the formula looked reasonable.
- **`fetchMarine` was swallowing every error, not just "no coast".** I had
  written a `try/catch` meaning to catch the specific "this point is
  outside the marine grid" case, but it caught real network failures too
  — a genuine outage would have shown "This place has no coast" for a
  real coastal town. I checked this against live data (Mongolia, the
  Sahara, and deliberately invalid coordinates) and confirmed "no coast"
  is always a plain HTTP 200 with `null` values, never an error — so the
  error path can now be let through honestly, same as every other
  Open-Meteo call.
- **Score reasons were hover-only.** The tooltip looked like a nice touch
  but meant phone and keyboard users never saw why a day scored the way
  it did, which is the actual answer to "understand the answer" that the
  brief asks for. Shown as plain text under the badge from this round on.
  (Third pass changed *where* that text lives — see below — but it is
  still real text in the page, not a mouse-only tooltip.)
- **A misleading reason label**: "Overcast or stormy" showed up next to
  "Dry day" and could never actually fire for a genuinely overcast (but
  dry) day — the threshold only trips for rain/snow/showers/storms.
  Renamed to match what it actually detects.
- **Unused data**: `uv_index_max` was fetched and typed but no scorer
  read it, and a `latitude`/`longitude` selection in the frontend's
  forecast query was never rendered. Removed both rather than keep code
  a reader has to double-check for no reason.
- **Duplicated, drifting error copy**: the frontend had its own copy of
  the server's error text, including a `PLACE_NOT_FOUND` mapping for an
  error the backend can no longer raise (dead since the autocomplete
  redesign). The client now only owns the one error it originates
  (`NETWORK_ERROR`); anything the server raises uses the server's own
  message.
- **A loud, unreadable test log**: PrimeReact injects CSS at runtime that
  jsdom cannot parse, which prints thousands of lines per test run and
  could hide a real failure. Tried three fixes — a `console.error`
  override in `setupTests.ts`, a custom jsdom `virtualConsole` with
  `omitJSDOMErrors` passed via Vitest's `environmentOptions`, and
  Vitest's own `onConsoleLog` config hook — and none of them caught it.
  Traced why: Vitest runs each test file in a forked child process, and
  jsdom auto-wires its own `VirtualConsole` straight to that process's
  real `console` before any of those hooks can run or before the wiring
  can cross the process boundary (a live `VirtualConsole` instance can't
  even be sent to the fork — it holds closures, which fail Node's
  structured-clone). A real fix likely needs a different Vitest `pool`
  mode, which is a bigger change than this cosmetic issue justifies —
  cut for time rather than risk a piped/grepped test command quietly
  swallowing a real exit code, which would recreate the exact problem
  this was meant to fix.
- **No shape-checking on Open-Meteo's response**: `fetchJson` returned
  `any`, and a missing/`null` value would have quietly flowed into the
  scoring math as 0. Added a small check (no new dependency) that treats
  a malformed or incomplete response as an upstream error instead of a
  wrong score.

I also added: an aria-live region so screen readers announce when
results arrive, and a "Best: <day>" callout per activity row, since the
brief's own verb is "rank" and the table was previously just comparable
numbers with no explicit winner.

## Third pass: table redesign and its own review (2026-09-08)

The score table printed each day's reasons under every badge. With seven
days that meant "No new snow / Too warm for snow" seven times in one row,
about six lines per activity, and the numbers were lost in the noise.

- **The table is now a heatmap.** Each cell is a colour-filled tile with
  the score and its label; `ScoreBadge` became `ScoreTile`, since nothing
  in it is a badge any more.
- **Reasons moved into the tile's hover tooltip**, and — this is the part
  that matters — a visually hidden copy stays in the DOM. PrimeReact
  marks its tooltip `aria-hidden` while it is open and never links it to
  the target, so a tooltip alone would have quietly undone the second
  pass's fix above. The hidden span is what keeps the text real.
- **The search field got a search icon and a clear button**, sharing one
  slot with PrimeReact's own loading spinner.

I then reviewed this round the same way as the second pass, and fixed
what it found:

- A stuck tooltip. Making a tile focusable *and* setting the Tooltip to
  `event="both"` hits a PrimeReact bug: after any tile takes focus the
  library rebinds its listeners and drops `mouseleave`, so the tooltip
  stayed on screen. Dropping the focus path fixed it, and the hidden
  span meant no accessibility was lost by doing so.
- Four text colours below the WCAG 4.5:1 minimum, one of them a
  regression I had just introduced (the "Activity" header went from
  4.55:1 to 2.51:1). Measured, not guessed.
- The place lookup had no request ordering, so a slow answer could
  replace a newer one. Added a request id, plus a test that fails
  without it.
- The clear button emptied the field but left the old forecast on
  screen, with no way back to the start state.
- A 16x16 px tap target for that button, under the 24x24 minimum.
- `min-w-190` on the table silently meant "seven days"; it now follows
  `days.length`.
- `strict` was off in `tsconfig.app.json`. Turning it on cost zero
  errors, and it immediately caught a real one in new code.

## What I cut for time

- No caching of Open-Meteo responses — every search is a fresh live call,
  as the exercise allows ("calling Open-Meteo per request is fine here").
- No dark mode / responsive polish beyond a horizontally scrolling table
  on small screens. The exercise says visual design is not being assessed.
- No GraphQL codegen, no design system beyond PrimeReact's default theme.
