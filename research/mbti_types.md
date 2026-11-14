# MBTI layer: celebrity typings and per-type guidance

*Compiled 14 Nov 2026. Machine-readable version: `mbti_types.json`. Source IDs match `model_params.json`.*

## Where the celebrity types come from

These types are popular guesses, not test results. I could not find any of these people's official MBTI results, and only one of the 42 has stated a type in public: Ray Dalio, who wrote 'I'm an ENTP' on X in 2018. Everything else comes from fans voting or writers speculating from interviews and public behaviour. The main source is the Personality Database (personality-database.com), where anyone can vote on a public figure's type and the top-voted type is shown. That site could not be read directly during this research, so its typings were taken from an open, undated snapshot on GitHub (AKAazure/character-personality-database) and from personalitylist.com, which carries the same typings (it matched the snapshot in all 10 cases checked). Neither gives vote counts, and live votes may have moved since. Editorial sites (JobCannon, Truity) and the small Sakinorva vote databank were used as cross-checks; they often disagree. 'Strong consensus' means the Personality Database type was found and no other source checked contradicted it (single_source marks cases with nothing independent to compare). 'Disputed' means sources disagree or the type differs from the label the app already shows. Public personas are curated, so treat all of this as entertainment.

## Caveats

- Only **1 of 42** people has a verified self-report (Ray Dalio, ENTP). No other self-report could be verified; some may exist.
- **39 of 42** have a typing; **3** are left null (Adele, Simone Biles, Marcus Rashford) because sources conflict or are too thin.
- The Personality Database could not be read live. Types come from an undated snapshot and a mirror site, with no vote counts.
- Several crowd typings differ from the labels the app shows now (for example Bill Gates, Ray Dalio, Satya Nadella, Emma Watson, Serena Williams, Lewis Hamilton). See the notes in the JSON.
- E/I maps mostly onto Extraversion, S/N onto Openness, T/F onto Agreeableness, J/P onto Conscientiousness [MC1989]. The MBTI has no Neuroticism scale. The T/F and J/P links are weaker than the other two, so a type derived from Big Five scores is an approximation.
- Effects in these studies are small to moderate, mostly self-reported, and come from people who wanted to change. Evidence is strongest for emotional stability and Extraversion and weakest for Openness and Agreeableness [R2017]. The example tasks are written for this app in the style of the studies' challenges; they are not quoted from the papers.

## The 42 people in celebs.json

