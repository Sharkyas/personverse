/*
 * Hand-written content for the SYNTHETIC coach data (v2). Nothing here is quoted from a paper: the challenges are
 * written for this app in the style of the weekly behavioural challenges in Hudson & Fraley (2015), Hudson et al.
 * (2019) and the PEACH trial (Stieger et al., 2021), and every factual statement follows research/research.md.
 *
 * A challenge is [level, facet, text, why]. Level 1 is easy, 3 is hard: plans ramp up, as graded practice does.
 * {slots} are filled from the person's stage of life (SLOTS below).
 */
import type { Trait } from "@/lib/params";

export type Dir = "up" | "down";
export type StageKey = "school" | "uni" | "work" | "between" | "caring" | "retired";
export type Ch = [1 | 2 | 3, string, string, string];

export const SLOTS: Record<StageKey, Record<string, string>> = {
  school: { peer: "classmate", group: "lesson", lead: "teacher", task: "piece of homework", place: "school", gap: "break time", sit: "I sit down to revise", team: "class or team", event: "club or after-school event", duty: "school work" },
  uni: { peer: "coursemate", group: "seminar", lead: "tutor", task: "piece of coursework", place: "campus", gap: "the gap between lectures", sit: "I open my laptop to study", team: "course or society", event: "society event", duty: "coursework" },
  work: { peer: "colleague", group: "meeting", lead: "manager", task: "work task", place: "work", gap: "my lunch break", sit: "I start work", team: "team", event: "work social or local meet-up", duty: "work" },
  between: { peer: "friend or former colleague", group: "group or class", lead: "mentor or adviser", task: "application or admin task", place: "the local library or café", gap: "mid-morning", sit: "I sit down for the day's job search", team: "group or class", event: "local meet-up or volunteering session", duty: "job search" },
  caring: { peer: "fellow parent or carer", group: "group you go to", lead: "person whose judgement you trust", task: "household job", place: "your neighbourhood", gap: "a quiet half hour", sit: "the house goes quiet", team: "family or group", event: "local group or class", duty: "week's jobs at home" },
  retired: { peer: "neighbour or friend", group: "club or community meeting", lead: "group organiser", task: "project or errand", place: "your local area", gap: "mid-morning", sit: "I finish breakfast", team: "club or group", event: "club, class or community event", duty: "own projects" },
};

