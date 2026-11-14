import type { Trait } from "./params";

// Evidence-based micro-challenges, modelled on the weekly behavioural challenges
// in Hudson & Fraley (2015) / Hudson et al. (2019) and the PEACH app (Stieger et al., 2021).
// Principle: change the behaviour first; repeated behaviour shifts the trait.
export const CHALLENGES: Record<Trait, { up: string[]; down: string[] }> = {
  O: {
    up: [
      "Order something on a menu you've never tried, and write one line on what surprised you.",
      "Spend 20 minutes on a topic you know nothing about (a Wikipedia rabbit hole counts).",
      "Go to one talk, society event or exhibition outside your subject this week.",
      "Take a different route home and notice three things you'd never seen.",
    ],
    down: [
      "Pick one routine (morning, study, gym) and run it identically five days in a row.",
      "Before starting something new, finish one thing you already began.",
      "Choose the proven option once this week and note how it went.",
    ],
  },
  C: {
    up: [
      "Write tomorrow's top three tasks before bed, every night this week.",
      "Use if–then plans: \"If it's 9am, then I open the problem set before my phone.\"",
      "Arrive five minutes early to every commitment for seven days.",
      "Do a 25-minute focus block with your phone in another room, once a day.",
    ],
    down: [
      "Leave one evening completely unplanned and follow what you feel like.",
      "Ship one piece of work at 'good enough' instead of perfect.",
      "Say yes to one spontaneous invitation.",
    ],
  },
  E: {
    up: [
      "Start one conversation with someone you don't know well each day.",
      "Speak first in one seminar, meeting or group chat this week.",
      "Organise a small plan (coffee, game, study session) and invite two people.",
      "Introduce yourself to someone at an event, then introduce them to someone else.",
    ],
    down: [
      "Schedule two solo recharge blocks this week and protect them.",
      "In one conversation a day, ask a follow-up question before sharing your own story.",
      "Spend one evening offline doing something alone that you enjoy.",
    ],
  },
  A: {
    up: [
      "Send one genuine thank-you message a day.",
      "In a disagreement, restate the other person's view before giving yours.",
      "Do one small, unasked-for favour this week.",
      "Assume good intent once when you'd normally assume bad.",
    ],
    down: [
      "Say no to one request you'd normally agree to out of guilt.",
      "Give one piece of honest, specific critical feedback, kindly.",
      "Negotiate once this week (a deadline, a price, a role).",
    ],
  },
  N: {
    down: [
      "When stressed, name the emotion in writing and rate it 0–10 before acting.",
      "Ten minutes of slow breathing or a walk, daily, for seven days.",
      "Write the worst case, the best case and the most likely case for one worry.",
      "Do one thing that makes you a bit anxious (a question in lecture, a call) and notice you survived.",
    ],
    up: [
      "Notice and name one feeling each day that you'd usually brush past.",
      "Share one honest worry with someone you trust.",
    ],
  },
};
