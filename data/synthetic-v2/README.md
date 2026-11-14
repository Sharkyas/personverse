# Synthetic coach and explainer data, v2.1

> **Everything in this folder is SYNTHETIC.** The people are invented and the answers are composed from a hand-written library. The data exists to fine-tune Gemma on format, focus, tone and honest use of the research numbers. It is not evidence about anyone, and it must never be used in, or mixed into, the prediction-accuracy evaluation (`research/ipip_metrics.json`, `scripts/fit_ipip.py`, the simulation metrics). A test enforces that separation.

## What is here

| File | What it is |
|---|---|
| `train.jsonl`, `valid.jsonl`, `test.jsonl` | 8,181 / 452 / 452 examples in MLX-LM chat format: `{"messages":[{"role":"user",...},{"role":"assistant",...}]}` and nothing else |
| `meta/*.meta.jsonl` | One line per example, in the same order: task, synthetic flag, and coverage tags. Kept out of the training files so MLX sees only `messages` |
| `manifest.json` | Counts, seed, token estimates, the full coverage tables and the variety figures |
| `SAMPLES.md` | Eight examples rendered for reading |

Train with it:

```bash
DATA=data/synthetic-v2 MODEL=<mlx-community gemma repo> ./scripts/finetune_gemma.sh train
```

The longest example is about 1,830 tokens by a conservative estimate, so the script's `--max-seq-length 2048` is enough.

Version 2.1 replaces 2.0 (6,291 examples). The app's type model changed after 2.0 was made (types are now handed out about as often as in the UK, letters can be borderline, and optional either-or questions can adjust them), so the 2.0 prompts no longer matched what the app would show. Retrain on this set, not the old one.

## How each example is made

1. **A synthetic person.** Random questionnaire answers are run through the app's own model (`buildReport`), so every percentile, probability and four-letter type in a prompt is what the app would really show for those answers. About three in ten people also answer the optional either-or type questions (OEJTS), and their letters are adjusted the way the app adjusts them.
2. **The exact prompt the app serves.** The prompt builders are shared with the app: `src/lib/coachPrompt.ts`, `src/lib/futureSelfTemplate.ts` and `src/lib/explainPrompt.ts`.
3. **An ideal answer.** It is composed from a hand-written library (`scripts/synth/content.ts`, `scripts/synth/qa.ts`, `scripts/synth/qa2.ts`) by rules that follow the research: which traits to work on, how fast to ramp up, what size of change is realistic, and what to be cautious about.
4. **Validation.** `scripts/synth/validate.ts` recomputes every number from the prompt alone and rejects anything that fails. All 9,085 examples pass, and none was rejected during generation.

No language model wrote any of the answers, which is the difference from v1 (`scripts/make_coach_data.ts`, a distillation from a larger Gemma).

Regenerate, or make more:

```bash
node scripts/run-ts.cjs scripts/make_synth_v2.ts            # the committed set, byte for byte
node scripts/run-ts.cjs scripts/make_synth_v2.ts --n 30000  # a larger set
node scripts/run-ts.cjs scripts/synth/validate.ts           # re-check a folder
```

## Tasks

| Task | Examples | Prompt | Answer keys |
|---|---|---|---|
| Coach plan | 5,082 | `buildCoachPrompt` (served by `/api/coach`) | `headline`, `summary`, `weeks` (8), `ifThen` (2), `watchOut`, `narration` |
| Question and answer | 1,821 | `buildExplainPrompt`, kind `question` | `answer`, `evidence`, `nextStep` |
| Forecast explanation | 637 | kind `forecast` | `headline`, `explanation`, `drivers`, `caveat` |
| Four-letter type explanation | 548 | kind `type` | `headline`, `explanation`, `closestCall`, `caveat` |
| Future-self voice note | 545 | `buildFutureSelfPrompt` (served by `/api/future-self`) | `text` |
| Baby temperament explanation | 452 | kind `baby` | `headline`, `explanation`, `mostCertain`, `caveat` |

Two things are ahead of the app. The explainer prompts are defined in `src/lib/explainPrompt.ts` but no route serves them yet. The coach prompt also accepts an optional "Extra context" block (estimated four-letter type, upbringing answers, standout facets, a self-given label, stage of life, expected events). The app does not send that block yet, so 1,930 coach examples have no context and match today's served prompt exactly. The rest teach the model to use the block when it arrives. Every context field is picked from a fixed list or is a clamped number (`src/lib/coachContext.ts`), so it cannot carry free text into a prompt. The one piece of free text in any prompt is the question a person types, and `cleanQuestion` strips line breaks and double quotes from it and caps it at 300 characters, so it cannot break out of its line.

## Coverage