export const LIB: Record<Trait, Record<Dir, Ch[]>> = {
  E: {
    up: [
      [1, "friendliness", "Say good morning and one extra sentence to a {peer} you rarely speak to, on three days this week.", "Tiny, repeatable openers are the easiest way to practise outgoing behaviour, and the behaviour comes before the trait."],
      [1, "friendliness", "Each day, ask one person a question about their week and listen to the whole answer.", "Showing interest first gives you a script to fall back on, which makes starting conversations less effortful."],
      [1, "assertiveness", "In one {group} this week, be the first to say something, even if it is only a question.", "Speaking early stops the pressure building, and small acts of assertiveness are how the habit starts."],
      [1, "cheerfulness", "Tell one person a day about something that went well, however small.", "Sharing good news out loud practises the expressive, upbeat side of extraversion."],
      [1, "gregariousness", "Eat lunch with other people twice this week instead of alone.", "Choosing company at an easy, regular moment builds the habit without needing a big social event."],
      [1, "activity level", "Add one extra thing to two days this week: a walk with someone, a class or a quick call.", "A slightly fuller week builds the energy and pace that extraversion describes."],
      [2, "assertiveness", "Give your opinion once in a {group} before anyone asks for it.", "Volunteering a view is the core of assertiveness, and it gets easier each time nothing bad follows."],
      [2, "gregariousness", "Organise a small plan (coffee, a game, a walk) and invite two people.", "Being the one who arranges things moves you from joining in to starting, which is what the trait measures."],
      [2, "friendliness", "Start one conversation a day with someone you do not know well, and keep it going for three exchanges.", "In experience-sampling studies people felt better in the moments they acted more outgoing, which makes the next attempt easier."],
      [2, "assertiveness", "Ask for one thing you want this week, such as help, a favour or a place on something you would like to join.", "Asking directly is a learnable skill, and each request that goes fine weakens the urge to stay quiet."],
      [2, "gregariousness", "Go to one {event} this week and stay for at least 45 minutes.", "Staying past the awkward first ten minutes is when groups start to feel rewarding."],
      [2, "activity level", "Say yes to the next two invitations you get, before thinking of a reason not to.", "A default of yes raises how often you are around people, and frequency is what shifts the trait."],
      [2, "excitement-seeking", "Try one lively activity that is new to you: a class, a sport or an event you would normally skip.", "Seeking a bit of stimulation on purpose trains the appetite for it."],
      [3, "assertiveness", "Volunteer to lead one thing: open the discussion in a {group}, present an idea or organise an activity for your {team}.", "Taking the lead once shows you can hold a room, which is the hardest and most convincing evidence for yourself."],
      [3, "gregariousness", "Host something for four or more people, even if it is only food at yours or a group walk.", "Hosting puts you at the centre of a group in a setting you control."],
      [3, "friendliness", "At your next {event}, introduce yourself to two new people, then introduce them to each other.", "Connecting other people is extraverted behaviour at full stretch, and it gives you a clear job to do in the room."],
      [3, "assertiveness", "Disagree out loud once this week, politely, when you would normally stay quiet.", "Polite disagreement is assertiveness in its plainest form, and practising it on small things makes it available for big ones."],
      [3, "friendliness", "Call, rather than message, a friend you have not spoken to for months and suggest meeting up.", "A call is a bigger social risk than a text, and taking it rebuilds a link at the same time."],
      [3, "cheerfulness", "Give a two-minute talk, toast or update in front of a group.", "Being briefly the focus of attention, and surviving it, makes every smaller act of speaking up feel easy."],
    ],
    down: [
      [1, "gregariousness", "Schedule two solo recharge blocks of an hour this week and protect them like appointments.", "Protected time alone shifts where your social energy goes, which is the behaviour behind a quieter style."],
      [1, "assertiveness", "In one conversation a day, ask a follow-up question before sharing your own story.", "Listening first is the simplest way to practise taking up less of the room."],
      [1, "excitement-seeking", "Leave one evening this week free of plans and screens, and do something quiet you enjoy.", "Learning that a quiet evening can be satisfying lowers the pull towards constant stimulation."],
      [1, "assertiveness", "Before speaking in a {group}, count to three and let someone else go first, once a day.", "A short pause breaks the reflex to fill every silence."],
      [2, "gregariousness", "Turn down one social invitation this week without giving a long excuse.", "Saying no once shows you that relationships survive it, which makes solitude a choice instead of a loss."],
      [2, "activity level", "Eat one meal a day without your phone or company, and notice what you think about.", "Regular moments of low stimulation build comfort with your own thoughts."],
      [2, "assertiveness", "In your next {group}, aim to speak for less than a fifth of the time and note what you learned by listening.", "Setting a talking budget turns reflection into something you can practise and measure."],
      [2, "gregariousness", "Swap one lively group plan for a one-to-one conversation with a single friend.", "Depth with one person uses social energy differently from breadth with many."],
      [3, "excitement-seeking", "Take a half day entirely on your own, such as a long walk or a gallery, with notifications off.", "A longer stretch alone tests whether quiet restores you, and most people find it does."],
      [3, "assertiveness", "For a week, let other people choose the plan, and notice each time you wanted to take over.", "Stepping back from leading builds the reflective habits at the lower end of extraversion."],
      [3, "activity level", "Do 90 minutes of deep solo work, three times this week, before you check any messages.", "Sustained solitary focus is the working style that goes with a more reserved temperament."],
    ],
  },
  C: {
    up: [
      [1, "orderliness", "Write tomorrow's top three tasks on paper before bed, every night this week.", "Deciding the night before means the morning needs no willpower, only a list."],
      [1, "orderliness", "Spend ten minutes each evening resetting your desk, bag or kitchen for the morning.", "A short daily reset is the smallest routine that makes order feel normal."],
      [1, "dutifulness", "Arrive five minutes early to every commitment for seven days.", "Punctuality is reliability other people can see, and it trains you to plan backwards from a time."],
      [1, "self-discipline", "Do one 25-minute focus block a day with your phone in another room.", "Removing the cue is more dependable than resisting it, and one block a day is short enough to finish."],
      [1, "self-efficacy", "Each evening, write down one thing you finished today, however small.", "Noticing what you complete builds the belief that you are someone who follows through."],
      [1, "cautiousness", "Before any unplanned purchase or snap decision this week, wait ten minutes and write one line on why you want it.", "A short delay is enough to turn an impulse into a choice."],
      [2, "self-discipline", "Start your hardest {task} first on three days this week, before email or messages.", "Doing the difficult thing first uses your best attention and removes the dread from the rest of the day."],
      [2, "dutifulness", "Reply to every message that needs an answer within 24 hours for a week.", "Closing loops quickly is a habit, and it is one of the first things people notice."],
      [2, "orderliness", "Put every deadline and appointment for the next month into one calendar, and check it each morning.", "One trusted system means nothing depends on memory, which is where most slips come from."],
      [2, "achievement-striving", "On Monday set one goal for the week with a number in it, and review it on Friday.", "Specific goals with a review point work better than vague intentions, because you can tell whether you hit them."],
      [2, "cautiousness", "Before you call any {task} finished, check it once against a short list of the mistakes you usually make.", "A personal checklist catches habitual errors without relying on feeling careful."],
      [2, "self-discipline", "Keep one small daily habit for seven days running (bed made, ten pages read, ten minutes of exercise) and tick it off.", "An unbroken week of something easy teaches consistency better than one heroic day."],
      [3, "achievement-striving", "Break one large goal into weekly steps for the next month and finish this week's step by Friday.", "Turning a goal into dated steps is what if-then planning does, and it had a medium-to-large effect on reaching goals across 94 studies."],
      [3, "dutifulness", "Make one promise to someone this week with a date attached, and deliver it a day early.", "A public commitment raises the stakes just enough to make follow-through likely."],
      [3, "self-discipline", "Do two 45-minute focus blocks a day for five days, and log each one on paper.", "Longer blocks stretch your attention, and the log makes a missed day visible."],
      [3, "orderliness", "Hold a weekly review every Sunday: what got done, what slipped, and the three priorities for next week.", "A weekly review is the routine that keeps every other routine alive."],
      [3, "self-efficacy", "Pick the {task} you have been avoiding longest and finish it this week, in the smallest steps you need.", "Clearing the thing you dread is strong evidence to yourself that avoidance is optional."],
      [3, "cautiousness", "Plan one day this week hour by hour the night before, then compare the plan with what happened.", "Comparing plan with reality shows where your time estimates are wrong, which is the root of most lateness."],
    ],
    down: [
      [1, "orderliness", "Leave one evening completely unplanned and follow what you feel like doing.", "Unstructured time shows you that nothing collapses when the plan is missing."],
      [1, "achievement-striving", "Finish one low-stakes {task} at good enough, without a final polish.", "Shipping at good enough is the direct opposite of the perfectionist habit, so it is the behaviour to rehearse."],
      [1, "cautiousness", "Say yes to one spontaneous invitation this week.", "Acting on the spur of the moment in a safe setting builds tolerance for not being prepared."],
      [1, "orderliness", "Leave one small thing untidy for a day and notice that nothing goes wrong.", "A harmless bit of disorder tests the belief that everything must be in place."],
      [2, "achievement-striving", "Set a timer on one {task} for half the time you would normally spend, and stop when it rings.", "A hard stop forces you to choose what matters, which rigid standards never do."],
      [2, "self-discipline", "Take a proper break in the middle of the day on three days, with no task attached.", "Rest that is not earned by output loosens the link between worth and productivity."],
      [2, "cautiousness", "Make one decision this week in under a minute that you would usually research.", "Fast, reversible decisions teach you how rarely the extra research changes the outcome."],
      [2, "dutifulness", "Delete or delegate two items from your to-do list instead of doing them.", "Dropping tasks on purpose shows that not everything you could do is yours to do."],
      [3, "orderliness", "Spend a whole day off with no list, no plan and no alarm.", "A full day without structure is the strongest test of whether you can enjoy slack."],
      [3, "dutifulness", "Let someone else organise a shared plan from start to finish without checking their work.", "Handing over control and living with a different standard is the hard end of flexibility."],
      [3, "achievement-striving", "Drop one commitment you keep only out of habit, and tell the people involved.", "Letting go of an obligation makes room, and it shows that people cope when you do less."],
    ],
  },
  O: {
    up: [
      [1, "adventurousness", "Order something you have never tried, and write one line on what surprised you.", "Small doses of novelty with low stakes make the unfamiliar feel rewarding instead of tiring."],
      [1, "intellect", "Spend 20 minutes on a topic you know nothing about and tell someone one thing you learned.", "Following curiosity on purpose, then sharing it, is the habit that openness describes."],
      [1, "adventurousness", "Take a different route on a regular trip three times this week, and notice three new things each time.", "Breaking one routine trains you to look for what is new in familiar places."],
      [1, "artistic interests", "Listen to one album or watch one film from a style or country you normally ignore.", "Exposure to unfamiliar art widens taste, and taste is one of the clearest markers of openness."],
      [1, "imagination", "Spend ten minutes a day writing 'what if' ideas about anything, without judging them.", "Generating ideas without editing them exercises imagination the way a daily walk exercises legs."],
      [1, "emotionality", "After a film, song or book this week, write two lines on what you felt and why.", "Paying attention to your reactions deepens the experience, which is the emotional side of openness."],
      [2, "intellect", "Go to one talk, exhibition or {event} outside your usual interests.", "New ideas land better in person, and going once makes going again far more likely."],
      [2, "openness to other values", "Read a well-argued piece you expect to disagree with, and write down its strongest point.", "Finding the best version of an opposing view is the most direct exercise in open-mindedness."],
      [2, "artistic interests", "Make something small with your hands this week: a sketch, a recipe from scratch or a photo series.", "Making, not only consuming, builds confidence with creative activity."],
      [2, "adventurousness", "Visit a part of town you have never been to, with no plan for what to do there.", "Unplanned exploring is novelty in a concentrated dose."],
      [2, "intellect", "Ask a {peer} what fascinates them about their favourite subject, and ask three follow-up questions.", "Other people's enthusiasms are the cheapest route into ideas you would never choose yourself."],
      [2, "imagination", "Pick one everyday problem and come up with ten different solutions, including silly ones.", "Pushing past the first obvious answers is how flexible thinking is trained."],
      [3, "adventurousness", "Sign up for a short course or class in something that has no practical use to you.", "In one trial, a programme of mentally stretching activities raised openness even in older adults."],
      [3, "openness to other values", "Have a long conversation with someone whose background or views are very different from yours, mostly asking questions.", "Contact with different outlooks is thought to be why time abroad raises openness, and you can get it at home."],
      [3, "artistic interests", "Finish a small creative project and show it to one person.", "Finishing and sharing turns a private interest into part of how you see yourself."],
      [3, "intellect", "Read a serious book or long article outside your field and summarise it in five sentences.", "Wrestling with demanding material, then compressing it, stretches the intellectual side of openness."],
      [3, "adventurousness", "Plan a day trip to somewhere new, alone or with a friend, and go.", "A whole day of unfamiliar surroundings is the nearest everyday version of travel."],
    ],
    down: [
      [1, "adventurousness", "Pick one routine (morning, study or exercise) and run it identically five days in a row.", "Repeating a routine shows you what consistency gives back in time and attention."],
      [1, "imagination", "Before starting anything new this week, finish one thing you already began.", "Finishing first trades breadth for depth, which is the practical side of lower openness."],
      [1, "adventurousness", "Choose the tried-and-tested option once a day and note how it went.", "Picking the proven option on purpose shows how often it is simply good enough."],
      [2, "intellect", "Stick with one book, course or project all week, with no switching.", "Staying with one thing builds the depth that constant novelty prevents."],
      [2, "imagination", "Turn one good idea into a concrete next step with a date, and ignore new ideas until it is done.", "Ideas only pay off when one of them gets finished."],
      [2, "adventurousness", "Use the standard method for one {task} instead of inventing your own.", "Conventions exist because they usually work, and using one frees your attention for the task itself."],
      [3, "adventurousness", "Keep the same weekly timetable for a fortnight and note what it frees up.", "Two weeks is long enough to feel the benefit of predictability."],
      [3, "intellect", "Say no to one new opportunity so that you can finish an existing commitment.", "Turning down something interesting is the hardest part of focus, so it is worth practising."],
      [3, "imagination", "Take one plan from idea to finished, dull details included, before you tell anyone about the next one.", "Seeing the unglamorous part through is what makes a practical reputation."],
    ],
  },
  A: {
    up: [
      [1, "altruism", "Send one genuine, specific thank-you message a day.", "Small, repeated acts of warmth are the behaviours that raised agreeableness in the weekly-challenge studies."],
      [1, "sympathy", "Once a day, ask someone how they are and wait for the real answer.", "Giving people room to answer honestly is the first step in tuning in to how they feel."],
      [1, "trust", "Once this week, assume good intent where you would normally assume bad, and act on it.", "Testing a kinder reading of people's motives is how a suspicious habit loosens."],
      [1, "altruism", "Do one small favour that nobody asked for.", "Unprompted help is warmth in its most visible form, and it costs little."],
      [1, "modesty", "Give the credit to someone else once this week, in front of other people.", "Publicly sharing credit signals that you are on the same side."],
      [1, "cooperation", "Let someone else choose once a day: the film, the place or the plan.", "Yielding on small things practises cooperation where nothing important is at stake."],
      [2, "cooperation", "In one disagreement, restate the other person's view until they say 'yes, that's it' before you give yours.", "Perspective-taking changes how you read the other side, and people soften when they feel understood."],
      [2, "sympathy", "Check in on someone who is having a hard time, and offer one specific bit of help.", "A concrete offer shows care more clearly than a general one."],
      [2, "trust", "Hand one job to someone else and do not check their work.", "Trust grows by extending it and seeing that most people deliver."],
      [2, "straightforwardness", "Give one honest compliment a day that names exactly what the person did.", "Specific praise builds the habit of looking for what others do well."],
      [2, "altruism", "Give an hour of your time this week to help a {peer} with something of theirs.", "Spending real time on someone else's goal is cooperation people remember."],
      [2, "cooperation", "When you feel like criticising, ask a question instead, twice this week.", "A question keeps the conversation open where a criticism would close it."],
      [3, "cooperation", "Find one argument you keep having and offer a compromise in which you give up more than usual.", "Choosing the relationship over the win is the core of agreeableness, practised on something that matters."],
      [3, "altruism", "Volunteer for a few hours, or take on the job in your {team} that nobody wants.", "Sustained helping makes generosity part of how you see yourself, beyond a single good deed."],
      [3, "sympathy", "Apologise properly to someone for one thing you got wrong, without adding 'but'.", "A clean apology puts the other person's feelings ahead of being right."],
      [3, "trust", "Tell someone something a little personal about yourself and ask for their advice.", "Showing some vulnerability invites closeness, and asking for advice shows you value their view."],
      [3, "modesty", "Ask a {peer} for honest feedback on how you come across, and only say thank you.", "Hearing feedback without defending yourself is a demanding exercise in putting ego aside."],
    ],
    down: [
      [1, "cooperation", "Say no to one request you would normally agree to out of guilt.", "One small refusal shows that people cope, which is what makes the next one possible."],
      [1, "straightforwardness", "Once a day, state a clear preference when someone asks what you want.", "Naming what you want is the smallest unit of assertiveness."],
      [1, "altruism", "Wait 24 hours before saying yes to any new favour this week.", "A pause separates real willingness from the reflex to please."],
      [2, "straightforwardness", "Give one piece of honest, specific critical feedback, kindly.", "Useful criticism delivered warmly builds assertiveness without costing the relationship."],
      [2, "cooperation", "Negotiate once this week: a deadline, a price or a role.", "Negotiating treats your interests as legitimate, which over-accommodating people rarely do."],
      [2, "modesty", "When you disagree in a {group}, say so in one sentence without softening it twice.", "Plain disagreement, stated once, is easier to hear than a hedge."],
      [2, "modesty", "Ask for one thing you have earned: credit, a refund or your turn.", "Claiming what is fair is a skill that improves with repetition."],
      [3, "cooperation", "Hold one boundary this week when someone pushes back, without apologising for it.", "Keeping a boundary under pressure is where being firm is actually tested."],
      [3, "straightforwardness", "Raise one problem directly with the person involved instead of working around it.", "Direct conversations are uncomfortable for a few minutes and save weeks of resentment."],
      [3, "altruism", "Put your own priority first for a whole day and let other people's requests wait.", "A day on your own agenda shows that your needs can come first without anything breaking."],
    ],
  },
  N: {
    down: [
      [1, "anxiety", "When stress spikes, write the emotion down in one word and rate it from 0 to 10 before you act.", "Putting a feeling into words dampens the brain's alarm response in the moment."],
      [1, "vulnerability to stress", "Do ten minutes of slow breathing or a brisk walk every day for seven days.", "A daily way of bringing your body down from alert makes stress feel more manageable."],
      [1, "anxiety", "For one worry this week, write the worst case, the best case and the most likely case.", "Seeing the likely outcome beside the worst one weakens the habit of treating them as the same."],
      [1, "sadness", "Each night, write down three things that went well and your part in each.", "Deliberately recalling what went right balances a mind that files the bad more readily than the good."],
      [1, "anger", "When irritation rises, take ten slow breaths before you reply, three times this week.", "A gap between feeling and reaction is the skill that everything else in emotional stability rests on."],
      [1, "vulnerability to stress", "Keep the same bedtime and wake-up time for seven days.", "Regular sleep is one of the most dependable ways to steady mood."],
      [2, "anxiety", "Give your worries a 15-minute slot each day; when one turns up outside it, note it down and wait.", "Postponing worry teaches you that anxious thoughts can be delayed, which loosens their grip."],
      [2, "self-consciousness", "Do one thing that makes you slightly nervous in front of others, such as a question in a {group} or a phone call, and write down what actually happened.", "Facing a small fear and recording the real outcome corrects the prediction that it will go badly."],
      [2, "sadness", "Schedule two activities this week that you used to enjoy, and do them whether or not you feel like it.", "Action often comes before motivation, so doing the activity is what brings the mood back."],
      [2, "anger", "After one annoying moment a day, write a calmer explanation for why the other person did it.", "Practising a second interpretation makes the first, angrier one less automatic."],
      [2, "impulsiveness", "When an urge hits (to snack, scroll or spend), wait ten minutes and rate it again before deciding.", "Urges rise and fall on their own, and watching one pass is how you learn that."],
      [2, "vulnerability to stress", "Exercise hard enough to get out of breath three times this week.", "Regular exercise lowers baseline tension and shows you that a racing heart is not always a threat."],
      [3, "anxiety", "List five things you avoid because they make you anxious, rank them, and do the easiest two.", "Graded exposure is one of the best-tested ways of reducing fear: avoidance keeps it alive, approach lets it fade."],
      [3, "self-consciousness", "Do one mildly embarrassing thing on purpose in public, such as asking an obvious question, and notice how little anyone reacts.", "Finding out that other people barely notice shrinks the fear of being judged."],
      [3, "vulnerability to stress", "Before one stressful event this week, write a short plan: what could go wrong, and what you would do about each.", "A coping plan turns a vague threat into a list of solvable problems."],
      [3, "sadness", "Tell someone you trust about one thing that has been weighing on you.", "Sharing a burden reduces it, and it tests the belief that you have to manage alone."],
      [3, "anxiety", "Do the one thing you have been putting off out of worry, in the first hour of a day.", "Emotional stability is the trait interventions move most, and approaching what you avoid is the common thread."],
      [3, "anger", "Have one difficult conversation calmly, with your three main points written down first.", "Preparation keeps you steady when feelings run high."],
    ],
    up: [
      [1, "anxiety", "Notice and name one feeling each day that you would usually brush past.", "Naming feelings builds emotional awareness, which is different from feeling worse."],
      [1, "sadness", "Each evening, write one line on the emotional high point and low point of the day.", "A daily note makes the quieter emotions visible."],
      [1, "self-consciousness", "When someone asks how you are, give a real answer once a day.", "Answering honestly practises letting feelings show."],
      [2, "anxiety", "Share one honest worry with someone you trust.", "Saying a worry aloud treats it as information instead of something to switch off."],
      [2, "vulnerability to stress", "When a decision feels fine, spend two minutes asking what could go wrong and write it down.", "A little deliberate caution balances a temperament that under-reacts to risk."],
      [2, "self-consciousness", "Ask someone close how a recent event felt for them, and compare it with how it felt for you.", "Comparing reactions shows what you may be missing in other people."],
      [3, "sadness", "Tell someone about a time you were scared or upset, without turning it into a joke.", "Staying with a hard feeling in company deepens relationships that calm people can keep at arm's length."],
      [3, "vulnerability to stress", "Before one risky choice this week, list the three things most likely to go wrong and one precaution for each.", "Structured worst-case thinking gives you the useful part of anxiety without the distress."],
      [3, "anxiety", "Watch or read something moving and let yourself feel it without distraction.", "Letting a strong feeling run its course widens your emotional range."],
    ],
  },
};


