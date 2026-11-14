# Synthetic coach and explainer data, v2

> **Everything in this folder is SYNTHETIC.** The people are invented and the answers are composed from a hand-written library. The data exists to fine-tune Gemma on format, focus, tone and honest use of the research numbers. It is not evidence about anyone, and it must never be used in, or mixed into, the prediction-accuracy evaluation (`research/ipip_metrics.json`, `scripts/fit_ipip.py`). A test enforces that separation.

## What is here

| File | What it is |
|---|---|
| `train.jsonl`, `valid.jsonl`, `test.jsonl` | 5,661 / 306 / 324 examples in MLX-LM chat format: `{"messages":[{"role":"user",...},{"role":"assistant",...}]}` and nothing else |
| `meta/*.meta.jsonl` | One line per example, in the same order: task, synthetic flag, and coverage tags. Kept out of the training files so MLX sees only `messages` |
| `manifest.json` | Counts, seed, token estimates, and the full coverage tables |
| `SAMPLES.md` | Eight examples rendered for reading |

Train with it:

```bash
DATA=data/synthetic-v2 MODEL=<mlx-community gemma repo> ./scripts/finetune_gemma.sh train
```

The longest example is about 1,800 tokens by a conservative estimate, so the script's `--max-seq-length 2048` is enough.

## How each example is made

1. **A synthetic person.** Random questionnaire answers are run through the app's own model (`buildReport`), so every percentile, probability and four-letter type in a prompt is what the app would really show for those answers.
2. **The exact prompt the app serves.** The prompt builders are shared with the app: `src/lib/coachPrompt.ts`, `src/lib/futureSelfTemplate.ts` and `src/lib/explainPrompt.ts`.
3. **An ideal answer.** It is composed from a hand-written library (`scripts/synth/content.ts`, `scripts/synth/qa.ts`) by rules that follow the research: which traits to work on, how fast to ramp up, what size of change is realistic, and what to be cautious about.
4. **Validation.** `scripts/synth/validate.ts` recomputes every number from the prompt alone and rejects anything that fails. All 6,291 examples pass.

No language model wrote any of the answers, which is the difference from v1 (`scripts/make_coach_data.ts`, a distillation from a larger Gemma).

Regenerate, or make more:

```bash
node scripts/run-ts.cjs scripts/make_synth_v2.ts            # the committed set, byte for byte
node scripts/run-ts.cjs scripts/make_synth_v2.ts --n 20000  # a larger set
node scripts/run-ts.cjs scripts/synth/validate.ts           # re-check a folder
```

## Tasks

| Task | Share | Prompt | Answer keys |
|---|---|---|---|
| Coach plan | 3,889 | `buildCoachPrompt` (served by `/api/coach`) | `headline`, `summary`, `weeks` (8), `ifThen` (2), `watchOut`, `narration` |
| Question and answer | 881 | `buildExplainPrompt`, kind `question` | `answer`, `evidence`, `nextStep` |
| Forecast explanation | 440 | kind `forecast` | `headline`, `explanation`, `drivers`, `caveat` |
| Four-letter type explanation | 378 | kind `type` | `headline`, `explanation`, `closestCall`, `caveat` |
| Future-self voice note | 377 | `buildFutureSelfPrompt` (served by `/api/future-self`) | `text` |
| Baby temperament explanation | 326 | kind `baby` | `headline`, `explanation`, `mostCertain`, `caveat` |

Two things are ahead of the app. The explainer prompts are defined in `src/lib/explainPrompt.ts` but no route serves them yet. The coach prompt also accepts an optional "Extra context" block (estimated four-letter type, upbringing answers, standout facets, a self-given label, stage of life, expected events). The app does not send that block yet, so 1,461 coach examples have no context and match today's served prompt exactly. The rest teach the model to use the block when it arrives. Every context field is picked from a fixed list or is a clamped number (`src/lib/coachContext.ts`), so it cannot carry free text into a prompt.

## Coverage

| Dimension | Coverage |
|---|---|
| Four-letter types | All 16, at least 150 examples each (rare types are topped up) |
| Borderline types | 1,881 with no letter under 60%, 2,733 with one, 1,353 with two, 324 with three or four |
| Big Five patterns | All 243 low / mid / high combinations |
| Facets | All 30 IPIP-NEO facets appear as the thing a week practises, at least 250 times each |
| Ages | 16 to 70 in six bands, weighted towards 18 to 29 |
| Upbringing | Eleven named scenarios (warm and stable, strict and high-achieving, high adversity, always moving and so on) plus random answers, about 520 each |
| Baby temperament | Easy 2,902, Mixed 2,328, Slow-to-warm-up 539, Spirited 522, in both "from stories" and "worked backwards" modes |
| Questionnaire | 50-item IPIP 5,375, 10-item TIPI 916 |
| Coach targets | App archetypes 1,554, custom 1,267, "more like another type" 418, one gap only 435, already at target 215 |
| Coach focus | All five traits in both directions as the main gap, from 75 (neuroticism up) to 885 (conscientiousness up) |
| Stage of life | School, university, working, between jobs, caring full-time, retired |
| Other typologies | Enneagram (types and wings), DISC, Type A/B, the four temperaments, Keirsey, 16Personalities -A/-T, HEXACO, CliftonStrengths, "highly sensitive person", star signs. Always as a label the person gave, never as a measurement |

`manifest.json` has the exact numbers.

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

Safety is built into the data. Questions that ask for a diagnosis get "I can't tell you that" and a pointer to a GP. Messages that sound hopeless get a warm reply with Samaritans (116 123), a GP and 999. Plans for people very high in neuroticism say that coaching is not treatment. Under-18s get school-appropriate challenges.

## What the validators check

- **Format:** valid JSON, exactly the keys the prompt asks for, in order. No em or en dashes, no markdown fences, no unfilled template slots.
- **The app's own quality check** (`checkPlan`): eight weeks, every week on one of the two largest gaps, both gaps covered, if-then format, narration length.
- **Stricter than the app:** headline of eight words or fewer, summary of two or three sentences, weeks numbered 1 to 8, no repeated challenge, the larger gap never gets fewer weeks, exactly two if-then plans, a one-sentence caution, narration of 70 to 110 words that names the baby temperament.
- **Numbers:** every percentile and percentage in an answer must appear in the prompt or equal the app's expected 16-week figure (within 3 points), and must never overshoot the target.
- **Style:** British spelling, no clichés from a ban list, no diagnostic statements.
- **Safety:** distress and diagnosis questions must carry the right signposts.
- **Dataset:** MLX chat format only, no prompt repeated within or across splits, under 2,048 tokens, metadata in step with data.

The splits are by person, using a hash of the person's id, so they stay stable when more data is generated.

## Limits

- **Composed, not written fresh.** Coach plans are all distinct, but they are built from about 150 challenges and a few dozen sentence patterns. Expect a tuned model to sound like this library. That is the intent (vetted content, correct numbers), but it is narrower than human writing.
- **Fixed answers repeat.** Fourteen of the 49 question answers do not depend on the person, so each appears 8 times with different prompts. 5,959 of the 6,291 answers are unique.
- **Facets are not measured by the app.** The 50-item test scores five traits. Facets enter only through the optional context block.
- **Loss on `valid` and `test` measures fit to this library**, not coaching quality. Judge the tuned model with `scripts/eval_gemma.mjs` and by reading its plans.
- **Do not cite this data.** It contains no observations of real people.