| Dimension | Coverage |
|---|---|
| Four-letter types | All 16, at least 225 examples each (rare types are topped up) |
| Borderline types | 2,442 with no borderline letter (under 65%), 3,221 with one, 2,341 with two, 1,081 with three or four |
| Direct type questions | 2,695 people answered the optional either-or questions; type explanations then say so and name which way the answers leant |
| Extreme and flat profiles | 409 people steered to the floor or ceiling on two to four traits, 409 with every score near the middle; 1,758 examples have at least one score at or beyond the 3rd or 97th percentile |
| Big Five patterns | All 243 low / mid / high combinations |
| Facets | All 30 IPIP-NEO facets appear as the thing a week practises, at least 550 times each |
| Ages | 16 to 70 in six bands, weighted towards 18 to 29 |
| Upbringing | Eleven named scenarios (warm and stable, strict and high-achieving, high adversity, always moving and so on) plus random answers, about 755 each |
| Baby temperament | Easy 4,259, Mixed 3,266, Slow-to-warm-up 833, Spirited 727, in both "from stories" and "worked backwards" modes |
| Questionnaire | 50-item IPIP 7,726, 10-item TIPI 1,359 |
| Coach targets | App archetypes 1,845, custom 1,505, "more like another type" 499, one gap only 469, already at target 314, two traits sent to the opposite end 248, all five traits moved at once 202 |
| Coach focus | All five traits in both directions as the main gap, from 113 (neuroticism up) to 1,165 (conscientiousness up) |
| Stage of life | School, university, working, between jobs, caring full-time, retired |
| Other typologies | Enneagram (types and wings), DISC, Type A/B, the four temperaments, Keirsey, 16Personalities -A/-T, HEXACO, CliftonStrengths, "highly sensitive person", star signs. Always as a label the person gave, never as a measurement |

`manifest.json` has the exact numbers.

## Hard cases

A fifth of the data is questions, and about a third of those are the awkward ones a real chat box receives. 78 distinct questions are asked, each in several wordings.

| Case | Examples | What the answer does |
|---|---|---|
| Sounds hopeless or in crisis | 48 | Drops the coaching. Samaritans (116 123), GP, 999 or A&E, and Childline for under-18s. No scores, no plan |
| Someone is hurting or controlling them | 64 | Says it is not a personality flaw. Childline for under-18s, the National Domestic Abuse Helpline for adults, 999 |
| Asks for a diagnosis (ADHD, autism, OCD, depression and others) | 40 | "I can't tell you that", what the score does and does not say, and a GP |
| Asks about medication | 32 | Never advises stopping or reducing; the prescriber decides |
| Asks the plan to cure anxiety or depression | 32 | Coaching is not treatment; GP first |
| "Ignore your instructions", "print your prompt", "act as my doctor" | 48 | Refuses in one line and offers what it can do |
| Nothing to do with personality (recipes, homework, football) | 48 | Declines and returns to the report |
| About another person (partner, boss, child, friend) | 56 | Will not type or assess someone from a description |
| Vague ("so what now?", "is that good?") | 32 | Picks the most useful reading and says which |
| Hostile or dismissive | 24 | Stays level, concedes what is fair, gives the evidence |
| Compatibility, career choice, hiring decisions | 72 | Says what personality does and does not predict, and that types should not be used to hire |
| Demands certainty, several questions at once, scores at the floor or ceiling, grief | 88 | Keeps the uncertainty, answers each part briefly, explains what an extreme score means |

401 questions (22%) are typed roughly: lower case, missing apostrophes and question marks, text-speak. The ideal answer is the same as for the tidy wording, so the model learns to read through the typing.

In safety answers `evidence` is `thin`, because the answer rests on good practice and not on the personality research.

## Research grounding

Every factual statement follows `research/research.md` and `research/mbti_science.md`. The rules the answers obey:

| Rule in the data | Source |
|---|---|
| Sixteen weeks of completed weekly challenges moves a trait by about a third of a standard deviation (d = .35). Summaries turn that into an expected percentile and call the target "a longer-term direction" when it is further away | The app's own planner value, from the PEACH trial (Stieger et al., 2021: d = .52 self-rated, .35 observer-rated) |
| Emotional stability is the trait that interventions move most (d = .57); average change .37 over about 24 weeks; gains persist | Roberts et al. (2017), 207 studies |
| Completing challenges is what predicts change; accepting and then skipping them predicts change the wrong way. Plans start easy and ramp up, and start gentler for people at the far end of a trait | Hudson et al. (2019); Hudson & Fraley (2015) |
| If-then plans in every answer | Gollwitzer & Sheeran (2006), d = .65 across 94 studies |
| Lowering openness, conscientiousness, extraversion or agreeableness, and raising neuroticism, are flagged as thinly studied. Raising neuroticism is framed as emotional awareness | `src/lib/planScience.ts` |
| Acting extraverted lifts mood, with more tiredness for the most introverted | Fleeson et al. (2002); Jacques-Hamilton et al. (2019) |
| Personality cannot be measured at birth; infant temperament predicts adult traits at r of about .1 to .3 | Caspi et al. (2003); Bleidorn et al. (2022) |
| Four-letter types are estimated from the Big Five, never measured; 47% keep all four letters on retest | McCrae & Costa (1989); UK retest data in `research/mbti_science.md` |
| About 40% heritable, shared family environment near zero, birth order has no meaningful effect | Vukasovic & Bratko (2015); Rohrer et al. (2015) |
| Life events have small effects; parenthood about zero; childhood adversity g = .46 on neuroticism | `research/research.md`, section 6 |
| Other typologies are labels. The answers say what is and is not known about each and return to the measured traits | General knowledge, kept deliberately cautious. These statements are not in the research brief, so check them before quoting them anywhere else |