/** Round 2 additions to the challenge library, kept apart so the first set stays easy to compare. Merged into LIB below. */
const MORE: Record<Trait, Record<Dir, Ch[]>> = {
  E: {
    up: [
      [1, "cheerfulness", "Smile and make eye contact with three people a day, such as a shop worker, a neighbour or a {peer}.", "Brief friendly signals are the lowest-cost social behaviour there is, and they make the next step of speaking easier."],
      [1, "excitement-seeking", "Put on music you love and move to it for five minutes before you leave the house, three times this week.", "Raising your own energy on purpose is practice for the lively side of extraversion."],
      [2, "cheerfulness", "Tell a short story about your week to two different people, and note which parts they enjoyed.", "Telling a story holds attention for a minute, which is a manageable rehearsal for being the one who talks."],
      [2, "friendliness", "Learn and use the names of three people you see regularly but have never properly met.", "Using someone's name turns a familiar face into an acquaintance, which is how wider circles form."],
      [3, "excitement-seeking", "Join a group activity for a month, such as a team sport, choir or class, and go to the first two sessions.", "A standing commitment puts you among people every week without needing a fresh decision each time."],
      [3, "activity level", "Fill one free day this week with three separate plans that involve other people.", "A busy social day shows you what your energy can stretch to when you ask it."],
    ],
    down: [
      [1, "friendliness", "Once a day, let a conversation end naturally instead of finding a new topic to keep it going.", "Allowing a pause to close a chat practises being comfortable with less social contact."],
      [2, "excitement-seeking", "Replace one busy outing this week with a slow activity such as reading, cooking or a long walk.", "Choosing a low-key option on purpose tests whether you need the buzz or only expect to."],
      [3, "gregariousness", "Spend a full weekend day alone by choice, with one planned activity you look forward to.", "A day of chosen solitude shows that time alone can be a pleasure and not a gap between events."],
    ],
  },
  C: {
    up: [
      [1, "achievement-striving", "Each morning, write one sentence on what would make today a success, and check it at night.", "A daily aim gives effort a direction, which is the start of striving on purpose."],
      [1, "dutifulness", "Do one thing you said you would do, on the day you said, and tell the person it is done.", "Keeping a small promise visibly builds the reliable reputation that conscientiousness describes."],
      [2, "orderliness", "Clear and sort one drawer, folder or inbox a day for five days.", "Order built in small areas spreads, because a tidy patch makes the mess beside it obvious."],
      [2, "self-efficacy", "Take one {task} you think is beyond you, split it into five steps, and finish the first two.", "Getting part of the way through a hard job is the most direct evidence that you are capable of the rest."],
      [3, "achievement-striving", "Choose one skill, work on it for 30 minutes a day for six days, and record what improved.", "Deliberate daily effort with a record is how sustained striving becomes a habit instead of a mood."],
      [3, "cautiousness", "Before one big decision this week, write down two options, the cost of each and what you would regret.", "Writing options down slows a choice enough for judgement to catch up with impulse."],
    ],
    down: [
      [1, "self-discipline", "Stop work at a set time on two days this week, even if something is unfinished.", "A fixed stopping time shows that tomorrow can absorb what today did not finish."],
      [2, "orderliness", "Go one week without reorganising, colour-coding or rewriting any list.", "Dropping the upkeep reveals how much of it was for comfort and not for results."],
      [3, "cautiousness", "Take a small risk with a decision that can be undone, and resist checking how it is going for a day.", "Living with an unchecked decision builds tolerance for uncertainty, which rigid care never allows."],
    ],
  },
  O: {
    up: [
      [1, "openness to other values", "Ask someone twenty years older or younger than you what they think about a topic you care about.", "A view from another generation is an easy first step outside your own assumptions."],
      [1, "artistic interests", "Stop for two minutes each day to look closely at something well made: a building, a photo or a piece of music.", "Noticing craft on purpose trains the appreciation that openness to art is built on."],
      [2, "emotionality", "Watch a film or read a story chosen for its feeling, not its plot, and tell someone what moved you.", "Putting a reaction into words for another person deepens the emotional side of openness."],
      [2, "imagination", "Describe in writing how your ordinary day would go in a different country, century or job.", "Imagining another life in detail exercises the same flexibility that novelty in real life does."],
      [3, "intellect", "Teach someone a new idea you learned this week, and answer their questions without looking anything up.", "Explaining an idea exposes what you have not understood, which sends you back to learn more."],
      [3, "emotionality", "Go to a live performance of a kind you have never seen, such as a concert, play or reading.", "Live art is harder to half-attend than a screen, so it gives new experience at full strength."],
    ],
    down: [
      [1, "intellect", "When you learn something interesting this week, apply it once before reading anything further.", "Using an idea before chasing the next one builds a practical habit of mind."],
      [2, "artistic interests", "Choose function over style for one purchase or decision this week, and note what you saved.", "Putting usefulness first is the down-to-earth preference in action."],
      [3, "openness to other values", "Follow an established rule or tradition you usually question, for a week, and write down what it does well.", "Looking for the sense in a convention is how respect for tried ways grows."],
    ],
  },
  A: {
    up: [
      [1, "straightforwardness", "When you say you will help, name exactly what you will do and by when.", "A clear, honest offer is easier to trust than a vague kind one."],
      [1, "sympathy", "Each evening, think of one person who had a harder day than you and what it was like for them.", "Imagining someone else's day is the mental habit that sympathy grows from."],
      [2, "modesty", "In one conversation a day, ask about the other person's success before mentioning your own.", "Putting someone else's good news first is modesty that people can feel."],
      [2, "trust", "Ask someone for help with something you could do yourself, and accept the way they do it.", "Accepting help on their terms shows trust, and people tend to live up to it."],
      [3, "straightforwardness", "Tell someone a kind truth you have been holding back because it felt awkward.", "Honest warmth is harder than polite silence, and it is what closeness is made from."],
      [3, "cooperation", "Take on a shared {task} and let the other person's plan win wherever the two of you differ.", "Going with someone else's approach from start to finish is cooperation at full stretch."],
    ],
    down: [
      [1, "trust", "Before agreeing to one thing this week, ask a question that checks the facts.", "A polite check treats your own judgement as worth something."],
      [2, "sympathy", "Listen to someone's problem once this week without offering to fix it or take it on.", "Caring without rescuing keeps your time yours and their problem theirs."],
      [3, "modesty", "Describe one of your achievements to someone plainly, with no joke and no playing it down.", "Stating your own worth without apology is the piece of assertiveness that very agreeable people skip."],
    ],
  },
  N: {
    down: [
      [1, "self-consciousness", "After one social moment a day, write what you fear people noticed and what they most probably noticed.", "Checking the two against each other shows how much of the spotlight is imagined."],
      [1, "impulsiveness", "Plan your meals or spending for the next day each evening, and stick to the plan once.", "Deciding ahead removes the moment where a mood makes the choice."],
      [2, "sadness", "Spend 20 minutes outdoors in daylight every day this week, whatever the weather.", "Daylight and movement are small, dependable lifts to mood that cost almost nothing."],
      [2, "anger", "Write an unsent letter to someone who annoyed you, then write their reply as fairly as you can.", "Arguing the other side on paper cools anger and widens the story you are telling yourself."],
      [3, "impulsiveness", "Pick one habit you use to escape stress, and replace it with a ten-minute walk five times this week.", "Swapping an escape for something neutral teaches you that the urge passes without being obeyed."],
      [3, "self-consciousness", "Ask a question or make a comment in front of a group of ten or more people.", "Speaking to a larger group and finding it uneventful shrinks the fear of being watched."],
    ],
    up: [
      [1, "vulnerability to stress", "Once a day, notice one sign of tiredness or strain in your body and write it down.", "Reading your own stress signals is the base of emotional awareness."],
      [2, "anger", "When something is unfair this week, say that it bothers you instead of shrugging it off.", "Letting a justified irritation show tells people where your limits are."],
      [3, "self-consciousness", "Ask two people how you came across in a recent conversation, and take their answers seriously.", "Caring a little more about your effect on others is the useful part of self-consciousness."],
    ],
  },
};
for (const t of Object.keys(MORE) as Trait[]) for (const d of ["up", "down"] as Dir[]) LIB[t][d].push(...MORE[t][d]);