| Name | Type | Confidence | Note |
|---|---|---|---|
| Elon Musk | INTJ | strong consensus | No verified self-report found. He has called himself an introverted engineer, which is not a four-letter type. |
| Steve Jobs | ENTJ | disputed | ENTJ, INTJ and ISTP are all argued. |
| Bill Gates | ENTJ | disputed | The app currently labels him INTP. Crowd votes lean ENTJ, editorial sites say INTP or INTJ. |
| Mark Zuckerberg | INTJ | strong consensus |  |
| Jeff Bezos | ISTJ | disputed | The app currently labels him INTJ/ENTJ. |
| Jensen Huang | ENTJ | strong consensus |  |
| Satya Nadella | ENTJ | disputed (single source) | The app currently labels him INFJ. Only Personality Database lineage sources were found, and they say ENTJ. |
| Sam Altman | INTJ | disputed | INTJ versus ENTJ is an even split across the sources checked. |
| Warren Buffett | ISTJ | strong consensus |  |
| Charlie Munger | INTJ | strong consensus (single source) |  |
| Ray Dalio | ENTP | self-reported | The app currently labels him INTP. His own statement should take priority. |
| Cathie Wood | ENTJ | strong consensus (single source) | Only one source lineage found, likely with few votes. |
| Taylor Swift | ESFJ | disputed | Crowd votes favour ESFJ but she is one of the most argued-over typings. |
| Beyonce | ISFJ | disputed |  |
| Ed Sheeran | ISFJ | disputed | The app currently labels him ISFP/ENFP. |
| Billie Eilish | ISFP | strong consensus | The app currently labels her INFP. |
| Kendrick Lamar | INFJ | strong consensus (single source) |  |
| Harry Styles | ENFJ | disputed (single source) | The app currently labels him ENFP. Only Personality Database lineage sources were found. |
| Dua Lipa | ISFP | disputed (single source) | The app currently labels her ESTP/ENFJ. Only Personality Database lineage sources were found. |
| Stormzy | ISFP | disputed (single source) | The app currently labels him ENFJ. Only one source found, likely with few votes. |
| Adele | none | not typed | Left null because no typing could be confirmed as the common one. |
| Lionel Messi | ISFP | strong consensus (single source) |  |
| Cristiano Ronaldo | ESFP | disputed (single source) | The app currently labels him ESTJ/ESTP. |
| Serena Williams | ESFP | strong consensus | The app currently labels her ESTJ. |
| LeBron James | ESFJ | disputed (single source) | The app currently labels him ENFJ. Only Personality Database lineage sources were found. |
| Usain Bolt | ESTP | disputed | ESTP versus ESFP. The app currently labels him ESFP. |
| Simone Biles | none | not typed | Left null. |
| Lewis Hamilton | ISFP | disputed | The app currently labels him ENFP. |
| Roger Federer | ISFJ | strong consensus (single source) |  |
| Marcus Rashford | none | not typed | Left null. |
| Emma Raducanu | ENFJ | disputed (single source) | The app currently labels her INTJ. Only one source found, likely with few votes. |
| Keanu Reeves | INFP | strong consensus |  |
| Zendaya | ENFJ | disputed | The app currently labels her INFJ/ISFJ. |
| Tom Holland | ENFP | strong consensus |  |
| Timothee Chalamet | INFP | strong consensus |  |
| Dwayne Johnson | ESTP | disputed | The app currently labels him ESFJ/ESTJ. |
| Ryan Reynolds | ENTP | strong consensus |  |
| Margot Robbie | ESFJ | disputed (single source) | The app currently labels her ESTP/ENTJ. Only Personality Database lineage sources were found. |
| Emma Watson | ESTJ | disputed | The app currently labels her INFJ. No verified self-report found. |
| Pedro Pascal | ENFP | disputed |  |
| David Attenborough | INFP | disputed | The app currently labels him ENFP/INFJ. |
| Oprah Winfrey | ENFJ | disputed |  |

## Extra people to fill every type (Big Five percentiles are estimated from popular typing)

| Name | Field | Type | O | C | E | A | N |
|---|---|---|---|---|---|---|---|
| Albert Einstein | science | INTP | 97 | 55 | 35 | 60 | 40 |
| Charles Darwin | science | INTP | 95 | 75 | 25 | 70 | 55 |
| Alan Turing | science | INTP | 95 | 60 | 20 | 50 | 50 |
| Queen Elizabeth II | history | ISTJ | 40 | 92 | 40 | 60 | 20 |
| Denzel Washington | film | ISTJ | 60 | 88 | 45 | 55 | 25 |
| Robert Downey Jr. | film | ENTP | 88 | 50 | 85 | 50 | 50 |
| Mark Twain | history | ENTP | 92 | 45 | 75 | 45 | 50 |
| Carl Jung | science | INFJ | 97 | 70 | 30 | 60 | 50 |
| J. K. Rowling | writing | INFJ | 92 | 75 | 35 | 60 | 55 |
| Ayrton Senna | sport | INFJ | 80 | 90 | 35 | 60 | 50 |
| Robin Williams | film | ENFP | 95 | 40 | 92 | 80 | 65 |
| Walt Disney | film | ENFP | 95 | 65 | 75 | 60 | 45 |
| Rosa Parks | history | ISFJ | 50 | 85 | 25 | 80 | 30 |
| Jennifer Aniston | film | ESFJ | 55 | 75 | 75 | 82 | 45 |
| Hugh Jackman | film | ESFJ | 60 | 85 | 80 | 88 | 25 |
| Henry Ford | history | ESTJ | 60 | 92 | 65 | 25 | 35 |
| Martha Stewart | media | ESTJ | 65 | 96 | 70 | 35 | 35 |
| Jamie Dimon | finance | ESTJ | 55 | 90 | 75 | 40 | 30 |
| Bruce Lee | sport | ISTP | 75 | 85 | 40 | 45 | 30 |
| Clint Eastwood | film | ISTP | 55 | 70 | 25 | 35 | 20 |
| Tom Cruise | film | ISTP | 60 | 90 | 45 | 50 | 25 |
| Andy Murray | sport | ISTP | 50 | 85 | 25 | 50 | 45 |
| Madonna | music | ESTP | 75 | 75 | 88 | 30 | 40 |
| Conor McGregor | sport | ESTP | 55 | 60 | 95 | 20 | 45 |
| Novak Djokovic | sport | ESTP | 65 | 92 | 75 | 50 | 40 |
| Elvis Presley | music | ESFP | 65 | 35 | 90 | 75 | 60 |
| Bruno Mars | music | ESFP | 70 | 65 | 90 | 75 | 30 |

