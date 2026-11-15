// In-depth, plain-English reading of each Big Five score, by band. Written for this app: tendencies, not verdicts.
import type { Trait } from "./params";

export type Band = "low" | "mid" | "high";
export type TraitDetail = { label: string; daily: string; strengths: string[]; watchOuts: string[]; tryThis: string };

/** Below the 35th percentile is "low", 35 to 64 is "mid", 65 and up is "high". */
export const bandOf = (percentile: number): Band => (percentile < 35 ? "low" : percentile < 65 ? "mid" : "high");

/** How each trait tends to move across adult life, in line with the maturation curve the forecast uses. */
export const TRAIT_AGE: Record<Trait, string> = {
  O: "Openness tends to hold fairly steady through adult life and eases down a little in later decades, so where you are now is a good guide to where you will stay.",
  C: "Conscientiousness rises for most people through their twenties, thirties and forties as work, bills and other people start to depend on them.",
  E: "Extraversion changes least on average: people usually grow more confident and assertive in their twenties while the urge to be out every night slowly fades.",
  A: "Agreeableness climbs slowly but steadily through adulthood, so most people are noticeably warmer and more patient at fifty than at twenty.",
  N: "Neuroticism falls through adulthood for most people, fastest in the twenties and thirties, so the same setbacks tend to sting less with each decade.",
};