export const IF_THEN: Record<Trait, Record<Dir, string[]>> = {
  E: {
    up: [
      "If I walk into a {group} early, then I will say hello to the nearest person before I sit down.",
      "If a question is put to the room and nobody answers, then I will count to three and speak.",
      "If I get an invitation, then I will reply yes within the hour, before I can talk myself out of it.",
      "If I am standing next to someone I do not know, then I will ask them one question about their day.",
      "If it is {gap}, then I will message one person to make a plan.",
      "If I think of something to say in a {group}, then I will say it within ten seconds.",
      "If I join a queue or a lift with someone I recognise, then I will say hello first.",
      "If a plan is being made in a group chat, then I will reply within ten minutes with a yes or a suggestion.",
    ],
    down: [
      "If I notice I have been talking for more than a minute, then I will ask a question and listen.",
      "If my diary has plans on three evenings running, then I will keep the fourth one free.",
      "If I feel the urge to fill a silence, then I will count to five first.",
      "If I am invited out on a recharge evening, then I will suggest another day.",
      "If I have spoken twice in a row in a {group}, then I will wait for two other people before speaking again.",
    ],
  },
  C: {
    up: [
      "If it is 9pm, then I will write tomorrow's top three tasks before I touch my phone.",
      "If {sit}, then I will do 25 minutes on the hardest task before opening any messages.",
      "If I catch myself thinking 'I'll do it later', then I will do the first two minutes of it now.",
      "If I agree to do something, then I will put it in my calendar before the conversation ends.",
      "If I finish a task, then I will tick it off on paper and choose the next one straight away.",
      "If it is Sunday evening, then I will review the week and pick three priorities for the next one.",
      "If I pick up my phone during a focus block, then I will put it in another room and restart the timer.",
      "If someone gives me a deadline, then I will set my own one day earlier.",
    ],
    down: [
      "If I catch myself polishing something that is already good enough, then I will send it and move on.",
      "If someone suggests a last-minute plan, then I will say yes unless there is a real clash.",
      "If I start rewriting my to-do list, then I will close it and take a ten-minute break.",
      "If a task is not finished by the time I set, then I will stop anyway and decide tomorrow whether it matters.",
      "If I notice I am checking something for the third time, then I will stop and send it.",
    ],
  },
  O: {
    up: [
      "If I am choosing what to eat, watch or read, then I will pick the option I know least about.",
      "If someone mentions something I have not heard of, then I will ask them to tell me more.",
      "If I have 20 spare minutes, then I will read about something outside my usual interests.",
      "If I catch myself saying 'that's not for me', then I will try it once before deciding.",
      "If I am walking somewhere familiar, then I will take a street I have not used before.",
      "If I am offered something unfamiliar, then I will say yes before asking what it involves.",
      "If I disagree with an article, then I will read to the end before forming a view.",
    ],
    down: [
      "If a new idea distracts me, then I will write it in a notebook and go back to what I was doing.",
      "If I am tempted to change the plan, then I will finish today's step first.",
      "If there is a standard way to do the task, then I will use it before trying my own.",
      "If I want to start something new, then I will name the thing I will finish first.",
      "If I catch myself browsing for something new, then I will go back to the thing I already chose.",
    ],
  },
  A: {
    up: [
      "If I feel like criticising, then I will ask one question first.",
      "If someone helps me, then I will thank them and say exactly what it changed.",
      "If I disagree, then I will repeat their point back before I make mine.",
      "If I notice someone is quiet or left out, then I will ask what they think.",
      "If I feel wronged, then I will write down one innocent explanation before I respond.",
      "If someone tells me about a problem, then I will ask one question before I give any advice.",
      "If I am about to send a sharp message, then I will wait ten minutes and reread it.",
    ],
    down: [
      "If I am asked for a favour, then I will say 'let me check and get back to you' before answering.",
      "If I disagree, then I will say so once, plainly, before the topic moves on.",
      "If I feel guilty about saying no, then I will remind myself what I am saying yes to instead.",
      "If someone talks over me, then I will say 'I had not finished' and carry on.",
      "If I catch myself saying sorry for no reason, then I will say thank you instead.",
    ],
  },
  N: {
    down: [
      "If I notice my heart racing, then I will name the feeling and take five slow breaths.",
      "If a worry turns up outside my worry slot, then I will write it down and go back to what I was doing.",
      "If I am still awake and worrying after 20 minutes, then I will get up and write down the worry and one next step.",
      "If I make a mistake, then I will ask what I would say to a friend who did the same.",
      "If I feel like avoiding something, then I will do the first two minutes of it.",
      "If I catch myself imagining the worst, then I will write down the most likely outcome instead.",
      "If I notice my shoulders are tense, then I will drop them and breathe out slowly three times.",
      "If a setback happens, then I will write down one thing I can do about it today.",
    ],
    up: [
      "If someone asks how I am, then I will name one real feeling before I say 'fine'.",
      "If I notice a tight chest or a clenched jaw, then I will stop and ask what I am feeling.",
      "If I am about to dismiss a risk, then I will write down one way it could go wrong.",
      "If I say 'I'm fine' without thinking, then I will add one true sentence about my day.",
    ],
  },
};

