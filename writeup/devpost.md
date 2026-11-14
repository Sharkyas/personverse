# Personalityverse

**Tagline:** Who were you before the world got to you? Estimate your baby temperament, see how upbringing moved you, and get sourced odds that each trait shifts by any age you pick.

## Inspiration

I study economics, finance and data science, so most of my week goes on models that put a probability on the future. Personality tests never do that. They give you four letters and treat them as permanent.

The research is far more interesting. Traits keep moving well into your thirties, and the family you grew up in, the bit everyone blames, explains close to nothing once you control for genes. I wanted a test that answered my actual questions. What was I like before anything happened to me? How far did my upbringing move me? What are the odds I change again?

Then I hit the catch. You can't measure personality at birth. Newborns have temperament, not Big Five traits, and infant temperament predicts adult personality only weakly (r ≈ .1 to .3). So the honest version of the idea became the product: show the weak link, show the wide uncertainty, and still say something useful.

## What it does

You answer 29 questions in about four minutes: twelve about you as a baby and toddler (modelled on Rothbart's and Thomas and Chess's temperament work), six about how you grew up, and the Ten-Item Personality Inventory for who you are now. Then you pick an age to forecast to and the life events you expect.

The results page is told in five chapters:

1. **Nature meets nurture.** Baby you, what the model predicted from your temperament and upbringing, and where you actually are, with a genes / family / unique experience bar per trait.
2. **Your future selves.** The chance each trait shifts by at least half a standard deviation by your chosen age, with the drivers. A "time machine" chart runs from baby you to a fan of possible futures at 80. Under it sits a voice note from you at your chosen age, written by Gemma from the model's expected profile and spoken by ElevenLabs in a second voice.
3. **The multiverse.** Same baby, different worlds. Swap in a sheltered childhood or a hard-knocks one and watch the odds move.
4. **Choose your universe.** Pick an archetype like The Quant, or set your own targets. You get your odds under life as usual, weekly challenges, and challenges plus coaching. Gemma writes an 8-week plan.
5. **Your people.** Public figures whose popular typings sit closest to you. Labelled as fun.

ElevenLabs reads your results and the coach's plan aloud. Results get an anonymous share link, and the home page shows a live "multiverse census" from MongoDB Atlas.

## How we built it

- **Research first.** Before any UI I wrote a brief from 31 sources: twin studies, the Dunedin cohort, two stability meta-analyses, an intervention meta-analysis of 207 studies and the PEACH coaching trial. Every parameter carries a source ID, and the science page lists all 34 sources we ended up using.
- **The model** is about 300 lines of pure TypeScript, so every slider recomputes in the browser. Temperament feeds a predicted adult profile at r = .25 (shrunk to .15 if you're guessing), upbringing adds small sourced effects, and the forecast combines rank-order stability (Bleidorn et al., 2022), normative maturation (Roberts et al., 2006) and life events to get P(|Δ| ≥ 0.5 SD).
- **Next.js 15**, TypeScript and Tailwind 4, with hand-built SVG charts.
- **Gemma** through the Gemini API writes the coaching plan and the future-self voice note. It tries `gemma-3-27b-it`, then `gemma-3-12b-it`. Gemma has no JSON mode, so we prompt for JSON and parse leniently. If both fail, a curated challenge library (or a template, for the voice note) takes over.
- **ElevenLabs** `eleven_multilingual_v2` streams MP3 narration in two voices: a narrator for your results and coach, and a separate one for future you. Without a key it falls back to the browser's speech engine.
- **MongoDB Atlas** stores anonymous profiles, serves `/r/:id` share links and runs a `$group` aggregation for the census.
- **Vultr** Cloud Compute runs the app in Docker. One script installs Docker, builds the image and starts it on port 80.

## Challenges we ran into

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

- Let people retake the test after 8 weeks and compare against their own forecast, which would turn the app into a small longitudinal study.
- Replace the TIPI with a longer validated inventory for people who want more precision.
- Check the estimated parameters against the original tables before anyone takes the numbers seriously.

## Tracks

- **Marshall Wace: New Worlds.** It opens a door you can't normally see through: the person you might have been in a different childhood, and the odds on the people you could become. The multiverse makes counterfactuals something you can click.
- **DurHack: Combinations.** The whole app is a combination problem: nature with nurture, temperament with upbringing and life events. Underneath, it combines 34 sources into one working model.
- **MLH Best Use of Gemini API.** Gemma via the Gemini API writes a personal 8-week plan grounded in the volitional change research, plus a message from your future self, both as JSON we validate before showing.
- **MLH Best Use of ElevenLabs.** Two voices: a narrator reads your results and coaching plan, and a second voice plays a voice note from you at 35 (or whatever age you pick).
- **MLH Best Use of MongoDB Atlas.** Anonymous profiles, shareable result links and a live aggregation across everyone who has taken the test.
- **MLH Best Use of Vultr.** Dockerised and deployed to Vultr Cloud Compute with a one-command setup script.

## Built with

nextjs, react, typescript, tailwindcss, gemma, gemini-api, google-genai, elevenlabs, mongodb-atlas, vultr, docker, node.js, svg

**Try it:** [LIVE LINK] · **Code:** [REPO LINK]
