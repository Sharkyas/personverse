# Personalityverse

**Tagline:** Who were you before the world got to you? Estimate your baby temperament, see how upbringing moved you, and get sourced odds that each trait shifts by any age you pick.

## Inspiration

I study economics, finance and data science, so most of my week goes on models that put a probability on the future. Personality tests never do that. They give you four letters and treat them as permanent.

The research is far more interesting. Traits keep moving well into your thirties, and the family you grew up in, the bit everyone blames, explains close to nothing once you control for genes. I wanted a test that answered my actual questions. What was I like before anything happened to me? How far did my upbringing move me? What are the odds I change again?

Then I hit the catch. You can't measure personality at birth. Newborns have temperament, not Big Five traits, and infant temperament predicts adult personality only weakly (r ≈ .1 to .3). So the honest version of the idea became the product: show the weak link, show the wide uncertainty, and still say something useful.

## What it does

You start with who you are now: a 50-question Big Five test, one question at a time, using the public-domain IPIP markers and scored against norms we fitted on about 11,000 adults (a 10-question quick version is there if you're in a hurry). Then you answer questions anyone can actually answer: how you grew up, and what your parents are like. For each parent you rate five things, like "confident and outgoing" or "anxious or easily stressed", and say how sure you are. Nobody remembers being a baby, so by default the app **works backwards**. It treats you now, each parent and (optionally) the stories you've been told as noisy readings of the same hidden thing, your baby temperament, and combines them with Bayesian updating. You get a percentage chance of having been an easy, spirited, slow-to-warm-up or mixed baby, an 80% range for each trait, and a note on which clue told it the most. We checked in simulation that the 80% ranges contain the truth 80% of the time.

The results open with **your type**: your closest of the 16 four-letter types, with a full portrait (at your best, under stress, at work, with people, your growth edge), your Big Five in plain words, and how sure we are, letter by letter. Then six chapters, plus a tracker:

1. **Nature meets nurture.** Baby you, worked backwards, set against where you are now, with a genes / family / unique experience bar per trait.
2. **Your future selves.** The chance each trait shifts by at least half a standard deviation by your chosen age, with the drivers. A "time machine" chart runs from baby you to a fan of possible futures at 80. Under it sits a voice note from you at your chosen age, written by Gemma and spoken by ElevenLabs in a second voice.
3. **The multiverse.** Same baby, different worlds. Swap in a sheltered childhood or a hard-knocks one and watch the odds move, or pin two universes to compare them side by side.
4. **Choose your universe.** Pick an archetype like The Quant, or set your own targets. You get your odds under life as usual, weekly challenges, and challenges plus coaching. Gemma writes an 8-week plan.
5. **Your people.** Public figures whose typings sit closest to you, each flagged by how trustworthy the typing is.
6. **The MBTI version of you.** Your closest of the 16 types with a confidence level, the types you were most likely born as, the one you'll most likely be at your chosen age, and the chance your four letters change. Where a letter is too close to call, a few optional direct questions pin it down. Pick any other type and it shows which letters would have to flip, the Big Five trait behind each, and your odds of getting there in one and three years. Each of the 16 types has its own page with strengths, growth tips, UK prevalence and famous people.

We never measure MBTI directly. It sits on top of the Big Five using McCrae and Costa's (1989) correlations and the UK population split, because MBTI's own retest reliability is poor (only about half of people get the same four letters within weeks). The app says that on the page. Celebrity types are marked "said so themselves", "popular typing" or "disputed". Only one person on our list, Ray Dalio, has published his own result.

**Track yourself.** Every result has a tracker. Come back every few weeks, answer the same ten questions, and your check-ins are plotted against the forecast's expected path with an 80% band. The band includes the normal wobble of a ten-item test (six-week retest reliability .72), so one odd week doesn't get flagged. From three check-ins it fits a trend and says whether it's clear yet. There's a calendar reminder for eight weeks later.

ElevenLabs reads your results and the coach's plan aloud. Results get an anonymous share link with a preview image, plus a story-sized card showing your closest type. Send a friend a compare link and, once they finish, you see your two personalityverses side by side. The home page shows a live "multiverse census" from MongoDB Atlas.

## How we built it

- **Research first.** Before any UI I wrote a brief from 31 sources: twin studies, the Dunedin cohort, two stability meta-analyses, an intervention meta-analysis of 207 studies and the PEACH coaching trial. Every parameter carries a source ID, and the science page lists every source, more than 50 including the MBTI research.
- **More data, measured honestly.** We fitted the 50-item test on the open openpsychometrics.org Big Five dataset (19,631 people after cleaning) with a 70/30 split. On the 5,890 held-out people, reliability holds (alpha .79 to .89). For a tougher check we scored people on half the questions and asked the model for the chance the other half lands above average: AUC .80 to .89, well calibrated (expected calibration error .03 to .05), and when it's confident (about four in ten people per trait) it's right 87 to 92% of the time. The full test is more reliable than either half, so these are floors. Careless answering, from the same answer every time to a repeating 1, 5, 1, 5 pattern, is caught and flagged. The age bands also reproduce the maturation pattern the forecast uses: over-50s score higher on conscientiousness (+.35 SD) and lower on neuroticism (−.37 SD).
- **The model** is about 500 lines of pure TypeScript, so every slider recomputes in the browser. Temperament feeds a predicted adult profile at r = .25 (shrunk to .15 if you're guessing), upbringing adds small sourced effects, and the forecast combines rank-order stability (Bleidorn et al., 2022), normative maturation (Roberts et al., 2006) and life events to get P(|Δ| ≥ 0.5 SD).
- **The backcast** is a small Gaussian conditioning problem. Baby temperament is the hidden variable. You now (r ≈ .25 after removing the predicted pull of your upbringing), each parent (heritability ÷ 2, discounted by how sure you are, using Connelly and Ones' 2010 data on observer accuracy) and your stories are the readings. Solving it gives a mean and spread per trait, and a seeded Monte Carlo turns those into odds for each baby type.
- **The MBTI layer** maps each letter to a probability from your Big Five scores, with weights scaled to how reliable your test was (the 50-question test explains more of every MBTI scale than the 10-question one), then runs a 5,000-draw simulation for born, now and later. Paths between types push the driver trait by sourced intervention effect sizes.
- **Over 200 automated tests** (plus live Postgres and Atlas tests), including checks that the model reproduces published figures: rank-order stability by age, maturation from 20 to 70, the therapy effect on neuroticism and the birth-order null. The Science page shows the same comparison as a table.
- **Next.js 15**, TypeScript and Tailwind 4, with hand-built SVG charts.
- **Gemma 4, running locally** through Ollama, writes the coaching plan and the future-self voice note, so nobody's answers about their childhood leave the laptop. The app picks the best Gemma installed (never an embedding model). Each prompt is grounded with the tested challenges for your own two biggest gaps, as worked examples to adapt. We prompt for JSON, parse leniently and validate the shape; if Gemma is unavailable, a curated challenge library (or a template, for the voice note) takes over. `scripts/eval_gemma.mjs` scores the coach on 20 synthetic profiles: valid output, whether the weekly challenges target the right traits, format and latency.
- **ElevenLabs** `eleven_multilingual_v2` streams MP3 narration in two voices: a narrator for your results and coach, and a separate one for future you. Without a key it falls back to the browser's speech engine.
- **MongoDB Atlas** stores anonymous profiles, serves `/r/:id` share links and friend comparisons, and runs two aggregations: a `$group` for the census, and a nearest-neighbour pipeline that finds your "baby twins", the real people whose baby temperament was closest to yours, and shows where they ended up. The sample profile is flagged so it never counts as anyone's twin. If Atlas is unreachable the app switches to a local store for a minute and retries, so a dropped connection never breaks a demo.
- **Tiger Data** stores tracker check-ins in a TimescaleDB hypertable partitioned by month, with a retention policy that deletes check-ins after three years. A `time_bucket()` query gives the weekly pulse across everyone. Plain Postgres or a local file take over if it isn't configured.
- **Hosting** is the laptop itself behind a Cloudflare tunnel, so the public link uses the same local Gemma. A Docker Compose setup with Caddy is in the repo for a cloud server.
- **Entire** records the AI-assisted coding sessions behind the project into git alongside the commits, so the human and AI workflow is inspectable.

## Challenges we ran into

Working backwards was humbling. With only "who you are now", the 80% range for baby you covers most of the scale, and parents narrow it less than you'd hope, because personality is only about 40% heritable and you only get half of each parent's genes. We decided the wide range is the result and built the page around explaining it, rather than tightening it with made-up precision.

The hardest part was not overclaiming. "You were 82nd percentile in openness as a baby" sounds precise and is mostly noise. So the temperament weight shrinks with recall confidence, the bands are wide, and the caveats sit on the results page itself.

Some numbers didn't exist in usable form. We couldn't get the per-decade table from Roberts, Walton and Viechtbauer (2006) during the event, so we rebuilt it to match the published totals and flagged it. Most life-event sizes are the same story: the direction is sourced, the size is our reading, marked "est." in the app.

Stability coefficients are published at a typical retest gap of 6.7 years. We needed them for any gap, from one year to sixty, so we interpolate to r = 1 at zero years and follow Bleidorn's lag slope beyond 6.7.

## Accomplishments that we're proud of

- Every number on screen traces to a paper or is labelled as our estimate.
- The app asks your birth order and then tells you it has no measurable effect (Rohrer et al., 2015, n > 20,000). Myth-busting felt better than flattery.
- The multiverse recomputes the whole model live, so "what if I'd grown up differently" is a click.
- It still works with no API keys at all. Every external service has a fallback.

## What we learned

Shared family environment for adult traits is roughly zero. Adopted siblings raised in the same house end up barely more alike than strangers. I didn't believe it until I read the twin and adoption data.

Change on purpose is real but modest. Interventions average d = .37 over a median of 13 weeks, and emotional stability moves most. In the PEACH app trial, even friends and partners noticed people's increases. And in Hudson et al. (2019), people who completed weekly challenges changed, while people who accepted challenges and then failed them drifted the other way.

## What's next

- Use tracker check-ins to update each person's forecast (a proper Bayesian update), not just plot them against it. With enough people, that becomes a small longitudinal study we can calibrate the model on.
- Check the estimated parameters against the original tables before anyone takes the numbers seriously.

## Tracks

- **Marshall Wace: New Worlds.** It opens a door you can't normally see through: the person you might have been in a different childhood, and the odds on the people you could become. The multiverse makes counterfactuals something you can click.
- **DurHack: Combinations.** The whole app is a combination problem: nature with nurture, temperament with upbringing and life events. Underneath, it combines more than 50 sources, and four kinds of evidence about baby you, into one working model.
- **MLH Best Use of ElevenLabs.** Two voices: a narrator reads your results and coaching plan, and a second voice plays a voice note from you at 35 (or whatever age you pick).
- **MLH Best Use of MongoDB Atlas.** Anonymous profiles, shareable result links and a live aggregation across everyone who has taken the test.
- **MLH Best Use of Tiger Data.** The trait tracker is time-series data by nature. Check-ins go into a hypertable, old ones expire on a retention policy, and `time_bucket()` powers the weekly view.
- **MLH Best Use of Entire.** Entire captured the AI coding sessions behind the build and links them to the commits they produced, so you can see how each feature was planned, prompted and checked.

## Built with

nextjs, react, typescript, tailwindcss, gemma, ollama, elevenlabs, mongodb-atlas, tiger-data, timescaledb, postgresql, entire, cloudflare, docker, node.js, python, svg

**Try it:** [LIVE LINK] · **Code:** [REPO LINK]