export const IF_THEN_GENERIC = [
  "If I feel like skipping a challenge, then I will do the smallest two-minute version of it.",
  "If it is Sunday evening, then I will read next week's challenge and put it in my calendar.",
  "If I miss a day, then I will restart the next morning without trying to make up for it.",
  "If a challenge feels too big, then I will halve it and do that instead of nothing.",
  "If I finish a challenge, then I will tick it off and tell one person that I did it.",
  "If a week gets too busy, then I will do the challenge once, in its smallest form, before Sunday.",
];

/** How each direction reads in a headline or a sentence. `adj` fits "a ___ you"; `more` fits "you want to be ___". */
export const WORDS: Record<Trait, Record<Dir, { adj: string[]; more: string; doing: string; noun: string }>> = {
  E: {
    up: { adj: ["bolder", "more outgoing", "more talkative"], more: "more outgoing", doing: "starting conversations", noun: "extraversion" },
    down: { adj: ["quieter", "more reflective"], more: "more reserved", doing: "protecting quiet time", noun: "extraversion" },
  },
  C: {
    up: { adj: ["more organised", "more disciplined", "more reliable"], more: "more organised", doing: "planning ahead", noun: "conscientiousness" },
    down: { adj: ["more relaxed", "more spontaneous"], more: "more relaxed about plans", doing: "loosening your grip on plans", noun: "conscientiousness" },
  },
  O: {
    up: { adj: ["more curious", "more adventurous"], more: "more open to new things", doing: "trying unfamiliar things", noun: "openness" },
    down: { adj: ["more grounded", "more focused"], more: "more practical", doing: "sticking to routines", noun: "openness" },
  },
  A: {
    up: { adj: ["warmer", "kinder", "more patient"], more: "warmer with people", doing: "small acts of warmth", noun: "agreeableness" },
    down: { adj: ["firmer", "more assertive", "more direct"], more: "firmer with people", doing: "saying no when you mean no", noun: "agreeableness" },
  },
  N: {
    down: { adj: ["calmer", "steadier"], more: "calmer", doing: "facing small fears", noun: "neuroticism" },
    up: { adj: ["more emotionally aware", "more open about feelings"], more: "more in touch with your feelings", doing: "noticing what you feel", noun: "neuroticism" },
  },
};