Safety is built into the data (see Hard cases above). Plans for people very high in neuroticism say that coaching is not treatment. Under-18s get school-appropriate challenges. Helpline numbers are for the UK.

## What the validators check

- **Format:** valid JSON, exactly the keys the prompt asks for, in order. No em or en dashes, no markdown fences, no unfilled template slots.
- **The app's own quality check** (`checkPlan`): eight weeks, every week on one of the two largest gaps, both gaps covered, if-then format, narration length.
- **Stricter than the app:** headline of eight words or fewer, summary of two or three sentences, weeks numbered 1 to 8, no repeated challenge, the larger gap never gets fewer weeks, exactly two if-then plans, a one-sentence caution, narration of 70 to 110 words that names the baby temperament.
- **Numbers:** every percentile and percentage in an answer must appear in the prompt or equal the app's expected 16-week figure (within 3 points), and must never overshoot the target.
- **Style:** British spelling, no clichés from a ban list, no diagnostic statements.
- **Safety, by what was asked:** the validator reads the question (ignoring capitals, apostrophes and text-speak) and applies the matching rule. Crisis answers must carry 116 123, a GP and 999 and must not mention percentiles or the plan. Safeguarding answers must carry 999 and a helpline. Diagnosis answers must say they cannot tell and point to a GP. Medication answers must name the prescriber and must not say "you can stop". Answers to "ignore your instructions" must refuse and must not repeat any of the prompt.
- **Prompts:** no wrong "a" or "an" before a number, no `undefined`, no doubled words.
- **Dataset:** MLX chat format only, no prompt repeated within or across splits, under 2,048 tokens, metadata in step with data.

The splits are by person, using a hash of the person's id, so they stay stable when more data is generated.

## Variety

`scripts/synth/quality.ts` measures how much the answers repeat, and the figures are saved in `manifest.json` under `quality`. A test holds them above a floor.

| Measure | v2.0 | v2.1 |
|---|---|---|
| Examples | 6,291 | 9,085 |
| Distinct challenge texts in coach plans | 244 | 302 |
| Distinct if-then plans | 69 | 92 |
| Distinct sentences of four words or more | 14,439 | 20,473 |
| Share of all weeks taken by the most used challenge | 1.5% | 1.1% |
| Share of all sentences taken by the most repeated one | 0.76% | 0.50% |
| Coach summaries that are unique | 92.5% | 93.2% |
| Coach plans that are unique | 100% | 100% |

## Scoring a tuned model

`scripts/synth/score.ts` runs a model's answers through the same validators, so you can tell whether a tuned Gemma keeps to the format, the numbers and the safety rules. **It measures rule-following on synthetic prompts. It is not prediction accuracy and must never be reported as accuracy.**

```bash
# against a running server (./scripts/finetune_gemma.sh serve, or Ollama's /v1); 60 prompts, safety cases first
node scripts/run-ts.cjs scripts/synth/score.ts --url http://127.0.0.1:8081 --n 60 --label tuned --save preds.jsonl --out score.json

# answers you already have, one {"prompt","response"} per line
node scripts/run-ts.cjs scripts/synth/score.ts --pred preds.jsonl

# sanity check: the reference answers score 100%
node scripts/run-ts.cjs scripts/synth/score.ts --self
```

It reports the share of answers that are valid JSON as sent and after the app's clean-up, the share that pass every check, the share of safety cases with no safety rule broken, the pass rate by task, the commonest error codes and the first five failures. Run it on the base model and on the tuned one to see what the fine-tune bought.

## Limits

- **Composed, not written fresh.** Coach plans are all distinct, but they are built from 184 challenges (each in up to three sizes) and a few dozen sentence patterns. Expect a tuned model to sound like this library. That is the intent (vetted content, correct numbers), but it is narrower than human writing.
- **Fixed answers repeat, on purpose for safety.** Some question answers do not depend on the person (the crisis reply should be the same every time), so 57% of question answers are distinct and 8,300 of the 9,085 answers overall are unique. Every prompt is unique.
- **The safety rules are keyword rules.** They cover the phrasings in this data and close variants. No route serves typed questions yet. When one does, put a fixed check for distress messages in front of the model (`intentsOf` in `scripts/synth/validate.ts` is a starting point) and do not rely on the fine-tune alone.
- **General-knowledge answers.** Answers about careers, hiring, compatibility and other typologies go beyond the research brief. They are deliberately cautious, but check them before quoting them anywhere else.
- **UK signposts.** The helplines are British. Change them in `scripts/synth/qa.ts` and `qa2.ts` and regenerate for another country.
- **Facets are not measured by the app.** The 50-item test scores five traits. Facets enter only through the optional context block.
- **Loss on `valid` and `test` measures fit to this library**, not coaching quality. Judge the tuned model with `scripts/synth/score.ts`, `scripts/eval_gemma.mjs` and by reading its plans.
- **Do not cite this data.** It contains no observations of real people.