## People by type

- **ENFJ**: Harry Styles, Emma Raducanu, Zendaya, Oprah Winfrey
- **ENFP**: Tom Holland, Pedro Pascal, Robin Williams, Walt Disney
- **ENTJ**: Steve Jobs, Bill Gates, Jensen Huang, Satya Nadella, Cathie Wood
- **ENTP**: Ray Dalio, Ryan Reynolds, Robert Downey Jr., Mark Twain
- **ESFJ**: Taylor Swift, LeBron James, Margot Robbie, Jennifer Aniston, Hugh Jackman
- **ESFP**: Cristiano Ronaldo, Serena Williams, Elvis Presley, Bruno Mars
- **ESTJ**: Emma Watson, Henry Ford, Martha Stewart, Jamie Dimon
- **ESTP**: Usain Bolt, Dwayne Johnson, Madonna, Conor McGregor, Novak Djokovic
- **INFJ**: Kendrick Lamar, Carl Jung, J. K. Rowling, Ayrton Senna
- **INFP**: Keanu Reeves, Timothee Chalamet, David Attenborough
- **INTJ**: Elon Musk, Mark Zuckerberg, Sam Altman, Charlie Munger
- **INTP**: Albert Einstein, Charles Darwin, Alan Turing
- **ISFJ**: Beyonce, Ed Sheeran, Roger Federer, Rosa Parks
- **ISFP**: Billie Eilish, Dua Lipa, Stormzy, Lionel Messi, Lewis Hamilton
- **ISTJ**: Jeff Bezos, Warren Buffett, Queen Elizabeth II, Denzel Washington
- **ISTP**: Bruce Lee, Clint Eastwood, Tom Cruise, Andy Murray

## Per-type guidance

### INTJ, The Long-range Planner

Works out where things should be in five years, then quietly builds the plan to get there.

Strengths: strategic thinking, independence, high standards, following a plan through.

- (E up) Pick one small social action a week, such as starting a short conversation with a colleague you rarely speak to, and tick it off. In a 15-week study, students who actually completed weekly challenges like this rose in Extraversion; those who signed up and did not follow through went slightly backwards. [H2019]
- (A up) Practise one warm act a day for three months: thank someone specifically, or ask a question before giving your view. A three-month coaching app built on daily micro-tasks moved people's chosen traits, and friends and family noticed the change. [S2021]

### INTP, The Analyst

Likes taking ideas apart to see how they work, and would rather be accurate than quick.

Strengths: logical analysis, curiosity, original problem solving, staying objective.

- (C up) Turn finishing into if-then plans: 'If it is 9am, then I spend 25 minutes on the task I am avoiding.' Specific if-then plans helped people change in the direction they wanted over 16 weeks, while vague intentions did not. [HF2015]
- (E up) Share one half-formed idea out loud each week instead of waiting until it is perfect. Completing small weekly Extraversion challenges predicted real trait change over 15 weeks. [H2019]

### ENTJ, The Director

Sees what needs doing, organises people around it and expects results.

Strengths: decisive leadership, long-term planning, efficiency, confidence under pressure.

- (A up) In one meeting a day, summarise the other person's point to their satisfaction before you reply. Daily micro-tasks like this, kept up for three months through a coaching app, shifted chosen traits including Agreeableness. [S2021]
- (A up) Each week, complete one small act of trust or generosity, for example handing over a task without checking it. Trait change tracked the number of weekly challenges people finished, not the number they planned. [H2019]

### ENTP, The Challenger

Enjoys testing ideas by arguing with them, and is happiest when starting something new.

Strengths: quick thinking, inventiveness, debating and persuading, adapting fast.