/** Directions with strong or some trial evidence. The rest are "thin": few studies try to move the trait that way. */
export const EVIDENCE: Record<Trait, Record<Dir, "good" | "some" | "thin">> = {
  O: { up: "some", down: "thin" },
  C: { up: "good", down: "thin" },
  E: { up: "good", down: "thin" },
  A: { up: "some", down: "thin" },
  N: { down: "good", up: "thin" },
};

export const THIN_WATCHOUT: Record<Trait, string[]> = {
  O: [
    "Very few studies have tried to lower openness, so treat this as an experiment and stop if life starts to feel narrower than you want.",
    "Hardly any trials aim to reduce openness, so the size of change here is an estimate; keep one outlet for curiosity while you build routine.",
  ],
  C: [
    "Loosen up on things that only affect you, and keep your standards where other people depend on your deadlines; this direction is rarely studied, so go gently.",
    "Almost no research tests lowering conscientiousness, so the expected change is an estimate, and the aim is less rigidity, not less reliability.",
  ],
  E: [
    "Few trials have tried to lower extraversion, so the expected size is an estimate, and quieter should never slide into isolated.",
    "Lowering extraversion is rarely studied, so treat the numbers as a guide and keep the friendships that matter in the diary.",
  ],
  A: [
    "The aim is to be firmer, not colder: this direction has little trial evidence, so ease off if people who matter to you start pulling away.",
    "Research on lowering agreeableness is thin, so the size of change is an estimate; practise on low-stakes requests before the important ones.",
  ],
  N: [
    "Raising neuroticism here means noticing feelings more, not worrying more, so drop any exercise that leaves you going round in circles.",
    "Nobody studies raising neuroticism as a goal, so this is framed as emotional awareness and kept small; stop if it tips into rumination.",
  ],
};

