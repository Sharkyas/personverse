/*
 * Questions people ask about their results, with the ideal answer for each (SYNTHETIC, hand-written).
 * Facts follow research/research.md and research/mbti_science.md. Other typologies (Enneagram, DISC, star signs and
 * so on) are treated as labels: the answer says what is and is not known and comes back to the measured traits.
 * Anything that sounds like a request for a diagnosis, or like distress, is answered with care and a signpost.
 */
import { TRAIT_META, type Trait } from "@/lib/params";
import type { CoachContext } from "@/lib/coachLibrary";
import { pick, type Rnd, type Profile } from "./profiles";
import { expected16, ord } from "./writers";

export type QA = {
  id: string;
  /** topic tag for coverage stats */
  topic: "change" | "origins" | "types" | "labels" | "life" | "method" | "safety" | "edge";
  /** hard-case tag for coverage stats (off-topic, injection, crisis and so on) */
  edge?: string;
  /** How often the question comes up relative to the others. Default: 3 when the answer uses the person's scores, 1 when it is fixed. */
  weight?: number;
  when?: (p: Profile) => boolean;
  q: (p: Profile, r: Rnd) => string;
  evidence: "strong" | "some" | "thin";
  a: (p: Profile, r: Rnd, q: string) => string;
  next: (p: Profile, r: Rnd) => string;
  ctx?: (p: Profile, r: Rnd, q: string) => CoachContext | undefined;
};

export const tn = (t: Trait) => TRAIT_META[t].name.toLowerCase();
/** Plain words for a percentile that read correctly after "you are" or "that makes you". */
const DESC: Record<Trait, [string, string, string, string, string]> = {
  O: ["very practical and down to earth", "practical, with a taste for the familiar", "balanced between the new and the familiar", "curious and imaginative", "very curious and full of ideas"],
  C: ["very spontaneous and flexible", "relaxed about plans", "organised when it matters", "organised and dependable", "very disciplined and thorough"],
  E: ["very reserved", "on the quiet side", "in the middle between quiet and outgoing", "outgoing and sociable", "very outgoing"],
  A: ["very direct and competitive", "frank and sceptical", "warm but firm", "kind and cooperative", "very warm and accommodating"],
  N: ["very calm", "calm under pressure", "about average for ups and downs", "someone who feels things strongly", "very sensitive to stress"],
};
export const tw = (t: Trait, pct: number) => DESC[t][pct < 10 ? 0 : pct < 35 ? 1 : pct < 65 ? 2 : pct < 90 ? 3 : 4];
export const lowest = (p: Profile, among: Trait[] = ["O", "C", "E", "A"]) => [...among].sort((a, b) => p.nowPct[a] - p.nowPct[b])[0];
export const mbtiCtx = (p: Profile): CoachContext => ({ mbti: { type: p.mbti, letters: p.letters.map((l) => ({ letter: l.letter, p: Math.max(0.5, l.p) })) } });
export const weakest = (p: Profile) => [...p.letters].sort((a, b) => a.p - b.p)[0];
const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const KEIRSEY = (t: string) => (t[1] === "N" ? (t[2] === "T" ? "Rational" : "Idealist") : t[3] === "J" ? "Guardian" : "Artisan");
const quadrant = (p: Profile) => {
  const e = p.nowPct.E >= 50;
  const n = p.nowPct.N >= 50;
  return e ? (n ? "choleric" : "sanguine") : n ? "melancholic" : "phlegmatic";
};