- (C up) Choose one unfinished project and set a weekly challenge you can tick off, such as 'ship the dull last 10% by Friday'. Completed challenges predicted gains in Conscientiousness; abandoned ones predicted a small drop. [H2019]
- (A up) Write an if-then plan for disagreements: 'If I am about to argue the opposite side, then I first say what I agree with.' If-then plans were the ingredient that helped wanted change happen. [HF2015]

### INFJ, The Counsellor

Reads people well, cares about doing the right thing and prefers a few deep relationships.

Strengths: insight into people, commitment to values, careful planning, listening.

- (E up) Once a week, state a preference or say no in a low-stakes setting, such as choosing the restaurant. Assertiveness is part of Extraversion, and small completed challenges added up to trait change over 15 weeks. [H2019]
- (E up) Use a daily prompt for three months to start one conversation you would normally wait for. In the PEACH app trial, people who wanted to increase a trait changed, and the change was still there three months later. [S2021]

### INFP, The Idealist

Guided by personal values and imagination, and needs work that feels meaningful.

Strengths: empathy, creativity, authenticity, open-mindedness.

- (C up) Attach routine tasks to a cue: 'If I finish breakfast, then I clear my inbox for 15 minutes.' People with concrete if-then plans changed more than those with good intentions alone. [HF2015]
- (E up) Pick one small weekly step towards being more outgoing, such as posting your work or voicing an opinion in a group, and record that you did it. [H2019]

### ENFJ, The Mentor

Brings people together, notices what each person needs and likes to see others do well.

Strengths: communication, motivating others, organisation, warmth.

- (N down) Your four letters sit at the high end of the traits they map onto, and the MBTI has no scale for emotional stability. Check your Big Five Neuroticism score in this app instead: it is the trait that responds most to intervention (about half a standard deviation across 207 studies). [R2017]
- (C up) If you set a change goal, choose one and finish it. People who accepted challenges and did not complete them moved in the wrong direction, so fewer commitments kept is better than many started. [H2019]

### ENFP, The Enthusiast

Full of ideas and energy, connects easily with people and dislikes routine.

Strengths: enthusiasm, creativity, building rapport, spotting possibilities.

- (C up) Take one weekly Conscientiousness challenge that is almost too easy, such as arriving five minutes early or tidying one surface, and tick it off. Completion, not ambition, predicted change. [H2019]
- (C up) Use a daily two-minute planning check-in for three months. The PEACH trial used short daily tasks and reflection, and increases were confirmed by people who knew the participants. [S2021]

### ISTJ, The Organiser

Reliable and thorough, trusts what has been shown to work and keeps promises.

Strengths: dependability, attention to detail, calm consistency, sense of duty.

- (O up) Try one unfamiliar thing a week, such as a different route, cuisine or type of book, and note what you thought of it. App-based daily tasks moved Openness goals too, though the wider evidence for Openness is weaker than for other traits. [S2021]
- (E up) Complete one small social challenge a week, such as asking a colleague about their weekend. Finished challenges predicted higher Extraversion after 15 weeks. [H2019]

### ISFJ, The Supporter

Quietly looks after people and details, and remembers what matters to others.

Strengths: loyalty, practical kindness, patience, reliability.

- (E up) Practise speaking up: once a week, give your opinion before being asked. Assertiveness sits within Extraversion, which rose for people who completed weekly challenges. [H2019]
- (O up) Write an if-then plan for novelty: 'If I am invited to something new, then I say yes once this month.' If-then plans turned a wish to change into measurable change. [HF2015]

### ESTJ, The Manager

Gets things organised, sets clear rules and makes sure the work is done properly.

Strengths: organisation, directness, follow-through, taking responsibility.

- (A up) For three months, do one daily act that puts the relationship before the task: ask how someone is and wait for the answer. Daily micro-tasks delivered by app changed chosen traits, and observers saw the increases. [S2021]
- (O up) Each week, ask for one view that contradicts yours and write down what is right about it. Treat this as a completed challenge; change followed challenges done, not challenges chosen. [H2019]

### ESFJ, The Host

Sociable and considerate, keeps groups running smoothly and values tradition.

Strengths: cooperation, practical help, loyalty, reading the room.