export const GENERIC_WATCHOUT = [
  "Only take on challenges you will actually finish: in one study, people who accepted challenges and then skipped them drifted slightly the wrong way.",
  "Traits move slowly and unevenly, so judge progress over months, not days, and expect other people to notice later than you do.",
  "Self-ratings shift faster than what friends and family see, so do not read too much into how different you feel after a fortnight.",
  "These figures are averages from groups of people who wanted to change, so your own result could be larger, smaller or slower.",
  "Completing the challenge matters more than its size: a skipped ambitious week does less for you than a finished small one.",
  "A plan like this shifts habits first and the trait later, so a flat week or two is normal and not a sign that it is failing.",
  "If a week goes badly, repeat it once at half the size before moving on, because unfinished challenges do more harm than slow ones.",
  "Change measured by questionnaires is partly a change in how you see yourself, so ask someone who knows you well before deciding how far you have come.",
  "Do not add extra challenges when you feel keen, because the studies reward steady completion and not bursts.",
  "An eight-week plan covers about half the time the trials ran for, so treat it as the first leg and expect to repeat it.",
];

export const NAMES = [
  "Sam", "Aisha", "Tom", "Priya", "Jack", "Mei", "Omar", "Chloe", "Leo", "Zara", "Ben", "Hana", "Kofi", "Ella", "Ravi", "Maya", "Dan", "Sofia", "Yusuf", "Isla",
  "Amara", "Luca", "Fatima", "Noah", "Ines", "Tariq", "Grace", "Wei", "Callum", "Nia", "Arjun", "Freya", "Mateo", "Leila", "Owen", "Sana", "Finn", "Anya", "Idris", "Rosa",
  "Hamza", "Erin", "Kwame", "Lucy", "Dev", "Niamh", "Elif", "Rhys", "Chidi", "Poppy", "Ahmed", "Beth", "Jin", "Carys", "Tomasz", "Imani", "Alex", "Robyn", "Eduardo", "Morgan",
  "Ilyas", "Hannah", "Kai", "Layla", "Joe", "Sadia", "Marcus", "Eve", "Bilal", "Megan", "Yuki", "Liam", "Nadia", "Harry", "Amelia", "Jamal", "Olivia", "Sanjay", "Ruby", "Emeka",
  "Kate", "Farid", "Georgia", "Tunde", "Holly", "Ali", "Phoebe", "Rahul", "Mia", "Stefan", "Zainab", "Adam", "Lily", "Jorge", "Aoife", "Karim", "Tess", "Ming", "Declan", "Esme",
  "Ayaan", "Bea", "Connor", "Dina", "Elliot", "Folake", "Gus", "Huda", "Ivan", "Jas", "Kiran", "Lena", "Mo", "Nell", "Oscar", "Pia", "Reza", "Skye", "Theo", "Uma",
];
