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
      "People of this type often think several moves ahead, looking for the structure beneath a messy problem. They tend to prefer a few considered commitments to a crowded agenda. Quiet conviction can be a strength, though an elegant plan still needs contact with everyday reality.",
    atBest: "Tracing a recurring problem to its source, weighing long-term costs and building a solution that others can keep using.",
    underStress: "Planning can become a way to postpone uncertainty. Others may hear a verdict where a question was intended; stepping away helps restore perspective.",
    work: "Often drawn to complex problems, uninterrupted thinking and clear ownership. Explaining the reasoning behind a decision helps colleagues contribute before the plan hardens.",
    roles: ["Systems design", "Research", "Strategy", "Engineering", "Policy analysis"],
    relationships: "Care may show up as remembering a goal or solving a practical problem. Asking whether someone wants advice or company makes that care easier to receive.",
    growthEdge: "Share one unfinished idea with someone affected by it. Ask what the plan misses, then change one thing before polishing the rest.",
  },
  INTP: {
    summary:
      "People of this type often follow a question past the obvious answer. They enjoy pulling an idea apart, finding its hidden assumptions and putting it back together more simply. Their curiosity can open unexpected doors, while keeping every option open can make choosing one difficult.",
    atBest: "Finding the assumption everyone skipped, making a difficult idea understandable and changing position when a better explanation appears.",
    underStress: "Research may replace action, and a small practical task can feel harder than a complex puzzle. A short, concrete next step can break the loop.",
    work: "Often enjoy depth, experimentation and freedom over methods. A clear definition of finished can turn absorbing exploration into work people can actually use.",
    roles: ["Scientific research", "Software development", "Data analysis", "Technical writing", "Product research"],
    relationships: "Shared curiosity can be a form of closeness. Naming affection directly, and remembering to return to an interrupted conversation, helps others feel included.",
    growthEdge: "Choose a small question you can settle this week. Set a stopping point and share the answer, including what remains uncertain.",
  },
  ENTJ: {
    summary:
      "People of this type often turn a loose ambition into decisions, responsibilities and a deadline. They tend to enjoy making progress visible and giving a group direction. Their confidence can steady a team, though moving quickly may hide concerns that quieter people have not yet voiced.",
    atBest: "Giving a difficult project direction, resolving competing priorities and making sure decisions lead to action rather than another meeting.",
    underStress: "Taking over can feel faster than trusting others. Pressure may sharpen instructions while narrowing listening; a pause can reveal what extra effort will not fix.",
    work: "Often value responsibility and room to improve systems. Leadership works better when success includes a sustainable pace and colleagues can challenge the route.",
    roles: ["Operations", "Project leadership", "Entrepreneurship", "Consulting", "Public administration"],
    relationships: "Commitment may look like practical support and shared plans. Listening without turning a feeling into an action item leaves room for another kind of closeness.",
    growthEdge: "Before deciding, ask the person with the least airtime what concerns them. Reflect their answer back before offering your own view.",
  },
  ENTP: {
    summary:
      "People of this type often discover what they think by talking it through. They notice alternatives quickly and enjoy testing whether an accepted rule still earns its place. That inventiveness can unlock a stuck situation, though a lively debate does not always feel playful to everyone involved.",
    atBest: "Reframing a stale problem, connecting unlikely ideas and helping a group see an option beyond its first two choices.",
    underStress: "More possibilities can become more distraction. Arguing every angle may delay a commitment; choosing one useful experiment can restore momentum.",
    work: "Often enjoy variety, candid discussion and early-stage problems. Agreeing who will handle follow-through keeps a promising idea from becoming someone else's unfinished work.",
    roles: ["Product discovery", "Entrepreneurship", "Law", "Business development", "Creative strategy"],
    relationships: "Humour and curiosity can make time together feel fresh. Checking whether a topic is open for debate, and keeping small promises, helps that energy feel safe.",
    growthEdge: "Pick one idea to finish before pitching another. Write down what done means and tell someone when they can expect it.",
  },
  INFJ: {
    summary:
      "People of this type often look for a thread connecting private values, other people and the future. They may prefer a few thoughtful conversations to constant social contact. Their interpretations can be perceptive, but checking a hunch matters more than assuming they know what someone means.",
    atBest: "Making space for a difficult conversation, linking daily choices to a wider purpose and helping a patient plan take shape.",
    underStress: "Quietly carrying too much can lead to abrupt withdrawal. Saying what feels heavy before reaching that point gives others a chance to help.",
    work: "Often seek purposeful work, thoughtful colleagues and time to concentrate. Clear boundaries help meaningful work stay rewarding rather than becoming an unlimited personal obligation.",
    roles: ["User research", "Writing", "Education", "Community programmes", "Counselling with training"],
    relationships: "Attention and thoughtful questions can create closeness. Sharing an imperfect feeling is often more useful than waiting until it can be explained perfectly.",
    growthEdge: "Check one assumption aloud: \"I read that as disappointment. Did I understand?\" Let the answer revise the story, even when the hunch felt convincing.",
  },
  INFP: {
    summary:
      "People of this type often weigh a choice by whether they can stand behind it. Imagination and a concern for individual experience can give their work a distinctive voice. They may need time to find the right words, especially when an important value is at stake.",
    atBest: "Giving an overlooked perspective a voice, imagining a kinder alternative and making something that feels considered rather than merely polished.",
    underStress: "A disappointing draft or disagreement can start to feel like a judgement of the whole person. Returning to the specific problem makes repair more manageable.",
    work: "Often enjoy meaningful projects, creative latitude and respectful feedback. Small milestones can give an ambitious vision enough structure to survive an ordinary working week.",
    roles: ["Writing", "Design", "Community work", "Editorial work", "User experience"],
    relationships: "Acceptance and thoughtful gestures can make others feel seen. Stating a preference early helps prevent quiet accommodation from turning into resentment.",
    growthEdge: "Turn one value into a twenty-minute action this week. A rough first attempt gives the idea somewhere to grow.",
  },
  ENFJ: {
    summary:
      "People of this type often notice what helps a group feel connected and move together. They may enjoy encouraging someone before that person sees their own potential. Their investment can be generous, though support works best when the other person gets to choose the destination.",
    atBest: "Drawing out a quieter voice, giving useful encouragement and helping a group turn shared intentions into a workable commitment.",
    underStress: "Other people's disappointment can feel like a personal failure. Taking on more may deepen the strain; asking what is actually yours to do can help.",
    work: "Often enjoy collaborative work with a clear human purpose. Honest disagreement and realistic workloads matter as much as a team that gets along.",
    roles: ["Teaching", "Facilitation", "People development", "Client partnerships", "Community leadership"],
    relationships: "Regular check-ins and encouragement can build warmth. Asking whether help is wanted, and allowing others to offer it in return, keeps care mutual.",
    growthEdge: "Leave one manageable problem with its owner. Offer support once, then make room for their approach, even if it differs from yours.",
  },
  ENFP: {
    summary:
      "People of this type often see a possible connection before a neat plan. A new person, question or cause can quickly become a source of energy. Their enthusiasm can bring others along, while choosing which possibilities deserve time is often harder than finding another one.",
    atBest: "Connecting people across different circles, bringing imagination to a familiar problem and helping an uncertain beginning feel worth trying.",
    underStress: "An overcrowded calendar can turn excitement into restlessness or guilt. Reducing the number of live commitments gives curiosity room to return.",
    work: "Often enjoy variety, collaboration and room to experiment. Protected finishing time and a visible next step help creative energy become a dependable contribution.",
    roles: ["Communications", "Creative production", "Entrepreneurship", "Learning design", "Community building"],
    relationships: "Curiosity and spontaneous affection can make people feel interesting. Remembering an ordinary promise matters just as much as suggesting the next adventure.",
    growthEdge: "Keep a list of new ideas without acting on each one. Choose one existing promise to finish this week before adding another.",
  },
  ISTJ: {
    summary:
      "People of this type often build trust through what they consistently do. They tend to notice missing details, remember previous lessons and prefer a promise they can keep to an exciting assurance. Their care with established methods is useful, provided the method still fits the problem.",
    atBest: "Catching a small error before it becomes expensive, keeping a process dependable and following through when the novelty has worn off.",
    underStress: "Checking can crowd out judgement, and an unexpected change can feel like avoidable disorder. Separating essential standards from preferences can ease the pressure.",
    work: "Often value clear responsibilities, preparation and evidence that an approach works. Knowing why a change matters can make experimentation easier to support.",
    roles: ["Audit", "Quality assurance", "Engineering", "Operations", "Records management"],
    relationships: "Practical help and reliability may carry more weight than grand gestures. Saying what a relationship means adds warmth to the care already being shown.",
    growthEdge: "Test a new approach on one low-stakes task. Decide in advance what evidence would make it worth keeping.",
  },
  ISFJ: {
    summary:
      "People of this type often remember the details that make care personal: a preference, a deadline or something someone finds difficult. They may quietly make daily life easier for others. Being dependable need not mean being endlessly available, even when asking for help feels less familiar.",
    atBest: "Noticing an unmet practical need, preserving useful knowledge and creating continuity when people or circumstances change.",
    underStress: "Saying yes while running out of energy can turn care into obligation. Naming the limit early helps prevent resentment that others may never have noticed building.",
    work: "Often appreciate cooperative teams and useful work done carefully. Specific recognition and a fair division of routine tasks help quiet contributions stay sustainable.",
    roles: ["Healthcare support", "Education", "Administration", "Customer success", "Library services"],
    relationships: "Remembered details and steady presence can make others feel valued. Asking directly for comfort gives people a chance to offer care in their own way.",
    growthEdge: "Before accepting the next request, check your time. Try \"I can help tomorrow for half an hour\" instead of an automatic yes.",
  },
  ESTJ: {
    summary:
      "People of this type often make an unclear situation easier by naming the goal, the standard and the next step. They tend to take responsibilities seriously and expect others to do the same. That clarity is useful, though circumstances may call for different routes to a fair result.",
    atBest: "Turning an unclear brief into responsibilities, keeping a team supplied and prepared, and dealing with practical problems before they spread.",
    underStress: "More oversight can seem like the answer to every delay. Asking what is blocking someone may uncover a problem that firmer instructions would miss.",
    work: "Often enjoy coordination, visible progress and clear accountability. Explaining the purpose of a rule helps distinguish a necessary safeguard from an inherited habit.",
    roles: ["Project management", "Operations", "Logistics", "Finance", "Public services"],
    relationships: "Showing up and taking responsibility can communicate commitment. Asking before organising someone else's plans leaves room for their preferences too.",
    growthEdge: "Let someone choose the method for a shared task. Agree on the result and check-in time, then resist correcting differences that do no harm.",
  },
  ESFJ: {
    summary:
      "People of this type often notice the practical details that help a group feel welcoming. They may enjoy bringing people together and keeping shared rituals alive. Their attention to belonging can be a strength, while making room for differences keeps togetherness from becoming an expectation to agree.",
    atBest: "Welcoming a newcomer, coordinating practical support and making sure a shared occasion works for the people who might otherwise be forgotten.",
    underStress: "A cool response can feel more personal than intended. Checking what happened, rather than working harder for approval, can prevent unnecessary worry.",
    work: "Often enjoy regular contact, useful service and cooperative teams. Clear priorities help balance immediate requests with work that needs uninterrupted attention.",
    roles: ["Hospitality", "Patient services", "Teaching", "Events", "People operations"],
    relationships: "Regular contact and thoughtful gestures can create a strong sense of belonging. Letting a disagreement remain unresolved for a moment need not weaken the bond.",
    growthEdge: "Name one preference before asking what everyone else wants. Practise letting a different preference coexist with yours without having to smooth it over.",
  },
  ISTP: {
    summary:
      "People of this type often want to see how something works before discussing it at length. They may learn through direct experimentation and value the freedom to respond to what is in front of them. A concise style can be efficient, though others sometimes need more context.",
    atBest: "Finding a practical fault, testing a repair and adjusting quickly when the real problem differs from the description.",
    underStress: "Withdrawing into a task can leave others guessing. A brief explanation of what is needed, and when to reconnect, can protect useful breathing space.",
    work: "Often enjoy tangible problems, capable colleagues and discretion over methods. Recording a solution helps others benefit from expertise that otherwise stays in one person's head.",
    roles: ["Engineering", "Technical trades", "Cybersecurity", "Field operations", "Product prototyping"],
    relationships: "Shared activities and practical help may feel more natural than long explanations. Saying what is appreciated can make a quiet attachment easier to recognise.",
    growthEdge: "Before starting the next fix, explain your plan in two sentences. Include one likely consequence beyond the immediate problem.",
  },
  ISFP: {
    summary:
      "People of this type often pay close attention to the feel and detail of everyday experience. They may express a strong personal judgement through something made, chosen or done rather than argued. A gentle manner can coexist with firm values that deserve to be spoken aloud.",
    atBest: "Noticing an overlooked detail, shaping a thoughtful practical response and bringing an individual eye to work others might rush.",
    underStress: "Avoiding a difficult exchange can make options quietly disappear. Taking time to settle, then naming one concrete concern, can make the conversation less overwhelming.",
    work: "Often enjoy hands-on work, creative discretion and considerate feedback. A clear brief with room for individual choices can be more helpful than constant direction.",
    roles: ["Design", "Photography", "Craft", "Horticulture", "Healthcare support"],
    relationships: "Attentive gestures and shared experiences can communicate care. Expressing a disagreement early lets another person know the real preference rather than having to guess.",
    growthEdge: "Show someone a work in progress and ask one specific question. Keep the useful feedback without treating every suggestion as an instruction.",
  },
  ESTP: {
    summary:
      "People of this type often learn quickly from a situation as it unfolds. They may enjoy direct feedback, a practical challenge and the chance to make something happen now. That responsiveness is useful, though the most immediate opportunity is not always the one worth taking.",
    atBest: "Reading changing conditions, negotiating a practical agreement and helping people act when waiting for perfect information is no longer useful.",
    underStress: "Acting faster can become a way to escape frustration. A brief pause to check consequences helps distinguish a calculated move from a reaction.",
    work: "Often enjoy variety, direct contact and visible results. A few clear safeguards can support initiative without burying it in unnecessary process.",
    roles: ["Sales", "Emergency response", "Field operations", "Entrepreneurship", "Live production"],
    relationships: "Shared activity and spontaneous generosity can bring energy to a bond. Returning to an unfinished conversation shows that difficult feelings deserve attention too.",
    growthEdge: "Before a consequential decision, name the upside, the downside and who bears it. Ask someone outside the moment to check your reasoning.",
  },
  ESFP: {
    summary:
      "People of this type often engage with the people and possibilities right in front of them. They may be quick to notice a changing mood and make an ordinary moment more enjoyable. Warmth and spontaneity can be strengths, with a little preparation making more room for both.",
    atBest: "Putting someone at ease, responding to an immediate need and bringing practical energy to a shared experience.",
    underStress: "Distraction can offer relief while an awkward task grows. Breaking it into a short first step makes returning to it feel more possible.",
    work: "Often enjoy lively settings, human contact and feedback they can use straight away. Short milestones help longer projects feel as real as today's demands.",
    roles: ["Hospitality", "Performing arts", "Events", "Customer experience", "Care services"],
    relationships: "Affection and shared experiences can make time together feel generous. Keeping a quiet promise or discussing next month adds reassurance alongside the fun.",
    growthEdge: "Set aside ten minutes for one future task before the day fills up. A small recurring plan can protect the freedom to be spontaneous.",
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