- (O up) Add one new experience a week that is yours alone, such as a talk, a gallery or an unfamiliar subject. Openness goals were among those people chose and moved in the PEACH trial, though Openness is harder to shift than other traits. [S2021]
- (N down) The MBTI does not measure how much you worry about others' approval. If your Big Five Neuroticism score here is high, that is the most changeable trait in intervention research and a good first goal. [R2017]

### ISTP, The Troubleshooter

Calm and practical, learns by doing and likes to understand how things work.

Strengths: staying calm in a crisis, hands-on problem solving, self-reliance, efficiency.

- (E up) Complete one small weekly challenge that involves telling someone what you are thinking, such as explaining a decision out loud. Extraversion rose with the number of challenges completed. [H2019]
- (C up) Use if-then plans for the dull parts: 'If I finish a job, then I log it before starting the next.' Concrete plans beat general intentions over 16 weeks. [HF2015]

### ISFP, The Maker

Gentle and observant, lives in the present and expresses things through what they make or do.

Strengths: aesthetic sense, kindness, flexibility, attention to the present moment.

- (C up) Set one if-then plan for the week ahead: 'If it is Sunday evening, then I write my three priorities.' If-then planning was what helped people become more conscientious when they wanted to. [HF2015]
- (E up) Share one piece of work or one opinion with someone new each week and record it. Small completed social challenges predicted higher Extraversion. [H2019]

### ESTP, The Doer

Energetic and direct, acts first and adjusts as things happen.

Strengths: acting quickly, reading situations, negotiating, handling risk.

- (C up) Take one weekly challenge that delays a reward, such as finishing paperwork before the fun task. Conscientiousness increased for those who completed such challenges and dipped for those who skipped them. [H2019]
- (A up) For three months, do one small considerate act a day that nobody asked for. Daily tasks through a coaching app produced changes that other people could see. [S2021]

### ESFP, The Performer

Lively and generous, enjoys people and makes ordinary moments fun.

Strengths: energy, warmth, practical help in the moment, putting people at ease.

- (C up) Make an if-then plan for money or deadlines: 'If I am paid, then I move 10% to savings the same day.' Specific plans were the difference between wanting to change and changing. [HF2015]
- (O up) Spend 15 minutes a day for three months on one subject you know nothing about. Short daily tasks moved Openness goals in the PEACH trial, though expect a smaller shift than for other traits. [S2021]

## Sources

- **HF2015**: Hudson, N. W., & Fraley, R. C. (2015). Volitional personality trait change: Can people choose to change their personality traits? Journal of Personality and Social Psychology, 109(3), 490-507. https://doi.org/10.1037/pspp0000021
- **H2019**: Hudson, N. W., Briley, D. A., Chopik, W. J., & Derringer, J. (2019). You have to follow through: Attaining behavioral change goals predicts volitional personality change. Journal of Personality and Social Psychology, 117(4), 839-857. https://doi.org/10.1037/pspp0000221
- **S2021**: Stieger, M., Fluckiger, C., Ruegger, D., Kowatsch, T., Roberts, B. W., & Allemand, M. (2021). Changing personality traits with the help of a digital personality change intervention. Proceedings of the National Academy of Sciences, 118(8), e2017548118. https://doi.org/10.1073/pnas.2017548118
- **R2017**: Roberts, B. W., Luo, J., Briley, D. A., Chow, P. I., Su, R., & Hill, P. L. (2017). A systematic review of personality trait change through intervention. Psychological Bulletin, 143(2), 117-141. https://doi.org/10.1037/bul0000088
- **MC1989**: McCrae, R. R., & Costa, P. T. (1989). Reinterpreting the Myers-Briggs Type Indicator from the perspective of the five-factor model of personality. Journal of Personality, 57(1), 17-40. https://doi.org/10.1111/j.1467-6494.1989.tb00759.x
- **PDB_SNAPSHOT**: AKAazure. character-personality-database, pdb_dataset.csv (undated scrape of personality-database.com, about 12,000 profiles). https://github.com/AKAazure/character-personality-database
- **DALIO_X**: Dalio, R. [@RayDalio]. (2018). 'I'm an ENTP.' X. https://x.com/raydalio/status/989880073829351425 and https://twitter.com/RayDalio/status/1049447954531176448
