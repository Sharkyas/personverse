# Personalityverse: 2-minute demo script

**Before you go on stage**

- Open [LIVE LINK] on the home page in a full-screen browser tab. Zoom to 90% so the results cards fit.
- Sound on, laptop volume at about 70%. Test one ElevenLabs clip first so the API is warm.
- Second tab: `/science`, already open.
- Pitch deck (12 slides): https://claude.ai/artifact/FFVzMPqjAc8TFBWm9SSDLN
- Backup: if the Wi-Fi dies, every feature still works without keys (browser voice, challenge library, local store). Say "this is the offline fallback" and keep going.
- The numbers below come from the built-in sample profile. If the model changes before judging, rerun it once and update them.

**The sample profile at a glance** (age 20, forecasting to 35, university + first job + living abroad)

| | Openness | Conscientiousness | Extraversion | Agreeableness | Neuroticism |
|---|---|---|---|---|---|
| Baby you | 80 | 54 | 50 | 41 | 81 |
| Model predicted | 59 | 52 | 50 | 50 | 60 |
| You now | 72 | 38 | 52 | 60 | 72 |
| Chance of a big shift by 35 | 54% | 72% | 55% | 54% | 77% |

Temperament type from their stories: Spirited. Cross-checked against them now and their parents (the "Your stories, cross-checked" card): Spirited 12%, which is 1.2× the usual 10%, with a wide 80% range on every trait. Average chance of a big shift: 62%.

MBTI: closest type ISFP (The Maker), but only a 10% chance, with ESFP (9%) and INFP (8%) close behind. Most likely born ISFJ, most likely ENFP by 35, and a 52% chance at least one letter changes by then. The letter most likely to flip is E/I (22%).

---

## The 20-second opening hook

> "Who were you before the world got to you? We wanted to measure your personality at birth. Turns out you can't: babies have temperament, not personality, and it predicts the adult you only weakly. So we built the honest version. It estimates baby you, shows how far life moved you, and gives you the odds you change again. Every number comes from a paper."

(About 55 words. Say it on the home page with the radar visible behind you.)

---

## The 2-minute walkthrough

| Time | On screen | Click | Say |
|---|---|---|---|
| 0:00 to 0:15 | Home page | Nothing yet | The hook above, shortened: "Who were you before the world got to you? You can't measure personality at birth, so we built the honest version." |
| 0:15 to 0:22 | Quiz, step 1 | Click **Find my other selves →**. Type "Judges" in the name box. Click **Just looking? Skip ahead with a sample profile**. | "The real test asks who you are now, how you grew up and what your parents are like, because nobody remembers being a baby. Then it works backwards. I'll skip to a sample." |
| 0:22 to 0:32 | Results hero | Click **Listen to your results**. Let it play about 4 seconds, then click **Stop**. | "This person started life Spirited. On average, a 62% chance each trait shifts meaningfully by 35. ElevenLabs reads the whole thing out if you'd rather listen." |
| 0:32 to 0:44 | Chapter 1 table | Scroll to Chapter 1. Point at the Neuroticism row, then the yellow sliver in the genes bar. | "Baby you was 81st percentile in neuroticism. Temperament and upbringing predicted 60. They're actually at 72. Baby you only explains about 4% of adult you. And look how thin the yellow bar is: shared family environment is close to zero in twin studies. Underneath, we work it backwards too, combining you now, your parents and your stories with Bayesian updating. The honest answer is a wide range, and we show it." |
| 0:44 to 1:08 | Chapter 2 cards, time machine, voice note | Point at the Neuroticism card (77%). In the time machine, click **Conscientiousness**, then back to **Neuroticism**. Click **Receive it** on the voice note card while you talk, then **Play voice note** and let it run about 10 seconds. | "77% chance their neuroticism moves by half an SD, almost all of it downwards. That's stability from 189 samples plus normal maturation plus the life events they picked. The fan is the range of futures. And this is a voice note from them at 35, written by Gemma and spoken in a second ElevenLabs voice." |
| 1:08 to 1:22 | Chapter 3, multiverse | Click **The hard-knocks universe**, pause, then **The growth universe**. | "Same baby, different worlds. Hard knocks: neuroticism up 13 percentile points by 35, conscientiousness down 13. Growth, with therapy and a stable relationship: down 15, extraversion up 11. Everything recomputes in the browser." |
| 1:22 to 1:45 | Chapter 4, target | Click **The Quant**. Point at the Openness and Neuroticism bars. Click **in 3 years**. Click **Build my plan ✦**. | "Pick who you want to be. Getting to Quant-level openness in a year: 33% if you do nothing, 64% with weekly challenges, 71% with coaching. Calm is harder: 1% on your own, 32% over three years with coaching. Gemma writes an 8-week plan from the change research." |
| 1:45 to 1:52 | Chapter 6, MBTI | Scroll to Chapter 6. Point at the Born / Now / At 35 cards. | "And because everyone asks: MBTI. We don't measure it, we derive it from the Big Five. Closest is ISFP, but only 10%, and there's a 52% chance the letters change by 35. Click any type to see what it would take." |
| 1:52 to 2:00 | `/science` tab | Switch tabs, scroll once. | "Every number, its source, and every estimate flagged. More than 50 sources. Thanks." |

