---
title: "I tried to measure who you were at birth. The science said no, so I built the honest version."
published: false
description: "Personalityverse: a hackathon app that estimates your baby temperament, how upbringing moved you, and the odds each Big Five trait shifts by any age you pick. With the maths."
tags: hackathon, nextjs, ai, datascience
cover_image: [COVER IMAGE LINK]
---

What would you be like if nothing had happened to you?

No strict parent, no house move in Year 5, no first job. Just the person who arrived. That was the pitch I took to DurHack 2026: a personality test that works out who you were *before the world got to you*, shows how far life pulled you from it, and gives you the odds of changing again.

About an hour into the research I found out the pitch was impossible.

## You can't measure personality at birth

Newborns don't have a Big Five profile. There is no openness score for a three-week-old. What babies have is **temperament**: how active they are, how easily they're frightened, how fast they calm down, and later, how well they hold their attention. Rothbart, Thomas and Chess, and Kagan have measured it for decades.

The bad news is how weakly it carries forward. In the Dunedin study, which followed 1,037 children from age 3 to 26, the "undercontrolled" toddlers ended up about a third of a standard deviation higher in neuroticism as adults. Real, but small. Across the literature, infant temperament predicts adult traits at roughly r = .1 to .3.

And my app can't even observe the baby. It has to ask you what you were like, which means asking you to remember what your parents told you they remembered.

So I had two options. Drop the idea, or build it and be loud about the uncertainty. I went with loud.

## The model, in three layers

Everything lives in one file, `model.ts`, about 300 lines of TypeScript with no dependencies. It runs in the browser, so every slider on the results page recomputes instantly.

### Layer 1: baby you → predicted adult

Twelve questions ("I cried a lot and was hard to soothe once upset") each load onto one or more traits. A weighted mean gives a temperament z-score per trait. Then the key step: temperament only gets a weight of r = .25, and that shrinks if you admit you're guessing.

```ts
// Detailed parental stories keep r = .25. "Mostly guessing" drops it to .15.
const rEff = TEMPERAMENT_TO_ADULT_R * clamp(1.3 - 0.5 * a.confidence, 0.55, 1);

let m = rEff * T[t];                 // what baby you contributes
let explained = rEff * rEff;
for (const k of Object.keys(UPBRINGING) as Upbringing[]) {
  const e = UPBRINGING[k].d[t] * uz[k];   // warmth, harshness, adversity, money, moves
  m += e;
  explained += (UPBRINGING[k].d[t] * 0.9) ** 2;
}
mu[t] = m;
sd[t] = Math.sqrt(Math.max(0.5, 1 - explained));
```

With r = .25, baby you explains about 4% of the variance in adult you, and the app prints that number at the top of Chapter 1. Upbringing effects are small too, mostly ±0.1 SD, with childhood adversity the largest (a meta-analysis of 136 studies puts it at g = .46 for neuroticism).

The standard deviation that comes out is close to 1. The model is saying: here's a nudge, but you could have turned out almost anywhere. That's the most honest sentence the app produces.

### Layer 2: how stable are you?

For the future, the question is how much of who you are now survives to the age you pick. Bleidorn et al. (2022) pooled 189 samples and 178,000 people and found rank-order stability climbs steeply to about .74 at age 25 and then barely moves. Those figures are at a typical retest gap of 6.7 years, so I disattenuate for measurement error (÷ .88), interpolate to r = 1 at zero years, and follow their lag slope beyond that.

For a 20-year-old forecasting 15 years ahead, that gives r ≈ .64.

### Layer 3: the odds of a big shift

Change over the window is treated as normal:

```
E[Δ] = (r − 1)·z_now  +  maturation(age → target)  +  Σ life events
SD   = √(1 − r²)
P(big shift) = P(|Δ| ≥ 0.5 SD)
```

The first term is regression to the mean, which is what imperfect stability looks like. Maturation comes from Roberts, Walton and Viechtbauer (2006): on average people get calmer and more conscientious, mostly between 20 and 40. Life events like university, a first job or long unemployment add their own small shifts.

```ts
const regress = (r - 1) * nowZ[t];
let mu = regress + mat[t];
for (const e of events) {
  // events play out over a few years
  mu += LIFE_EVENTS[e].d[t] * Math.min(1, years / EVENT_WINDOW_YEARS);
}
const sd = Math.sqrt(1 - r * r);
return {
  pChange: pAbsBeyond(mu, sd, MEANINGFUL_CHANGE_SD),
  pUp: pAbove(mu, sd, MEANINGFUL_CHANGE_SD),
  pDown: phi((-MEANINGFUL_CHANGE_SD - mu) / sd),
};
```

A worked example. Say you're 20, at the 72nd percentile for neuroticism (z ≈ 0.58), heading to university and then a first job, and you set the forecast to 35:

- regression: (0.64 − 1) × 0.58 ≈ −0.21
- maturation from 20 to 35: −0.43
- university and first job: −0.15 and −0.10
- so E[Δ] ≈ −0.89, with SD ≈ 0.77

That's a 73% chance of a big shift, 69% of it downwards (calmer) and 4% upwards. The time machine chart draws the same thing as a fan widening from "you now" out to 80.

Under the chart there's a card called "A voice note from you, aged 35". It sends your current and expected percentiles to Gemma, which writes 60 to 90 words from your most likely future self, and ElevenLabs plays it in a different voice from the narrator. The prompt bans predictions about jobs, partners and money, and the card says underneath that it's a story, not a prophecy. It's the least scientific feature in the app, and my favourite.

Why half a standard deviation? It's the usual threshold for a minimal important difference, and it's roughly a decade of conscientiousness growth for a young adult. Small enough to happen, big enough that your friends would notice.

## What surprised me in the research

**Your family barely shows up.** Twin and adoption studies put the shared family environment at roughly zero for adult personality. Heritability is about 40%. The other 55 to 60% is experience unique to you, plus measurement error. The results page shows this as a three-colour bar per trait, and the yellow "shared family" slice is a sliver. Parenting style feeds in through that sliver, which is why the upbringing effects are so small.

**Birth order does nothing.** Rohrer, Egloff and Schmukle (2015) tested more than 20,000 people and found no meaningful effect on personality. The app still asks where you sit among your siblings, because everyone has a theory about it, and then gives it a weight of exactly zero. The science page explains why.

**You can change on purpose, a bit.** Roberts et al. (2017) reviewed 207 intervention studies, mostly therapy, and found an average change of d = .37 over a median of 13 weeks. Emotional stability moved most. The PEACH trial (Stieger et al., 2021) gave 1,523 people three months of smartphone coaching. Self-reported change in the direction people wanted was about d = .5. Friends and partners noticed increases too (d = .35), though their ratings of decreases weren't significant.

The detail that changed how I built the coach came from a separate study (Hudson et al., 2019): people who *completed* weekly challenges changed. People who accepted challenges and then failed them changed in the opposite direction. So the plan starts small on purpose, and the fallback plan's first if-then rule is "If I feel like skipping a challenge, then I'll do the smallest two-minute version of it."

## Choosing your universe

Chapter 4 lets you pick a target, either an archetype like The Quant (high openness and conscientiousness, low neuroticism) or your own sliders. For each trait it shows the odds of getting within a quarter of an SD of the target under three strategies: life as usual, 16 weeks of weekly challenges, and challenges plus coaching or therapy.

Then Gemma writes the plan through the Gemini API, trying `gemma-4-31b-it` first, then `gemma-4-26b-a4b-it`, then `gemma-3-27b-it`. I don't rely on a JSON mode, so the instructions go in the prompt and the parser strips fences and slices from the first brace to the last. If no model answers in time, a hand-written challenge library builds the plan instead.

ElevenLabs narrates the results and the coach's message. MongoDB Atlas stores anonymous profiles for share links and friend comparisons, and runs a `$group` aggregation for the "multiverse census". Share links come with a card rendered on the server, so they preview properly in group chats. It all runs in Docker on Vultr.

Every integration has a fallback, because hackathon Wi-Fi is hackathon Wi-Fi. No AI key means a curated challenge library. No ElevenLabs key means the browser's own voice. No Atlas means a local store. If the network drops mid-demo, the browser builds the plan itself.

## Trade-offs I made, and what's weak

- **Recall is the weakest link.** "Baby you" is a memory of someone else's memory. The model shrinks it, but it can't fix it.
- **The TIPI is ten items.** Validated and fast, but noisy. A longer inventory would suit anyone who wants precision.
- **Some numbers are mine.** I couldn't get the per-decade maturation table from the 2006 meta-analysis during the hackathon, so I rebuilt it to match the published totals. Most life-event sizes are reasoned estimates where the papers give a direction but no clean effect. The app marks each one "est.".
- **The normal model is generous.** It predicts about 40 to 50% of adults shift by half an SD per decade. A strict Reliable Change Index would give roughly a third of that. I'd call our numbers an upper bound.
- **It's population averages.** The evidence is mostly self-report from Western samples, and life-event effects are correlational: your traits also shape which events happen to you.
- **The celebrity matches are for fun.** They're popular typings, not tests anyone took. The page says so.

## What I'd do next

A retest. If people come back after their 8-week plan, we can compare them against their own forecast, which turns a hackathon toy into a small longitudinal dataset.

I came in wanting to tell people who they were at birth. I'm leaving with an app that mostly tells them how little anyone can know about that, and how much is still up for grabs. I think that's the better product.

**Try it:** [LIVE LINK]
**Code:** [REPO LINK]

*Built at DurHack 2026 by ilyas, BSc Economics, Finance and Data Science at Imperial.*
