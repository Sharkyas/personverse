// Plain-English portraits for the 16 four-letter types, written for this app. They describe tendencies that go with the
// Big Five scores behind each letter, not fixed boxes: most people sit near the middle on at least one letter.
export type TypeDetail = {
  summary: string;
  atBest: string;
  underStress: string;
  work: string;
  roles: string[];
  relationships: string;
  growthEdge: string;
};

export const TYPE_DETAILS: Record<string, TypeDetail> = {
  INTJ: {
    summary:
      "You think in systems and long timelines. You would rather build one thing properly than start ten, and you trust your own judgement once you have done the thinking. People often see you as calm and self-contained, sometimes more certain than you feel.",
    atBest: "Turning a vague goal into a clear plan, spotting the flaw in a strategy early, and sticking with hard problems after others give up.",
    underStress: "You go quiet, over-plan, and can become dismissive of people who seem to slow things down.",
    work: "You do best with autonomy, hard problems and colleagues who are competent and direct. Constant meetings and vague goals drain you.",
    roles: ["Strategy and research", "Quant and data science", "Software architecture", "Engineering", "Investment analysis"],
    relationships: "Loyal and steady, with a small circle. You show care by fixing problems and planning ahead, which partners may need you to put into words as well.",
    growthEdge: "Share half-finished thinking sooner. Other people's input improves plans more often than it derails them.",
  },
  INTP: {
    summary:
      "You are driven by wanting to understand how things really work. You enjoy ideas for their own sake, notice inconsistencies others miss, and would rather be right than quick. Routine bores you; a good puzzle can hold you for hours.",
    atBest: "Finding an original explanation, simplifying something complicated, and staying objective when others get emotional.",
    underStress: "You withdraw into your head, procrastinate on practical tasks, and can come across as detached or overly critical.",
    work: "You need room to think, flexible structure and problems with real depth. Micromanagement and busywork are the quickest way to lose you.",
    roles: ["Research and academia", "Software engineering", "Data science", "Economics and modelling", "Product design"],
    relationships: "Easy-going and accepting, with a few close friends who enjoy ideas. Saying what you feel, not only what you think, makes a big difference.",
    growthEdge: "Pick deadlines for your ideas. Shipping a good version beats perfecting one nobody sees.",
  },
  ENTJ: {
    summary:
      "You see what needs to happen and organise people to make it happen. You are decisive, ambitious and comfortable taking charge, and you judge plans by whether they get results. You enjoy a challenge and respect people who push back with good reasons.",
    atBest: "Leading a team through a hard goal, making tough calls quickly, and building structures that keep working without you.",
    underStress: "You push harder, get impatient, and can steamroll people whose pace or style differs from yours.",
    work: "You thrive with responsibility, clear targets and room to lead. Slow organisations with fuzzy ownership frustrate you.",
    roles: ["Investment banking", "Consulting", "Founding a company", "Operations leadership", "Trading desk management"],
    relationships: "Committed and generous with your energy. Slowing down to listen before solving is the skill that pays off most.",
    growthEdge: "Ask how people are before asking what they have done. Warmth multiplies the results you care about.",
  },
  ENTP: {
    summary:
      "You love new ideas and testing them out loud. You think fast, enjoy a good argument and see possibilities everywhere. Starting things excites you far more than maintaining them, and you are at your best when there is something to figure out.",
    atBest: "Generating options nobody else saw, persuading a room, and adapting quickly when plans fall apart.",
    underStress: "You scatter your energy across too many projects, argue for sport, and leave the dull parts unfinished.",
    work: "You need variety, freedom and smart people to spar with. Rigid processes and repetitive work sap your motivation.",
    roles: ["Start-ups and venture", "Sales and business development", "Product management", "Law", "Fintech strategy"],
    relationships: "Fun, curious and full of plans. Following through on the small promises builds as much trust as the big gestures.",
    growthEdge: "Finish one thing before starting the next. Pair up with someone who loves the details.",
  },
  INFJ: {
    summary:
      "You read people well and care a lot about doing the right thing. You think about meaning and the future, plan carefully, and prefer a few deep relationships to many light ones. Others often come to you for advice.",
    atBest: "Understanding what someone really needs, holding to your values under pressure, and turning a vision into steady action.",
    underStress: "You absorb other people's stress, become perfectionist, and may withdraw suddenly when you feel overloaded.",
    work: "You do best in work that helps people or serves a purpose you believe in, with time to think and a calm environment.",
    roles: ["Psychology and counselling", "Writing", "User research", "Teaching", "Impact investing"],
    relationships: "Deeply loyal and attentive. Telling people when you need space, instead of disappearing, protects the relationships you value.",
    growthEdge: "Your needs count too. Say no earlier and you will have more to give later.",
  },
  INFP: {
    summary:
      "You are guided by your values and your imagination. You care about authenticity, notice how people feel, and need your work to mean something. You may seem quiet at first, but you hold strong convictions.",
    atBest: "Creating something original, standing up for what is right, and making people feel understood.",
    underStress: "You turn self-critical, avoid conflict until it builds up, and struggle with practical deadlines.",
    work: "You need meaning, creative freedom and a supportive team. Harsh competition and purely numerical targets wear you down.",
    roles: ["Writing and content", "Design", "Psychology", "Charity and policy", "UX"],
    relationships: "Warm, accepting and loyal. Raising small issues early keeps them from becoming big ones.",
    growthEdge: "Break big dreams into weekly steps. Momentum is kinder to you than waiting for the perfect moment.",
  },
  ENFJ: {
    summary:
      "You bring people together and help them grow. You notice what each person needs, communicate easily and enjoy organising a group around a shared goal. People tend to trust you quickly.",
    atBest: "Motivating a team, smoothing conflict, and helping someone see what they are capable of.",
    underStress: "You overcommit, take criticism personally, and neglect your own needs while looking after everyone else.",
    work: "You thrive in people-centred roles with responsibility and a purpose, and in teams that value collaboration.",
    roles: ["Teaching and coaching", "HR and people leadership", "Client relations", "Marketing", "Public policy"],
    relationships: "Generous and attentive. Letting others look after you sometimes keeps things balanced.",
    growthEdge: "Not every problem is yours to fix. Choose where your energy matters most.",
  },
  ENFP: {
    summary:
      "You are full of ideas and energy and connect with people easily. You see possibilities everywhere, value freedom, and are at your best when something new is happening. Routine feels like a cage.",
    atBest: "Inspiring people, linking ideas across fields, and lifting the mood of any room.",
    underStress: "You get scattered, start too many things, and feel restless or low when life gets repetitive.",
    work: "You need variety, people and room to experiment. Strict hierarchy and repetitive admin drain you fast.",
    roles: ["Marketing and brand", "Entrepreneurship", "Media", "Social media strategy", "Consulting"],
    relationships: "Enthusiastic and affectionate. Consistency in small things shows people they can rely on you.",
    growthEdge: "Keep a short list of what you are finishing this month, and say no to the rest.",
  },
  ISTJ: {
    summary:
      "You are reliable, thorough and practical. You trust what has been shown to work, keep your promises and like things done properly. People count on you because you follow through.",
    atBest: "Keeping complex work accurate and on schedule, and being the steady person in a crisis.",
    underStress: "You become rigid, fixate on rules or details, and find sudden change hard to accept.",
    work: "You do best with clear expectations, structure and work where accuracy matters.",
    roles: ["Accounting and audit", "Risk and compliance", "Operations", "Engineering", "Back-end development"],
    relationships: "Steady, loyal and dependable. Planning some spontaneity sounds odd but works well.",
    growthEdge: "Try one new approach a month. The tried and tested way started as an experiment too.",
  },
  ISFJ: {
    summary:
      "You quietly look after people and details. You remember what matters to others, work hard behind the scenes and value stability. You are often the glue that holds a group together.",
    atBest: "Practical kindness, patience and reliability that make everyone around you better off.",
    underStress: "You take on too much, find it hard to say no, and worry about letting people down.",
    work: "You thrive in stable, cooperative workplaces where your care and accuracy are noticed.",
    roles: ["Healthcare", "Teaching", "Administration and operations", "Accounting", "Customer success"],
    relationships: "Devoted and thoughtful. Asking directly for what you need gives others the chance to return the care.",
    growthEdge: "Your contribution is real even when it is quiet. Let people see it.",
  },
  ESTJ: {
    summary:
      "You get things organised and done. You value clear rules, take responsibility and say what you think. Under your watch, deadlines are met and standards are kept.",
    atBest: "Running projects efficiently, making decisions and holding everyone to the same fair standard.",
    underStress: "You become controlling, impatient with ambiguity, and blunt in a way that stings.",
    work: "You do best with authority, clear goals and measurable results.",
    roles: ["Management", "Banking operations", "Project management", "Law enforcement and military", "Corporate finance"],
    relationships: "Committed and protective. Asking for others' opinions before deciding goes a long way.",
    growthEdge: "Leave room for other ways of doing things. Results can arrive by more than one route.",
  },
  ESFJ: {
    summary:
      "You are sociable, considerate and practical. You keep groups running smoothly, value tradition and notice when someone is left out. People feel welcome around you.",
    atBest: "Bringing people together, offering practical help and creating a warm, organised atmosphere.",
    underStress: "You worry about what others think, take conflict personally and overextend yourself.",
    work: "You thrive in cooperative teams with clear roles and plenty of contact with people.",
    roles: ["Healthcare", "Events and hospitality", "HR", "Sales", "Teaching"],
    relationships: "Warm, loyal and attentive. Remember that disagreement does not mean rejection.",
    growthEdge: "Make some decisions just for you, and notice how little goes wrong.",
  },
  ISTP: {
    summary:
      "You are calm, practical and independent. You learn by doing, like to understand how things work and stay cool when others panic. You prefer action to talk.",
    atBest: "Solving practical problems fast, staying level-headed in a crisis and mastering tools and skills.",
    underStress: "You withdraw, go silent, and may take risks to break the tension.",
    work: "You need hands-on problems, freedom and minimal bureaucracy.",
    roles: ["Engineering", "Trading", "Cybersecurity", "DevOps and cloud", "Mechanics and technical trades"],
    relationships: "Easy-going and loyal in your own way. Telling people what you are thinking stops them guessing.",
    growthEdge: "Plan a little further ahead. Your instincts are good, and a plan makes them go further.",
  },
  ISFP: {
    summary:
      "You are gentle, observant and live in the present. You express yourself through what you make or do rather than what you say, and you value freedom and harmony.",
    atBest: "Creating beautiful or useful things, noticing small details and being kind without fuss.",
    underStress: "You avoid conflict, feel misunderstood and may drop plans to protect your peace.",
    work: "You thrive with creative freedom, a supportive atmosphere and work you can see and touch.",
    roles: ["Design", "Photography and video", "Healthcare", "Front-end development", "Craft and making"],
    relationships: "Caring, accepting and loyal. Speaking up about what you want is as important as noticing what others want.",
    growthEdge: "Share your work earlier. Feedback is information, not a verdict.",
  },
  ESTP: {
    summary:
      "You are energetic, direct and action-oriented. You read situations quickly, enjoy risk and prefer learning on the job to reading the manual. Things happen when you are around.",
    atBest: "Acting decisively under pressure, negotiating and turning problems into opportunities.",
    underStress: "You get impulsive, bored and impatient with long-term planning.",
    work: "You need pace, variety and real-world results. Slow, theory-heavy work frustrates you.",
    roles: ["Trading", "Sales", "Entrepreneurship", "Emergency services", "Sport"],
    relationships: "Fun, generous and spontaneous. Keeping a few long-term promises shows depth behind the energy.",
    growthEdge: "Pause before the big decisions. A night's sleep costs little and saves a lot.",
  },
  ESFP: {
    summary:
      "You are lively, generous and great with people. You enjoy the moment, make ordinary things fun and notice what people need right now. Your energy is contagious.",
    atBest: "Putting people at ease, helping in practical ways and lifting the mood when it is needed.",
    underStress: "You avoid hard conversations, chase distraction and struggle with long, solitary tasks.",
    work: "You thrive in lively, people-facing work with variety and visible results.",
    roles: ["Events and hospitality", "Sales", "Performing and media", "Marketing", "Healthcare"],
    relationships: "Warm, fun and affectionate. Talking about the future now and then reassures people you are in it for the long run.",
    growthEdge: "Build one small routine you keep. Freedom feels better with a steady base.",
  },
};

/** Plain words for a Big Five percentile. */
export const TRAIT_WORDS: Record<string, [string, string, string, string, string]> = {
  O: ["Very practical and down to earth", "Practical, prefers the familiar", "Balanced between new and familiar", "Curious and imaginative", "Very curious, full of ideas"],
  C: ["Very spontaneous and flexible", "Relaxed about plans", "Organised when it matters", "Organised and dependable", "Very disciplined and thorough"],
  E: ["Very reserved, recharges alone", "Quiet, prefers small groups", "Ambivert, at ease either way", "Outgoing and sociable", "Very outgoing, energised by people"],
  A: ["Very direct and competitive", "Frank, says what they think", "Fair, warm but firm", "Kind and cooperative", "Very warm, puts others first"],
  N: ["Very calm, rarely rattled", "Calm under pressure", "Average ups and downs", "Feels things strongly", "Very sensitive to stress"],
};
export const traitWord = (t: string, pct: number) => TRAIT_WORDS[t][pct < 10 ? 0 : pct < 35 ? 1 : pct < 65 ? 2 : pct < 90 ? 3 : 4];