**If you have 20 seconds spare:** on the results page click **Compare with a friend**, and show the side-by-side page from a second profile you made earlier. Say: "Send this to a friend, and you see how alike you were as babies and who's likelier to change." Then hold up the story card download.

**If you have another 15 seconds:** on the results page click **Start tracking →**, then **See an example year (simulated)**. Say: "Come back every few weeks, answer ten quick questions, and see if you're moving the way we said. The band includes how noisy a ten-question test is, so we don't flag a bad week. It runs on Tiger Data."

**If you're running short:** cut the MBTI beat and the Conscientiousness click. Never cut the voice note or the multiverse.

**If Gemma is slow:** the voice note and the plan both fall back after 25 seconds. Keep talking through the multiverse and come back to them.

---

## Likely judge questions

**"Isn't this pseudoscience?"**
It's the opposite of a horoscope. It uses the Big Five, the model personality researchers actually use, and every parameter traces to a published study: twin meta-analyses, the Dunedin cohort, stability meta-analyses covering more than 178,000 people, and an intervention review of 207 studies. The first thing the app tells you is that personality can't be measured at birth. We ask about birth order and then weight it at zero, because a 20,000-person study found no effect.

**"How accurate is it?"**
For the part we can test, we did: the 50-question test is scored on an open dataset of about 19,600 people, and on 5,890 people we held back, a score from half the questions predicts the other half with AUC .80 to .89, and when it's confident it's right about nine times in ten. The forecasts are another matter: we can't validate individual predictions in 36 hours. What we can say: the baby part is weak by design (r = .25, about 4% of variance), the forecasts are population probabilities, and our normal-distribution model is probably an upper bound. A strict reliable-change test would give about a third of our shift rates. We say all of this on the results page and the science page.

**"Why Gemma and not Gemini?"**
Gemma is open weights, so it runs on my laptop through Ollama and nobody's answers about their childhood have to leave the machine. The public link is a tunnel to the same laptop, so even the live site uses the local model. We ground each prompt with the tested challenges for your two biggest gaps, score the coach with our own eval script, and fine-tuned it with MLX on synthetic plans written by the bigger Gemma and filtered by quality checks. If no model answers, a curated challenge library takes over, so the coach never blocks the demo.

**"What's novel here?"**
The research exists in pieces: temperament studies, stability meta-analyses, maturation curves, life-event studies, intervention trials. As far as we know nobody had chained them into one forecast you can play with. The counterfactual multiverse and the "odds of reaching a target under three strategies" view are new as consumer features.

**"Hard knocks moves neuroticism a lot. Didn't you say family barely matters?"**
The near-zero shared environment finding is about normal variation between families. Severe adversity is different: a meta-analysis of 136 studies puts it at g = .46 for neuroticism. The hard-knocks universe sets every dial to the extreme at once. Because those factors overlap, we cap their combined effect at 0.6 SD per trait, which is why it moves you about 13 points rather than 30.