export const QAS: QA[] = [
  {
    id: "fixed",
    topic: "change",
    q: (p, r) => pick(r, [`Is my personality basically fixed now that I'm ${p.age}?`, "Can personality actually change, or am I stuck like this?", "Isn't personality set in stone by the time you're an adult?"]),
    evidence: "strong",
    a: (p) =>
      `No. Personality is stable but not fixed. How people rank against each other settles a lot by about 25, yet average levels keep moving for decades: most people become more conscientious and calmer, mainly between 20 and 40. In one study that followed people for 50 years, between a fifth and three fifths changed reliably on any given trait. ${p.age < 30 ? `At ${p.age} you are in the stretch of life where change is fastest.` : `At ${p.age} change is slower than in your twenties, but it has not stopped.`} Deliberate practice adds to that, and it works best one or two traits at a time.`,
    next: () => "Pick the one trait you would most like to shift and write down what you would do differently on an ordinary day if it had.",
  },
  {
    id: "genes",
    topic: "origins",
    q: (_, r) => pick(r, ["How much of my personality is genetic?", "Is personality nature or nurture?", "Was I just born this way?"]),
    evidence: "strong",
    a: () =>
      "Roughly 40% of the differences between people on each Big Five trait are down to genes, according to a pooling of studies covering more than 100,000 people. Almost none of the rest comes from the home you shared with your siblings. It comes from experiences unique to you, plus measurement noise. Two things follow. Heritable does not mean unchangeable: height is far more heritable and still depends on diet. And the genetic share shrinks with age, from about 70% in infancy to about 40% in adults, because life keeps adding its own influence.",
    next: () => "Note one way you differ from a parent or sibling, and what in your own life might explain it.",
  },
  {
    id: "parents",
    topic: "origins",
    q: (_, r) => pick(r, ["Did my parents make me the way I am?", "How much did my upbringing shape my personality?", "Is it my parents' fault I'm like this?"]),
    evidence: "strong",
    a: (p) =>
      `Less than most people assume. Parents pass on genes, which explain about 40% of trait differences, but the home environment that siblings share explains close to none of the adult differences between them. Ordinary variation in parenting, warmer or stricter, shifts adult traits by around a tenth of a standard deviation. Serious adversity is the exception: it is linked to noticeably higher neuroticism. ${p.answers.upbringing.adversity >= 4 ? "You reported a lot of hard things in childhood, so that link may apply to you, as an average tendency and not a verdict." : "Nothing in your answers suggests an unusually large effect either way."} What you do from here matters more.`,
    next: () => "Write down one habit you picked up at home that you would keep, and one you would swap.",
    ctx: (p) => ({ upbringing: { warmth: p.answers.upbringing.warmth, harshness: p.answers.upbringing.harshness, adversity: p.answers.upbringing.adversity } }),
  },
  {
    id: "birthorder",
    topic: "origins",
    q: (p, r) => {
      const pos = ["an only child or the oldest", "one of the older ones", "the middle child", "one of the younger ones", "the youngest"][p.answers.upbringing.birthOrder - 1];
      return pick(r, [`I'm ${pos}. Does that explain my personality?`, `Does being ${pos} affect what I'm like?`, "Is the birth order thing true?"]);
    },
    evidence: "strong",
    a: () =>
      "It is a good story, but the evidence says no. The largest study on this looked at more than 20,000 people in three countries and found no meaningful effect of birth order on any Big Five trait. Firstborns score a touch higher on intelligence tests and rate their own intellect slightly higher, and that is about it. Older studies often found differences because they asked families to compare siblings, and the eldest is simply older. That is why birth order does not move any of your numbers in this app.",
    next: () => "Ask a sibling or old friend to describe you in three words and see whether birth order comes into it at all.",
  },
  {
    id: "therapy",
    topic: "change",
    q: (_, r) => pick(r, ["Would therapy change my personality?", "Can therapy or coaching actually shift traits?", "Is it worth getting coaching to change my personality?"]),
    evidence: "strong",
    a: (p) =>
      `Yes, measurably. A review of 207 studies found that therapy and similar programmes shifted personality by about a third of a standard deviation on average, usually within six months, and the gains lasted a year or more. The effect is largest for emotional stability, at about half a standard deviation, and smaller for the other traits. The kind of therapy mattered little. ${p.nowPct.N >= 65 ? `With your neuroticism at the ${ord(p.nowPct.N)} percentile, that is the trait where you would have the most to gain.` : `Your neuroticism is at the ${ord(p.nowPct.N)} percentile, so the trait therapy moves most is not where your biggest gap is likely to be.`}`,
    next: () => "If cost is the obstacle, ask your GP what talking therapies are free in your area before deciding.",
  },
  {
    id: "wanting",
    topic: "change",
    q: (_, r) => pick(r, ["Is wanting to change enough?", "If I really want to be different, will it just happen?", "Do I have to do the challenges or is setting the goal enough?"]),
    evidence: "some",
    a: () =>
      "Wanting helps a little, and doing helps a lot. In studies that followed students for about 15 weeks, those who simply wanted to change a trait did shift modestly in that direction. The larger effect came from completing small weekly challenges tied to the trait. There was a sting in the tail: people who accepted challenges and then did not do them drifted slightly the opposite way. Concrete plans in the form 'if X happens, then I will do Y' helped, and vague good intentions did not. So choose challenges small enough that you will actually finish them.",
    next: () => "Write one if-then plan for tomorrow and put it where you will see it.",
  },
  {
    id: "howlong",
    topic: "change",
    q: (_, r) => pick(r, ["How long until I actually change?", "How many weeks before I see a difference?", "When will the plan start working?"]),
    evidence: "some",
    a: () =>
      "Think in months. The trials that show change measure it at about three to four months: in the largest one, 1,500 people using a coaching app for three months moved by about half a standard deviation on the traits they chose, by their own ratings. Friends and family noticed too, though they saw a smaller change, and the gains were still there three months after the coaching ended. In the first fortnight most people only feel that they are acting out of character. That is expected, because behaviour shifts first and the trait follows.",
    next: () => "Put a reminder in your calendar 12 weeks from today to retake the test and compare.",
  },
  {
    id: "howfar",
    topic: "change",
    q: (p, r) => {
      const t = lowest(p);
      return pick(r, [`Can I get my ${tn(t)} from the ${ord(p.nowPct[t])} percentile up to the 90th?`, `I'm at the ${ord(p.nowPct[t])} percentile for ${tn(t)}. How high could I realistically get?`]);
    },
    when: (p) => p.nowPct[lowest(p)] <= 45,
    evidence: "some",
    a: (p) => {
      const t = lowest(p);
      const e = expected16(p.nowPct[t], "up");
      return `Not in one go, and it would be unusual at all. Sixteen weeks of completed weekly challenges typically moves a trait by about a third of a standard deviation. From the ${ord(p.nowPct[t])} percentile that puts your ${tn(t)} at roughly the ${ord(e)}. Repeating the effort can take you further, but the evidence stops at a few months, so nobody can promise a second or third step of the same size. A more useful aim is to shift far enough that daily life feels different, which for most people is that first third of a standard deviation.`;
    },
    next: (p) => `Choose one small ${tn(lowest(p))} challenge and do it three times this week.`,
  },
  {
    id: "mbti-accurate",
    topic: "types",
    q: (p, r) => pick(r, [`Am I really an ${p.mbti}?`, "How accurate is my four-letter type?", "Is the type you gave me my real MBTI?"]),
    evidence: "some",
    a: (p) => {
      const w = weakest(p);
      return `${p.mbti} is the likeliest fit, but it is an estimate. You did not take the MBTI: the letters are worked out from your Big Five scores using published correlations between the two tests${p.direct ? ", then adjusted by the extra either-or questions you answered" : ""}. That works well for extraversion and openness and less well for the other two letters. Your surest letters are solid, while ${w.letter} is only ${Math.round(w.p * 100)}% likely, so the neighbouring type with ${w.letter === w.first ? w.second : w.first} in its place is a real possibility. Read the type as shorthand for your trait scores, which carry more information than four letters can.`;
    },
    next: () => "Read the description of your runner-up type and note which parts fit you better.",
    ctx: mbtiCtx,
  },
  {
    id: "mbti-change",
    topic: "types",
    q: (_, r) => pick(r, ["Can my MBTI type change?", "I got a different type last year. Which one is right?", "Why do I keep getting different four-letter types?"]),
    evidence: "strong",
    a: (p) => {
      const w = weakest(p);
      return `Yes, and more often than people expect. In UK data from the test's own publisher, only 47% of people got the same four letters when retested within 15 weeks, and each single letter held for about 77 to 84% of them. The reason is simple: each letter splits a smooth scale in two, so anyone near the middle can land on either side from one day to the next. For you the letter most likely to flip is ${w.letter}, at ${Math.round(w.p * 100)}%. Neither result is wrong; you are close to the line on that scale.`;
    },
    next: () => "Look at your letter odds instead of the type, and note which ones sit between 40% and 60%.",
    ctx: mbtiCtx,
  },
  {
    id: "mbti-vs-b5",
    topic: "types",
    q: (_, r) => pick(r, ["Which should I trust more, MBTI or the Big Five?", "What's the difference between MBTI and the Big Five?", "Why does this app use the Big Five and not just MBTI?"]),
    evidence: "strong",
    a: () =>
      "The Big Five, if you have to choose. It is the model most personality research uses, it scores each trait on a continuous scale, and it predicts things like health and work outcomes modestly but reliably. The MBTI's four scales overlap strongly with four of the Big Five traits, so they carry real information, but sorting people into two boxes per scale throws much of it away and makes results unstable for anyone near the middle. The MBTI also has nothing corresponding to neuroticism. Four letters are easier to remember, which is why the app shows both.",
    next: () => "Compare your percentile on each trait with the matching letter and see where the letter hides a middling score.",
  },
  {
    id: "enneagram",
    topic: "labels",
    q: (_, r) => {
      const n = pick(r, ["1", "2", "3", "4", "5", "6", "7", "8", "9", "4w5", "7w8", "9w1", "3w2", "5w6", "6w7", "1w2", "2w3", "8w9"]);
      return pick(r, [`I'm an Enneagram ${n}. How does that fit with these results?`, `My Enneagram type is ${n}. Does that match what you found?`]);
    },
    evidence: "thin",
    a: (p) =>
      `We cannot check it, because the app does not measure Enneagram types, so treat it as a label you find useful. The research on the Enneagram is thin: a review of the studies found some overlap with Big Five traits but little support for nine distinct types or for the wings. What we can say comes from your scores. You are ${tw("E", p.nowPct.E)}, ${tw("C", p.nowPct.C)} and ${tw("N", p.nowPct.N)}. If your Enneagram description says something similar, the two agree; if not, the trait scores are the firmer ground, and the plan is built on them.`,
    next: () => "Underline the parts of your Enneagram description that match your trait scores and the parts that do not.",
    ctx: (_p, _r, q) => ({ selfLabel: `Enneagram ${/Enneagram(?: type is)? ([0-9w]+)/.exec(q)?.[1] ?? "4"}` }),
  },
  {
    id: "disc",
    topic: "labels",
    q: (_, r) => {
      const d = pick(r, ["D", "I", "S", "C"]);
      return `My DISC profile from work says high ${d}. Is that the same as my scores here?`;
    },
    evidence: "thin",
    a: (p, _r, q) => {
      const d = /high ([DISC])/.exec(q)?.[1] ?? "D";
      const map: Record<string, string> = {
        D: `high D loosely resembles assertiveness with lower agreeableness, and your agreeableness is at the ${ord(p.nowPct.A)} percentile`,
        I: `high I loosely resembles extraversion, and yours is at the ${ord(p.nowPct.E)} percentile`,
        S: `high S loosely resembles agreeableness with calm, and your agreeableness is at the ${ord(p.nowPct.A)} percentile`,
        C: `high C loosely resembles conscientiousness, and yours is at the ${ord(p.nowPct.C)} percentile`,
      };
      return `Not quite. DISC is popular in workplaces, but it has not been validated to the standard of the Big Five, and it describes behaviour in a work setting, not broad traits. The app does not measure it, so we take your result as a label. As a rough translation, ${map[d]}. If the two disagree, trust the trait score: it comes from more questions and a model with far more research behind it. DISC is fine as a shared vocabulary for a team, and it is not a reason to change your plan.`;
    },
    next: () => "Ask a colleague whether your DISC label or your trait description sounds more like you.",
    ctx: (_p, _r, q) => ({ selfLabel: `DISC high ${/high ([DISC])/.exec(q)?.[1] ?? "D"}` }),
  },
  {
    id: "typeA",
    topic: "labels",
    q: (_, r) => pick(r, ["I'm a classic Type A. Is that bad for me?", "People say I'm Type A. What does that mean in these results?"]),
    evidence: "some",
    a: (p) =>
      `Type A comes from 1950s research that linked a driven, impatient style to heart disease. Later studies did not bear out the broad link; where there was a risk, it came from hostility, not from ambition or working hard. In Big Five terms, drive shows up as conscientiousness, where you are at the ${ord(p.nowPct.C)} percentile, and hostility sits at the low end of agreeableness, where you are at the ${ord(p.nowPct.A)}. ${p.nowPct.A < 35 ? "So if any part deserves attention it is the agreeableness side, not the drive." : "On those numbers the part that caused concern does not look like you."} The label itself is not measured here.`,
    next: () => "Notice this week whether pressure makes you work harder or makes you short with people; they are different things.",
    ctx: () => ({ selfLabel: "Type A personality" }),
  },
  {
    id: "humours",
    topic: "labels",
    q: (_, r) => pick(r, ["Am I sanguine, choleric, melancholic or phlegmatic?", "Which of the four temperaments am I?"]),
    evidence: "thin",
    a: (p) => {
      const mid = Math.abs(p.nowPct.E - 50) < 12 || Math.abs(p.nowPct.N - 50) < 12;
      return `The four temperaments are an ancient scheme, not something modern tests measure. The psychologist Hans Eysenck pointed out that they line up with two traits: sanguine is outgoing and calm, choleric is outgoing and reactive, melancholic is reserved and reactive, phlegmatic is reserved and calm. With your extraversion at the ${ord(p.nowPct.E)} percentile and your neuroticism at the ${ord(p.nowPct.N)}, the nearest label is ${quadrant(p)}${mid ? ", though you sit close to the middle on at least one of the two, so it is a loose fit" : ""}. It is a tidy summary of two numbers and tells you nothing the numbers do not. Your other three traits are missing from it entirely.`;
    },
    next: () => "Look at the three traits the four temperaments leave out and note which one says most about you.",
  },
  {
    id: "hsp",
    topic: "labels",
    q: (_, r) => pick(r, ["I think I'm a highly sensitive person. Does that show up here?", "Is being an HSP the same as high neuroticism?"]),
    evidence: "some",
    a: (p) =>
      `Partly. Sensory processing sensitivity, the research name for it, overlaps most with neuroticism and a little with openness, though it is not identical to either: it also covers being easily overstimulated and noticing subtleties. Your neuroticism is at the ${ord(p.nowPct.N)} percentile and your openness at the ${ord(p.nowPct.O)}. ${p.nowPct.N >= 60 ? "That pattern is in line with describing yourself as sensitive." : "That is not the usual pattern for someone who identifies as highly sensitive, which may mean your sensitivity is more about stimulation than about worry."} The app does not measure it directly, so we treat it as your own description and base the plan on the traits.`,
    next: () => "Keep a note for a week of what overwhelms you, whether noise and crowds or worry and criticism, because they point to different fixes.",
    ctx: () => ({ selfLabel: "highly sensitive person" }),
  },
  {
    id: "ambivert",
    topic: "labels",
    q: (_, r) => pick(r, ["Am I an introvert or an extravert?", "Is ambivert a real thing?", "I feel like both an introvert and an extravert. Is that normal?"]),
    evidence: "strong",
    a: (p) =>
      `Extraversion is a scale, not two camps, and most people are somewhere in the middle of it. You are at the ${ord(p.nowPct.E)} percentile, which means more outgoing than ${p.nowPct.E} in 100 adults. ${p.nowPct.E < 35 ? "That is on the introverted side." : p.nowPct.E > 65 ? "That is on the extraverted side." : "That is the middle band, which is what people mean by ambivert, and it is the most common place to be."} Wherever you sit, behaviour varies by situation: studies that track people through the day find that introverts act extraverted quite often and usually enjoy it at the time. The label matters less than knowing what recharges you.`,
    next: () => "For three days, note after each social event whether you came away with more energy or less.",
  },
  {
    id: "zodiac",
    topic: "labels",
    q: (_, r) => {
      const s = pick(r, SIGNS);
      return pick(r, [`I'm ${/^[AEIOU]/.test(s) ? "an" : "a"} ${s}. Does my star sign match my personality?`, `Does being ${/^[AEIOU]/.test(s) ? "an" : "a"} ${s} have anything to do with my results?`]);
    },
    evidence: "strong",
    a: () =>
      "There is no link that anyone has been able to find. Studies comparing the personality scores of thousands of people with their dates of birth show no relationship between star sign and any trait. Horoscope descriptions feel accurate because they are written to fit almost everyone, and because we remember the hits and forget the misses. So your star sign does not enter your results at all. It is harmless fun, and if a description of your sign rings true, the useful question is which measured trait it is really describing.",
    next: () => "Read the horoscope for a sign that is not yours and count how much of it also fits you.",
    ctx: (_p, _r, q) => ({ selfLabel: SIGNS.find((s) => q.includes(s)) ?? "Leo" }),
  },
  {
    id: "16p",
    topic: "labels",
    q: (p, r) => {
      const v = p.nowPct.N >= 50 === r() < 0.75 ? "T" : "A";
      return `16Personalities says I'm ${p.mbti}-${v}. What does the ${v} mean?`;
    },
    evidence: "some",
    a: (p, _r, q) => {
      const v = /-([AT])\./.exec(q)?.[1] ?? "T";
      const agrees = (v === "T") === p.nowPct.N >= 50;
      return `The fifth letter is that site's own addition: A for Assertive and T for Turbulent. It is closest to neuroticism in the Big Five, with Turbulent meaning more prone to worry and self-doubt and Assertive meaning calmer. Your neuroticism here is at the ${ord(p.nowPct.N)} percentile, which ${agrees ? "agrees with" : "does not really match"} ${v === "A" ? "an A" : "a T"}. ${agrees ? "" : Math.abs(p.nowPct.N - 50) < 20 ? "People near the middle often get either letter. " : "The two tests ask different questions, so they can disagree. "}Like the other four letters it splits a smooth scale in two, so a percentile tells you more. We have not measured that site's test, so we treat the result as a label.`;
    },
    next: () => "Compare your neuroticism percentile with how often worry actually gets in your way in a normal week.",
    ctx: (p, _r, q) => ({ selfLabel: `16Personalities ${p.mbti}-${/-([AT])\./.exec(q)?.[1] ?? "T"}` }),
  },
  {
    id: "keirsey",
    topic: "labels",
    q: (p, r) => pick(r, [`I've been told I'm a Keirsey ${KEIRSEY(p.mbti)}. Is that different from MBTI?`, "How do the Keirsey temperaments relate to my type?"]),
    evidence: "thin",
    a: (p) =>
      `It is the same four letters, grouped. Keirsey sorted the sixteen types into four temperaments: Guardians (S and J), Artisans (S and P), Idealists (N and F) and Rationals (N and T). Your estimated type, ${p.mbti}, falls in the ${KEIRSEY(p.mbti)} group. Because it is built from the letters, it inherits their limits: the letters are estimated from your Big Five scores, and anyone close to the middle of a scale can change group on a retest. There is little independent research on the four groups. Use it as a memorable summary if you like it, and look to the trait percentiles for detail.`,
    next: () => "Check which two letters put you in your Keirsey group and how sure each one is.",
    ctx: (p) => ({ ...mbtiCtx(p), selfLabel: `Keirsey ${KEIRSEY(p.mbti)}` }),
  },
  {
    id: "hexaco",
    topic: "labels",
    q: (_, r) => pick(r, ["What about HEXACO? Isn't honesty missing from the Big Five?", "Is the Big Five missing anything important?"]),
    evidence: "strong",
    a: (p) =>
      `HEXACO is a well-supported six-factor model. Five of its factors are close relatives of the Big Five, and the sixth is Honesty-Humility: sincerity, fairness and modesty against a willingness to bend rules for personal gain. In the Big Five most of that sits inside agreeableness, where you are at the ${ord(p.nowPct.A)} percentile, so it is partly captured here but not separated out. HEXACO also slices agreeableness and emotionality a little differently. This app measures five traits because the long-term studies of change it relies on used the Big Five. A sixth score would be a useful extra, not a correction.`,
    next: () => "Think of one recent moment when you could have cut a corner for your own benefit, and what you did.",
  },
  {
    id: "baby-real",
    topic: "method",
    q: (_, r) => pick(r, ["Can you really tell what I was like as a baby?", "How can you possibly know my personality at birth?", "Is the baby result real or just for fun?"]),
    evidence: "strong",
    a: (p) =>
      `Only roughly, and it is temperament we estimate, not personality. Babies differ from the start in things like activity, fearfulness and how easily they settle, but those early differences predict adult traits only weakly, with correlations of about .1 to .3. ${p.report.reverse ? "For you the estimate was worked backwards from who you are now, your upbringing and what you told us about your parents." : "For you the estimate comes from the stories you have been told, which are filtered through other people's memories."} That is why each baby score comes with a wide range. Read it as the likeliest sketch among many, and enjoy it without leaning on it.`,
    next: () => "Ask someone who knew you as a baby for one specific story and see which trait it speaks to.",
  },
  {
    id: "difficult-baby",
    topic: "origins",
    q: (_, r) => pick(r, ["My mum says I was a difficult baby. Does that mean I'm a difficult adult?", "I was a really fussy baby apparently. Does that still matter?"]),
    evidence: "strong",
    a: (p) =>
      `Not in any way you need to worry about. About one baby in ten fits the pattern researchers once called difficult: intense, irregular and hard to soothe. In a New Zealand study that followed a thousand children, the most undercontrolled three-year-olds were, at 26, a little higher in neuroticism and a little lower in agreeableness and conscientiousness than average. A little means about a third of a standard deviation, with a great deal of overlap. Your own scores today, such as neuroticism at the ${ord(p.nowPct.N)} percentile, tell you far more about you than a description of you at six months.`,
    next: () => "Ask what you were like at five and at ten as well, and notice how much the story changes.",
  },
  {
    id: "shy-child",
    topic: "origins",
    q: (_, r) => pick(r, ["I was a very shy child. Am I stuck with it?", "I was painfully shy as a kid. Will I always be an introvert?"]),
    evidence: "strong",
    a: (p) =>
      `No. Shyness in early childhood is one of the better-studied temperaments, and it fades for most children: in one long study only about a fifth of inhibited toddlers were still inhibited at every check up to age seven. By adulthood the link is small. Very inhibited three-year-olds were, at 26, about a quarter of a standard deviation lower in extraversion than average. You are now at the ${ord(p.nowPct.E)} percentile for extraversion. ${p.nowPct.E >= 40 ? "That is close to or above average, which is the usual outcome." : "That is on the quiet side, and it responds well to practice if you want it to."}`,
    next: () => "Start one short conversation this week that you would normally avoid, and note how it went.",
  },
  {
    id: "adversity",
    topic: "origins",
    q: (_, r) => pick(r, ["I had a rough childhood. Has it damaged my personality?", "A lot of bad things happened when I was young. Is that why I'm anxious?"]),
    when: (p) => p.answers.upbringing.adversity >= 3,
    evidence: "strong",
    a: (p) =>
      `It has probably left a mark, and that is not the same as damage. Across more than a hundred studies, people who went through serious adversity as children score higher in neuroticism as adults, by a bit under half a standard deviation on average. Averages hide a wide spread: many people with hard childhoods score low. Yours is at the ${ord(p.nowPct.N)} percentile. Neuroticism is also the trait that responds best to therapy and practice, so an early push in one direction does not fix where you end up. If the memories themselves are heavy, a GP or counsellor is the right person to talk to.`,
    next: () => "If any of this still weighs on you, book a GP appointment and say so in those words.",
    ctx: (p) => ({ upbringing: { adversity: p.answers.upbringing.adversity, warmth: p.answers.upbringing.warmth } }),
  },
  {
    id: "first-job",
    topic: "life",
    q: (_, r) => pick(r, ["Will starting my first proper job change me?", "Does working full-time change your personality?"]),
    when: (p) => p.age <= 27,
    evidence: "some",
    a: () =>
      "A little, and in a predictable direction. People who start full-time work tend to become slightly more conscientious and slightly calmer over the next few years, by roughly a tenth to a sixth of a standard deviation. The usual explanation is that a job rewards turning up, finishing things and keeping your temper, so you practise them daily. Across 62 countries, people take on adult roles earlier where personality also matures earlier. These are small averages, and the size in this app is an estimate. Your own forecast already includes it if you ticked a first job.",
    next: () => "Pick one work habit you want from day one, such as arriving ten minutes early, and plan it now.",
    ctx: () => ({ events: ["job"] }),
  },
  {
    id: "relationship",
    topic: "life",
    q: (_, r) => pick(r, ["Does being in a relationship change your personality?", "Will getting a partner make me less anxious?"]),
    evidence: "some",
    a: () =>
      "A first serious relationship is one of the few life events with a visible effect. Young adults who entered their first long-term partnership became less neurotic and less shy over the following years than those who stayed single. In this app that is worth about a fifth of a standard deviation on neuroticism, which is an estimate from the original figures. It is an average, and it runs both ways: calmer, more outgoing people also find partners more easily. So a relationship may help, but it is not a plan.",
    next: () => "Work on the trait directly this week with one small challenge, whatever your relationship status.",
  },
  {
    id: "parenthood",
    topic: "life",
    q: (_, r) => pick(r, ["Will having a baby change my personality?", "Does becoming a parent make you more responsible?"]),
    when: (p) => p.age >= 20 && p.age <= 45,
    evidence: "some",
    a: () =>
      "Surprisingly, hardly at all on the Big Five. You might expect parenthood to raise conscientiousness and agreeableness, and one influential theory predicted exactly that. But a large study that followed new parents and compared them with similar people who stayed childless found no reliable change in any of the five traits. Your routines, priorities and sleep will change enormously, and broad traits are a different thing from those. That is why ticking 'becoming a parent' leaves your forecast almost untouched. If you want to be more organised before a baby arrives, deliberate practice will do more than the baby will.",
    next: () => "Choose one routine you would want in place before a big life change and start it this week.",
    ctx: () => ({ events: ["parenthood"] }),
  },
  {
    id: "abroad",
    topic: "life",
    q: (_, r) => pick(r, ["Will a year abroad make me more open-minded?", "Does living in another country change your personality?"]),
    evidence: "some",
    a: (p) =>
      `It tends to, modestly. Students who spent a semester or a year abroad became more open and more agreeable, and less neurotic, than similar students who stayed at home. The effects were small, and they came largely through the new friendships people made abroad. Your openness is at the ${ord(p.nowPct.O)} percentile. ${p.nowPct.O >= 70 ? "You are already high, so there is less room to rise, though the other effects still apply." : "So there is room for it to move."} People who choose to go abroad are more open to begin with, which is part of the story.`,
    next: () => "Get some of the effect at home: have one long conversation this week with someone from a different background.",
    ctx: () => ({ events: ["abroad"] }),
  },
  {
    id: "unemployment",
    topic: "life",
    q: (_, r) => pick(r, ["I've been out of work for a while. Is it changing me?", "Does being unemployed affect your personality?"]),
    evidence: "some",
    a: () =>
      "It can, if it goes on for a long time, and knowing that is useful. In a German study of nearly 7,000 people, those unemployed for one to four years became somewhat less conscientious, less agreeable and less open than people who stayed in work. A likely reason is the loss of daily structure and contact, not anything about the person. People who found work again fairly quickly showed little lasting change. So the practical answer is to keep the structure a job would give you: fixed hours, daily goals and regular contact with people, while the search goes on.",
    next: () => "Set fixed start and finish times for tomorrow and plan one conversation with another person.",
    ctx: () => ({ stage: "between jobs" }),
  },
  {
    id: "university",
    topic: "life",
    q: (_, r) => pick(r, ["Does university change your personality?", "Will I be a different person after uni?"]),
    when: (p) => p.age <= 23,
    evidence: "some",
    a: () =>
      "Somewhat, though mostly you become a slightly more grown-up version of who you already are. The years from 18 to 22 are when personality moves fastest for everyone, at university or not: people become more conscientious, more agreeable and calmer. Studies that follow students suggest university adds a little on top, about a tenth of a standard deviation, and that figure is an estimate. Openness also rises in these years. The larger effects come from what you do there. Students who take on responsibility, meet very different people and stick at hard things change more than those who do not.",
    next: () => "Sign up for one thing this term that gives you a responsibility other people rely on.",
    ctx: () => ({ events: ["university"], stage: "at university" }),
  },
  {
    id: "fake",
    topic: "change",
    q: (_, r) => pick(r, ["Isn't acting more outgoing just being fake?", "If I force myself to be sociable, isn't that pretending?", "Doesn't 'fake it till you make it' go against being authentic?"]),
    evidence: "strong",
    a: (p) =>
      `It feels like acting at first, and the evidence says it works anyway. When researchers track people through the day, both introverts and extraverts report better mood in the moments they behave in a more outgoing way. In a trial where people were asked to act extraverted for a week, positive mood rose on average. ${p.nowPct.E <= 25 ? `There was one caution that applies to you at the ${ord(p.nowPct.E)} percentile: the most introverted gained less and felt more tired, so pace it.` : "The most introverted participants gained less and felt more tired, so pacing matters."} Nobody is asking you to become a different person. Traits are habits of behaviour, so practising the behaviour in small doses is how the trait shifts.`,
    next: () => "Pick one conversation tomorrow in which you will speak first, and notice your mood afterwards.",
  },
  {
    id: "high-n",
    weight: 4,
    topic: "safety",
    q: (_, r) => pick(r, ["My neuroticism is really high. Is something wrong with me?", "Does a high neuroticism score mean I have a problem?"]),
    when: (p) => p.nowPct.N >= 70,
    evidence: "strong",
    a: (p) =>
      `No. A score at the ${ord(p.nowPct.N)} percentile means you feel stress and worry more readily than most people. It is a normal trait that everyone has to some degree, and it is not a diagnosis. It can have upsides too: some people who score high prepare carefully and spot problems early. It does make hard periods harder, and it is the trait that responds best to practice and to therapy. A questionnaire cannot tell whether what you are living with needs more support. If worry or low mood is getting in the way of work, sleep or relationships, talk to your GP.`,
    next: () => "Tonight, write down the one worry that takes up most room and the most likely way it will turn out.",
  },
  {
    id: "diagnosis",
    weight: 4,
    topic: "safety",
    q: (_, r) => {
      const d = pick(r, ["an anxiety disorder", "ADHD", "autism", "depression", "a personality disorder", "bipolar disorder", "OCD"]);
      return pick(r, [`Do my results mean I have ${d}?`, `Looking at my scores, do you think I've got ${d}?`]);
    },
    evidence: "strong",
    a: (p) =>
      `I can't tell you that, and no personality questionnaire can. These scores describe ordinary differences between people, such as your conscientiousness at the ${ord(p.nowPct.C)} percentile and neuroticism at the ${ord(p.nowPct.N)}. A diagnosis is a different kind of judgement. It depends on how long something has lasted, how much it interferes with your life and what else could explain it, and only a qualified clinician who talks to you can make it. If you recognise yourself in descriptions of that condition and it is causing you difficulty, that is a good enough reason to see your GP.`,
    next: () => "Write down three specific examples of what worries you and take the list to a GP appointment.",
  },
  {
    id: "hopeless",
    weight: 5,
    topic: "safety",
    q: (_, r) => pick(r, ["Honestly I feel hopeless and I don't think anything will change. What's the point?", "I've felt really low for weeks and none of this feels worth doing.", "I don't see the point in any of this. I just feel empty."]),
    evidence: "strong",
    a: (p) =>
      `${p.name ? p.name + ", I'm" : "I'm"} glad you said that, and I'm sorry things feel this heavy. Feeling hopeless for weeks is not a personality trait and it is not something a challenge plan should be carrying. It is a sign that you deserve proper support, and it is common and treatable. Please talk to someone today: your GP, or someone you trust. In the UK you can call Samaritans free on 116 123 at any hour, and if you ever feel you might harm yourself, call 999. The plan will still be here when things are steadier.`,
    next: () => "Tell one person you trust how you have been feeling, or call Samaritans on 116 123, today.",
  },
  {
    id: "percentile",
    topic: "method",
    q: (p, r) => {
      const t = pick(r, ["O", "C", "E", "A", "N"] as Trait[]);
      return `What does being at the ${ord(p.nowPct[t])} percentile for ${tn(t)} actually mean?`;
    },
    evidence: "strong",
    a: (p, _r, q) => {
      const t = (["O", "C", "E", "A", "N"] as Trait[]).find((x) => q.includes(tn(x)))!;
      const v = p.nowPct[t];
      return `It is a comparison, not a mark. Out of 100 adults who took the same test, you scored higher on ${tn(t)} than about ${v} of them and lower than about ${100 - v}. In plain words that makes you ${tw(t, v)}. It is not a score out of 100, and there is no pass mark: every position has costs and benefits. Percentiles also bunch in the middle, so the step from the 45th to the 55th is tiny while the step from the 85th to the 95th is large. And a short test wobbles, so a few points either way is noise.`;
    },
    next: () => "Look at which of your five percentiles is furthest from 50, because that is the most distinctive thing about you.",
  },
  {
    id: "reliability",
    topic: "method",
    q: (_, r) => pick(r, ["How much can I trust a 50-question test?", "Is this test actually accurate?", "Would I get the same result if I took it again tomorrow?"]),
    evidence: "strong",
    a: (p) =>
      `${p.report.detailed ? "Fairly well for the broad picture. The 50 questions are a public-domain research questionnaire with ten items per trait, and each scale holds together well, with reliabilities of roughly .8 to .9." : "For a rough picture only. You took the ten-question version, with two items per trait, and scores from it can shift noticeably from one sitting to the next."} If you retook it tomorrow you would expect each percentile to move by a few points, more if your mood were very different. What stays put is the overall shape: which traits are high and which are low. It is also your own view of yourself, and people who know you well might rate you a little differently.`,
    next: (p) => (p.report.detailed ? "Ask someone who knows you well to guess your highest and lowest trait and compare." : "Take the 50-question version when you have ten minutes; it narrows every range."),
  },
  {
    id: "best",
    topic: "method",
    q: (_, r) => pick(r, ["What's the best personality to have?", "Which of my scores are bad?", "Are any of my results something I should worry about?"]),
    evidence: "strong",
    a: (p) => {
      const far = (["O", "C", "E", "A", "N"] as Trait[]).sort((a, b) => Math.abs(p.nowPct[b] - 50) - Math.abs(p.nowPct[a] - 50))[0];
      return `There isn't a best one, only trade-offs. On average, higher conscientiousness and lower neuroticism go with better health and steadier work, which is why most people who want to change pick those. But very high conscientiousness can turn into rigidity, high agreeableness can make it hard to say no, and high openness can make routine a struggle. Your most distinctive score is ${tn(far)} at the ${ord(p.nowPct[far])} percentile, which makes you ${tw(far, p.nowPct[far])}. The useful question is whether a trait is getting in the way of something you want. If none is, nothing needs fixing.`;
    },
    next: () => "Name one thing you want that a trait is making harder; that is your candidate for a plan.",
  },
  {
    id: "which-first",
    topic: "change",
    q: (_, r) => pick(r, ["Which trait should I work on first?", "Where should I start if I want to change?", "I want to improve everything. What do I do first?"]),
    evidence: "some",
    a: (p) => {
      const t: Trait = p.nowPct.N >= 65 ? "N" : lowest(p, ["C", "E"]);
      return `One or two traits at most. In the studies that worked, people chose what they wanted to change and stuck to small weekly challenges, and those who took on too much and did not finish went slightly backwards. Two things should guide the choice: which trait is costing you most day to day, and where the evidence is strongest, which is emotional stability first, then extraversion and conscientiousness. On your scores a sensible starting point is ${t === "N" ? `neuroticism, at the ${ord(p.nowPct.N)} percentile` : `${tn(t)}, at the ${ord(p.nowPct[t])} percentile`}. But only if you want it: a goal you do not care about will not survive week three.`;
    },
    next: () => "Set a target for a single trait in the coach and read week one before deciding on a second.",
  },
  {
    id: "regress",
    topic: "method",
    q: (p, r) => {
      const t = (["O", "C", "E", "A", "N"] as Trait[]).sort((a, b) => Math.abs(p.nowPct[b] - 50) - Math.abs(p.nowPct[a] - 50))[0];
      return pick(r, [`Why does the forecast expect my ${tn(t)} to move back towards average?`, `My ${tn(t)} is at the ${ord(p.nowPct[t])} percentile now. Why would it drift towards the middle?`]);
    },
    when: (p) => (["O", "C", "E", "A", "N"] as Trait[]).some((t) => Math.abs(p.nowPct[t] - 50) >= 30),
    evidence: "strong",
    a: (p) => {
      const t = (["O", "C", "E", "A", "N"] as Trait[]).sort((a, b) => Math.abs(p.nowPct[b] - 50) - Math.abs(p.nowPct[a] - 50))[0];
      return `Because that is what the long-term data show for anyone far from the middle. Over years, people keep roughly but not exactly the same position relative to others, and when positions shuffle, those at the extremes have more room to move inwards than outwards. Part of an extreme score is also the luck of the day you took the test. At the ${ord(p.nowPct[t])} percentile for ${tn(t)} you are far enough out for both to apply. It is a statement about odds: plenty of people stay where they are or move further out, and the forecast gives you the chance of each.`;
    },
    next: () => "Check the range around your forecast as well as the middle of it, because the range is the honest part.",
  },
  {
    id: "too-old",
    topic: "change",
    q: (p, r) => pick(r, [`Am I too old to change at ${p.age}?`, `Is there any point trying to change my personality at ${p.age}?`]),
    when: (p) => p.age >= 45,
    evidence: "some",
    a: (p) =>
      `No. Change slows after the twenties, but it does not stop: average agreeableness goes on rising into the sixties, and people at every age shift when their lives or habits do. In one trial, adults aged 60 to 94 who did a few months of reasoning training and puzzles became more open to experience than a comparison group. The therapy studies, which show the largest effects, include plenty of people in midlife and later. At ${p.age} the difference is that less happens by itself, so deliberate practice counts for more. The method is the same: small, specific challenges that you actually complete.`,
    next: () => "Choose one small challenge for the trait you care about most and do it three times this week.",
  },
  {
    id: "young",
    topic: "change",
    q: (p, r) => pick(r, [`I'm only ${p.age}. Will my personality change a lot anyway?`, "Should I bother with a plan or will I just grow out of things?"]),
    when: (p) => p.age <= 21,
    evidence: "strong",
    a: (p) =>
      `Quite possibly, yes. Personality is least settled at your age: how people rank against their peers keeps reshuffling until about 25. The average direction is helpful too. Between 18 and 30 people on average become more conscientious, more assertive and calmer, by something like half a standard deviation on each. So some of what you want may arrive without effort. That is an average, though, and it tells you nothing about whether you will be one of the people it happens to. At ${p.age} a plan works with the tide, which makes it a good time to start one.`,
    next: () => "Pick the one change you would not want to leave to chance and set it as your target.",
  },
  {
    id: "others-notice",
    topic: "change",
    q: (_, r) => pick(r, ["Will other people notice if I change?", "Is the change real or will I just rate myself differently?"]),
    evidence: "strong",
    a: () =>
      "Some of it is real enough for others to see. In the largest coaching trial, people rated themselves as having changed by about half a standard deviation after three months. Their friends, partners and relatives, asked separately, also reported a change, but a smaller one, about a third of a standard deviation, and only for traits people were trying to increase. Decreases, such as lower neuroticism, were harder for others to spot. So part of what you feel is visible and part is your own changed view of yourself. Both count, but expect others to notice later and less than you do.",
    next: () => "Ask one person who sees you often to tell you in three months whether anything seems different.",
  },
  {
    id: "need-extravert",
    topic: "method",
    q: (_, r) => pick(r, ["Do I need to be an extravert to do well in my career?", "Is being introverted going to hold me back at work?"]),
    evidence: "some",
    a: (p) =>
      `No. The trait most consistently linked to doing well across jobs is conscientiousness, not extraversion, and yours is at the ${ord(p.nowPct.C)} percentile. Extraversion helps modestly in roles built around persuading or leading large groups, and extraverts are more likely to be picked as leaders, which is not the same as being better at it. You are at the ${ord(p.nowPct.E)} percentile for extraversion. ${p.nowPct.E < 35 ? "The skill worth building is speaking up when it counts, which is a behaviour you can practise without changing who you are." : "That is not a level that holds anyone back."} These are averages over many jobs, so your own field may differ.`,
    next: () => "Choose one meeting or class this week in which you will make one point early.",
  },
  {
    id: "stopped",
    topic: "change",
    q: (_, r) => pick(r, ["I did the challenges for a month and then stopped. Have I lost the progress?", "I fell off the plan after three weeks. Do I have to start again?"]),
    evidence: "some",
    a: () =>
      "Probably not all of it, and starting again is cheap. In the main coaching trial, the changes people made were still there three months after the programme ended, which suggests new habits do not vanish the moment you stop. What the studies do show is that completing challenges is what drives change, so a month of finished challenges counts for more than three months of half-done ones. The risk is in signing up again and not following through. Restart with challenges smaller than the ones you stopped at, and build back up over a couple of weeks.",
    next: () => "Redo the last challenge you completed comfortably, today, as your restart.",
  },
  {
    id: "two-traits",
    topic: "method",
    q: (_, r) => pick(r, ["Why does the plan only work on two traits?", "Can't the plan cover all five traits at once?"]),
    evidence: "some",
    a: () =>
      "Because finishing matters more than coverage. The studies behind the plan found that change came from completing weekly challenges, and that people who accepted challenges they then skipped moved slightly in the wrong direction. Eight weeks split across five traits would give each one a week or two, too little to form a habit, and a list that long is easy to abandon. So the plan takes your two largest gaps and gives each enough weeks to build from easy to hard. Once those eight weeks are done, set a new target and the next two gaps take their turn.",
    next: () => "Finish week one before looking at anything else in the plan.",
  },
  {
    id: "less-agreeable",
    topic: "change",
    q: (_, r) => pick(r, ["I want to be less agreeable. Is that a bad idea?", "I'm too nice and people walk over me. Can I change that?"]),
    when: (p) => p.nowPct.A >= 55,
    evidence: "thin",
    a: (p) =>
      `It is a reasonable goal, as long as the aim is firmer and not colder. At the ${ord(p.nowPct.A)} percentile you are ${tw("A", p.nowPct.A)}, and the usual cost at that level is finding it hard to say no or to ask for what you have earned. The honest caveat is that almost no trials have tried to lower agreeableness, so the size of change in your plan is an estimate. The behaviours are well understood, though: declining small requests, stating a preference, giving honest feedback kindly. Practise on low-stakes situations first, and keep the warmth, which most people value in you.`,
    next: () => "Say no to one small request this week without giving a reason longer than a sentence.",
  },
  {
    id: "less-conscientious",
    topic: "change",
    q: (_, r) => pick(r, ["Can I lower my conscientiousness? I'm exhausted by my own standards.", "I'm a perfectionist and it's wearing me out. Can that change?"]),
    when: (p) => p.nowPct.C >= 60,
    evidence: "thin",
    a: (p) =>
      `You can loosen it, and it sounds worth trying. At the ${ord(p.nowPct.C)} percentile you are ${tw("C", p.nowPct.C)}, which is mostly an asset, but at the top end it can shade into rigidity and never feeling finished. Research has rarely tested lowering conscientiousness, so the expected size of change is an estimate. What tends to help is practising the opposite behaviour on things that do not matter much: sending work at good enough, leaving an evening unplanned, setting a time limit and stopping at it. Keep your standards where other people rely on you. If exhaustion persists, mention it to your GP.`,
    next: () => "Send one low-stakes piece of work today without the final check.",
  },
  {
    id: "temperament-vs",
    topic: "method",
    q: (_, r) => pick(r, ["What's the difference between temperament and personality?", "Why do you say temperament for babies and personality for adults?"]),
    evidence: "strong",
    a: (p) =>
      `Temperament is the raw material and personality is what gets built from it. Babies differ from the first months in a handful of basic ways: how active they are, how easily frightened or upset, how readily they settle, and later how well they can hold their attention. Personality is broader. It adds habits, values, self-image and ways of dealing with people, which take years to form. The two are related, since an active, smiley baby is a bit more likely to become an outgoing adult, but only loosely. That is why your baby result is called ${p.temperamentType.toLowerCase()}, a temperament type, and your adult result is five trait scores.`,
    next: () => "Compare your baby type with your adult scores and note the one trait that seems to have travelled furthest.",
  },
];