export const TRAIT_DETAILS: Record<Trait, Record<Band, TraitDetail>> = {
  O: {
    low: {
      label: "Grounded and practical",
      daily:
        "You like things that are proven to work, and you would rather get good at a few of them than sample everything. Day to day that looks like a favourite route, a regular order and a healthy suspicion of ideas that sound clever but have never been tested. Abstract debate tends to bore you unless it leads to a decision. People come to you when they need a straight answer about what will actually happen.",
      strengths: ["Common sense that keeps plans realistic", "Sticks with methods long enough to master them", "Hard to distract with fads"],
      watchOuts: ["Can dismiss a new idea before hearing it out", "Routines may quietly turn into ruts", "May find change at work more tiring than others do"],
      tryThis: "Pick one small thing you always do the same way, such as lunch, your route or your playlist, and change it once this week. Notice what you would keep.",
    },
    mid: {
      label: "Curious, with your feet on the ground",
      daily:
        "You enjoy a new idea, but you want to know what it is for. Most weeks you mix the familiar with the occasional experiment: a new recipe, a documentary on something you know nothing about, then back to what works. You can talk theory with the dreamers and logistics with the realists. That makes you a useful translator between the two.",
      strengths: ["Open to change without chasing novelty", "Good at turning ideas into something usable", "Comfortable with both routine and variety"],
      watchOuts: ["May stay on the surface of new interests", "Can default to the safe option under pressure", "Might undersell your own creative ideas"],
      tryThis: "Take one idea that caught your interest lately and spend thirty unbroken minutes going deeper into it than you normally would.",
    },
    high: {
      label: "Imaginative and hungry for ideas",
      daily:
        "Your attention goes to whatever is new, strange or beautiful. You probably have more tabs open, more half-read books and more unfinished projects than most people you know. You make links between things that look unrelated, and you get restless when life becomes too predictable. Conversations with you tend to end up somewhere nobody expected.",
      strengths: ["Original thinking and unusual connections", "Learns quickly because learning is fun", "At ease with change and ambiguity"],
      watchOuts: ["Starts more than gets finished", "Can find necessary routine draining", "May overcomplicate something that needed a simple answer"],
      tryThis: "Choose one unfinished project and finish a small, shippable piece of it before starting anything new this week.",
    },
  },
  C: {
    low: {
      label: "Spontaneous and flexible",
      daily:
        "You work in bursts and take things as they come. Plans feel like suggestions, deadlines sharpen your focus at the last moment, and your desk or downloads folder is probably a little chaotic. You adapt quickly when things change, because you were never attached to the plan in the first place. The cost is that small tasks slip and then pile up.",
      strengths: ["Adapts fast when plans fall apart", "Relaxed company, rarely rigid", "Good in a scramble or a crisis"],
      watchOuts: ["Deadlines and admin sneak up on you", "Others may read lateness as not caring", "Long projects lose steam after the exciting start"],
      tryThis: "Each evening this week, write down the one thing that must happen tomorrow and do it before midday. One thing only.",
    },
    mid: {
      label: "Organised when it matters",
      daily:
        "You can be disciplined, but you save it for what counts. Important deadlines get met and big commitments are kept, while the low-stakes things, like the laundry pile or the inbox, are allowed to slide. You plan the outline of your week without scripting every hour. Most people experience you as reliable without being rigid.",
      strengths: ["Reliable on what matters", "Balances planning with flexibility", "Can relax without guilt"],
      watchOuts: ["Effort drops when nobody is checking", "Small tasks build into a stressful backlog", "Can be inconsistent with habits"],
      tryThis: "Pick one habit you keep restarting and tie it to something you already do daily, such as straight after brushing your teeth, for seven days running.",
    },
    high: {
      label: "Disciplined and dependable",
      daily:
        "You make a plan and then you actually follow it. Lists, calendars and tidy systems feel calming, and you get real satisfaction from finishing things properly. People hand you the important jobs because they know they will get done. Leaving something half-finished, or watching others cut corners, bothers you more than it bothers most.",
      strengths: ["Follows through, even when it is dull", "Careful, thorough work", "Others trust you with responsibility"],
      watchOuts: ["Finds it hard to stop and rest", "Perfectionism can slow you down", "May be impatient with looser, messier people"],
      tryThis: "Hand in or send one piece of work this week at 'good enough' rather than perfect, and see whether anyone notices the difference.",
    },
  },
  E: {
    low: {
      label: "Quiet and inward-facing",
      daily:
        "You recharge alone. A day full of people, even people you like, leaves you needing a quiet evening, and you would pick one good conversation over a loud room every time. You tend to think before you speak, so you may say less in meetings than you actually have to offer. Your friendships are fewer but usually deep.",
      strengths: ["Listens properly and notices what others miss", "Focuses for long stretches alone", "Close, loyal friendships"],
      watchOuts: ["Good ideas go unheard if you wait too long to speak", "Can drift into isolation without meaning to", "Others may mistake quiet for lack of interest"],
      tryThis: "In one group conversation this week, say your thought within the first five minutes instead of waiting for the perfect moment.",
    },
    mid: {
      label: "An ambivert, at ease either way",
      daily:
        "You like people and you like your own company, and you need a bit of both. You can hold a room when the occasion calls for it, then happily spend the next evening at home. How sociable you feel depends on who is there and how your week has gone. That flexibility lets you get on with both the loud and the quiet people in your life.",
      strengths: ["Comfortable leading or listening", "Reads when to speak up and when to step back", "Fits into most social settings"],
      watchOuts: ["Can overbook, then crash", "May not notice your social battery running low", "Others cannot always tell which mood they will get"],
      tryThis: "Look at your week and mark each plan as energising or draining. Move or drop one draining thing and protect one quiet evening.",
    },
    high: {
      label: "Outgoing and energised by people",
      daily:
        "You come alive around other people. You talk to think, fill silences easily and tend to end up at the centre of whatever is going on. A weekend with nothing planned feels flat, so you rarely leave one empty. Your energy lifts the room, and it means people usually remember meeting you.",
      strengths: ["Makes friends and contacts quickly", "Brings energy and momentum to a group", "Comfortable speaking up and taking the lead"],
      watchOuts: ["May talk over quieter people without noticing", "Time alone can feel boring, so reflection gets skipped", "Can say yes to too many plans"],
      tryThis: "In your next conversation, ask two follow-up questions before you offer your own story.",
    },
  },
  A: {
    low: {
      label: "Direct and tough-minded",
      daily:
        "You say what you think and expect others to do the same. You question claims, argue your corner and do not agree just to keep the peace. In a negotiation or a debate that is a real advantage. In everyday life it can land harder than you intend, especially with people who take disagreement personally.",
      strengths: ["Honest feedback people can rely on", "Holds firm under pressure to give in", "Spots weak arguments and bad deals"],
      watchOuts: ["Bluntness can bruise people you care about", "May assume bad motives too quickly", "Winning the point can cost the relationship"],
      tryThis: "Before you disagree with someone this week, first say back what they mean in your own words until they tell you that you have it right.",
    },
    mid: {
      label: "Warm, but no pushover",
      daily:
        "You are kind by default and firm when you need to be. You will help a colleague, give way on things that do not matter and then hold your ground on the things that do. You can tell the difference between being nice and being taken advantage of. Most people find you fair.",
      strengths: ["Cooperative without being a doormat", "Can give honest feedback kindly", "Trusted by both blunt and gentle people"],
      watchOuts: ["May avoid a hard conversation for longer than you should", "Can swing between giving in and digging in", "Resentment builds if you say yes when you mean no"],
      tryThis: "Name one thing you have been putting up with and raise it this week, calmly, in a single sentence.",
    },
    high: {
      label: "Kind, trusting and cooperative",
      daily:
        "You look for the good in people and usually find it. You notice when someone is struggling, step in to help without being asked and will bend a long way to avoid a row. People feel safe around you. The risk is that your own needs end up at the back of the queue.",
      strengths: ["Makes people feel heard and cared for", "Builds trust and calm in a group", "Generous with time and credit"],
      watchOuts: ["Saying no feels harder than it should", "Can be taken advantage of", "Avoids conflict even when it would clear the air"],
      tryThis: "Say no to one request this week without apologising or explaining for more than a sentence.",
    },
  },
  N: {
    low: {
      label: "Calm and hard to rattle",
      daily:
        "Stress mostly slides off you. When something goes wrong you deal with it and move on, and you rarely lie awake replaying the day. Others lean on you in a crisis because you stay level. Because worry is not loud for you, you may sometimes miss a real warning sign, in yourself or in someone else.",
      strengths: ["Steady under pressure", "Recovers quickly from setbacks", "A calming presence for others"],
      watchOuts: ["May underestimate real risks", "Can seem unmoved when others are upset", "Might ignore stress until your body complains"],
      tryThis: "Ask one person close to you how they are really doing this week, then listen without trying to fix it.",
    },
    mid: {
      label: "Normal ups and downs",
      daily:
        "You feel stress when there is something to be stressed about, and it passes. A bad day can knock your mood, a good night's sleep usually resets it. You worry enough to prepare, but not so much that it stops you acting. That is roughly where most people sit.",
      strengths: ["Worry that is useful rather than overwhelming", "Emotionally in tune with others", "Bounces back in reasonable time"],
      watchOuts: ["Stress builds when several things land at once", "Poor sleep hits your mood hard", "May bottle things up until they spill"],
      tryThis: "When you next feel wound up, write the worry down along with the single next step you can take. Then take that step.",
    },
    high: {
      label: "Sensitive and feels things deeply",
      daily:
        "Your feelings arrive quickly and at full volume. You spot what could go wrong before anyone else does, replay awkward moments and can be knocked off course by criticism or uncertainty. The same sensitivity makes you alert, conscientious about risks and quick to notice when someone else is hurting. It is tiring, though, and it is also the trait that responds best to practice and support.",
      strengths: ["Spots problems early", "Deep empathy for people who are struggling", "Prepares thoroughly because the stakes feel real"],
      watchOuts: ["Worry can spiral beyond the facts", "Criticism stings for longer than it deserves", "Stress shows up in sleep and in your body"],
      tryThis: "Set aside ten minutes a day as worry time. When a worry turns up outside it, note it down and come back to it then.",
    },
  },
};

/** 1st, 2nd, 3rd, 4th, 11th, 12th, 13th, 21st, 33rd... */
export function ordinal(n: number): string {
  const v = Math.round(n);
  const t = v % 100;
  if (t >= 11 && t <= 13) return `${v}th`;
  return `${v}${["th", "st", "nd", "rd"][v % 10] ?? "th"}`;
}