**"Why half a standard deviation?"**
It's the standard threshold for a minimal important difference, and it's roughly a decade of conscientiousness growth in your twenties. Big enough that people around you would notice.

**"Can you actually change your personality?"**
Somewhat. Interventions average d = .37 over a median of 13 weeks, and emotional stability moves most. In the PEACH app trial, friends and partners noticed the increases too. The catch, from Hudson et al. (2019): people who took on weekly challenges and failed them drifted the other way, so the plan starts small.

**"Which numbers are estimates?"**
The per-decade maturation table (rebuilt to match the published totals) and most life-event sizes, where papers give a direction but not a clean effect size. They're marked "est." on the science page.

**"What happens to my data?"**
No account, no email. Your first name is only used for narration and is stripped before saving. MongoDB stores the answers and a summary under a random ID for the share link.

**"Why MBTI if it's unreliable?"**
Because everyone asks for it. So we built it on top of the Big Five instead of measuring it, using McCrae and Costa's 1989 correlations and the UK population split. That lets us be honest about it: the app shows the chance your type is right (often only 10 to 20%) and the chance it changes. MBTI's own retest data has only about half of people keeping the same four letters within weeks, and we say so on the page. Celebrity types are labelled "said so themselves", "popular typing" or "disputed". Only Ray Dalio on our list has published his own.

**"How can you know what I was like as a baby without asking about it?"**
We can't know, and the app says so. It treats you now, each parent's personality and any stories you've been told as noisy readings of one hidden thing, and combines them by Gaussian conditioning. Each clue gets a weight from the research: you now correlates about .25 with baby temperament, a parent shares half their genes and personality is about 40% heritable, and how sure you are about each parent discounts it further. We checked in simulation that the 80% ranges contain the truth 80% of the time.

**"What would you do next?"**
A retest after the 8-week plan, so people can check themselves against their own forecast. That turns the app into a small longitudinal study.

---

## 30-second sponsor pitches

**Marshall Wace: New Worlds**
"Your track asked for a door to the unexplored. The most unexplored place I know is the version of you that never happened. Personalityverse turns more than 50 sources into a probabilistic model, so you can step into a world where you had a harder childhood, or spent your twenties abroad, and see your odds change. As an economics and data science student, the part I'm proudest of is that it's a proper forecast: expected change, variance from measured stability, and a probability at the end, with every assumption on show."

**MongoDB Atlas**
"Atlas does three jobs. Each finished test is saved as one anonymous document: the answers, with the name stripped, plus a summary. That ID becomes a shareable link at `/r/:id`, so you can send someone your personalityverse, or send a compare link and see both of you side by side once they finish. The results page runs a nearest-neighbour pipeline to find your baby twins, the real people whose baby temperament was closest to yours, and shows where they ended up. And the home page runs a `$group` aggregation across every profile for a live multiverse census: how many people have mapped themselves, the average shift odds per trait, and the mix of baby temperament types. If Atlas is unreachable, it drops to a local store for a minute and then retries, so the demo never breaks."

**ElevenLabs**
"We use two voices. A narrator reads your results and your coaching plan, so the whole report works as audio. Then there's the voice note from future you: Gemma writes 60 to 90 words from your most likely self at 35, and a second ElevenLabs voice speaks it. Hearing a different voice say 'it's you, at 35' lands in a way text doesn't. It's `eleven_multilingual_v2`, streamed as MP3, with the browser's voice as a fallback."

**Entire**
"We built this with AI agents, so we recorded that too. Entire captures each coding session (the prompts, the plan, the tool calls) and links it to the commits it produced, so you can see how a feature was asked for, built and checked. It's how we kept the AI honest: every change can be traced back to what we actually asked for."

**Tiger Data**
"Personality change is a time series, so the tracker stores it like one. Each check-in is five scores and a timestamp in a TimescaleDB hypertable on Tiger Data, partitioned by month, with a retention policy that deletes check-ins after three years. Your page plots them against your own forecast, and a `time_bucket()` query gives the weekly average across everyone. If the database is unreachable it falls back to a local store for a minute, like Atlas."

