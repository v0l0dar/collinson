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
  (15%), calm wind (20%). Open-Meteo's `precipitation_sum` includes snow's
  water content, so I only count precipitation as a bad sign (rain) once
  I subtract the part that fell as snow.
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

3. **What if the place name is ambiguous** (e.g., more than one "Paris")?
   Assumption: I take Open-Meteo's top geocoding result, which it ranks by
   relevance and population. I did not build a disambiguation picker
   (e.g., "did you mean Paris, France or Paris, Texas?") — that is a real
   product decision I would normally check, and I am cutting it for time.

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

## What I cut for time

- No place picker for ambiguous names (see above).
- No caching of Open-Meteo responses — every search is a fresh live call,
  as the exercise allows ("calling Open-Meteo per request is fine here").
- No dark mode / responsive polish beyond a horizontally scrolling table
  on small screens. The exercise says visual design is not being assessed.
- No GraphQL codegen, no design system beyond PrimeReact's default theme.
