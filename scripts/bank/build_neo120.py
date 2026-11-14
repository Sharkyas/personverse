"""Build src/lib/bank/ipipNeo120.json: the 120 public-domain IPIP-NEO-120 statements (Johnson, 2014) with facet keys,
plain-English hints, links to the same statement in the 50-item test, and Johnson's published norms.

Inputs (neither is executed, both are parsed as data):
  1. questions.json from the npm package @alheimsins/b5-johnson-120-ipip-neo-pi-r (MIT; the items are public domain)
  2. norm.py from the PyPI package five-factor-e (MIT), which carries the norm tables of Johnson's public scoring routine
Usage: python3 scripts/bank/build_neo120.py <questions.json> <norm.py>"""
import ast, json, math, re, sys

QUESTIONS, NORMS = sys.argv[1], sys.argv[2]
FACETS = {
    "N": ["Anxiety", "Anger", "Depression", "Self-consciousness", "Immoderation", "Vulnerability"],
    "E": ["Friendliness", "Gregariousness", "Assertiveness", "Activity level", "Excitement-seeking", "Cheerfulness"],
    "O": ["Imagination", "Artistic interests", "Emotionality", "Adventurousness", "Intellect", "Liberalism"],
    "A": ["Trust", "Morality", "Altruism", "Cooperation", "Modesty", "Sympathy"],
    "C": ["Self-efficacy", "Orderliness", "Dutifulness", "Achievement-striving", "Self-discipline", "Cautiousness"],
}
# One plain line under the harder statements. The statements keep their tested wording.
HINTS = {
    9: "You use people to get what you want.",
    11: "Blue means sad or down.",
    21: "You sometimes overdo it, for example with food, shopping or screens.",
    28: "Liberal here means left-leaning or progressive.",
    33: "You enjoy letting your imagination run wild.",
    51: "You rarely overdo it with food, shopping or screens.",
    53: "Philosophical means big questions, like what is fair or what is real.",
    58: "Right and wrong depend on the situation.",
    60: "Rash means quick and without thinking it through.",
    71: "Down in the dumps means sad or low.",
    81: "Temptations are things you want but know you should not have.",
    82: "Reckless means taking risks without worrying what might happen.",
    83: "Abstract means ideas rather than things, like theories or philosophy.",
    88: "Conservative here means right-leaning or traditional.",
    99: "You get in the way of what other people are trying to do.",
    104: "You don't make time for other people.",
    106: "Awkward moments with people don't worry you.",
    108: "You like doing things the usual, traditional way.",
    109: "You take revenge when someone wrongs you.",
    113: "Theoretical means about ideas rather than practical things.",
    114: "You show off about your good points.",
    119: "The needy means people who are poor or struggling.",
}
# The same statement in the 50-item test (src/lib/questions.ts IPIP_ITEMS), so nobody is asked it twice.
IPIP50 = {
    "am the life of the party": "E1", "get stressed out easily": "N1", "am always prepared": "C1", "feel comfortable around people": "E3",
    "worry about things": "N3", "insult people": "A3", "have a vivid imagination": "O3", "have difficulty understanding abstract ideas": "O2",
    "am not interested in other people's problems": "A5", "leave my belongings around": "C2", "often forget to put things back in their proper place": "C6",
    "talk to a lot of different people at parties": "E7", "get irritated easily": "N9", "feel others' emotions": "A9", "often feel blue": "N10",
}

def first_person(stem: str) -> str:
    s = stem.strip().rstrip(".")
    s = s.replace("Sympathize", "Sympathise")
    return "I " + s[0].lower() + s[1:] + "."

items = []
for n, q in enumerate(json.load(open(QUESTIONS, encoding="utf-8")), start=1):
    d, f = q["domain"], int(q["facet"])
    it = {
        "id": f"{d}{f}_{sum(1 for x in items if x['facet'] == f'{d}{f}') + 1}",
        "n": n,
        "text": first_person(q["text"]),
        "trait": d,
        "facet": f"{d}{f}",
        "reverse": q["keyed"] == "minus",
    }
    if n in HINTS:
        it["hint"] = HINTS[n]
    same = IPIP50.get(q["text"].strip().lower())
    if same:
        it["sameAs"] = same
    items.append(it)
assert len(items) == 120 and all(sum(1 for x in items if x["facet"] == f"{d}{f}") == 4 for d in FACETS for f in range(1, 7))

groups = []
for node in ast.walk(ast.parse(open(NORMS, encoding="utf-8").read())):
    if isinstance(node, ast.Dict) and [k.value for k in node.keys if isinstance(k, ast.Constant)] == ["id", "ns", "category"] and isinstance(node.values[1], ast.List):
        groups.append(ast.literal_eval(node))
groups = groups[:8]  # the first eight tables are the 120-item norms; the rest are for the 300-item version
assert [g["id"] for g in groups] == list(range(1, 9)) and all(len(g["ns"]) == 71 for g in groups)
META = [("M", 0, 20), ("M", 21, 40), ("M", 41, 60), ("M", 61, 120), ("F", 0, 20), ("F", 21, 40), ("F", 41, 60), ("F", 61, 120)]
ORDER = "NEOAC"

def unpack(ns):
    """Johnson's layout: 5 domain means, 5 domain SDs, then for each domain 6 facet means and 6 facet SDs. Raw sums → per-item 1–5 means."""
    out = {"domains": {}, "facets": {}}
    for i, d in enumerate(ORDER):
        out["domains"][d] = {"mean": ns[1 + i] / 24, "sd": ns[6 + i] / 24}
        base = 11 + 12 * i
        for f in range(6):
            out["facets"][f"{d}{f + 1}"] = {"mean": ns[base + f] / 4, "sd": ns[base + 6 + f] / 4}
    return out

by_group = [{"sex": s, "ageFrom": lo, "ageTo": hi, **unpack(g["ns"])} for (s, lo, hi), g in zip(META, groups)]

def mix(parts):
    """Equal-weight mixture of normal groups: pooled mean and SD."""
    mu = sum(p["mean"] for p in parts) / len(parts)
    var = sum(p["sd"] ** 2 + (p["mean"] - mu) ** 2 for p in parts) / len(parts)
    return {"mean": round(mu, 4), "sd": round(math.sqrt(var), 4)}

adults = [g for g in by_group if g["ageFrom"] >= 21]
adult = {
    "domains": {d: mix([g["domains"][d] for g in adults]) for d in ORDER},
    "facets": {k: mix([g["facets"][k] for g in adults]) for k in by_group[0]["facets"]},
}
for g in by_group:
    for part in ("domains", "facets"):
        g[part] = {k: {"mean": round(v["mean"], 4), "sd": round(v["sd"], 4)} for k, v in g[part].items()}

out = {
    "name": "IPIP-NEO-120",
    "source": "Johnson, J. A. (2014). Measuring thirty facets of the Five Factor Model with a 120-item public domain inventory. Journal of Research in Personality, 51, 78-89. Items from the International Personality Item Pool (ipip.ori.org), public domain.",
    "normsSource": "Norm tables of Johnson's public IPIP-NEO short-form scoring routine, by sex and age band, as carried by the MIT-licensed five-factor-e package. `adult` is an equal-weight mixture of the six age-21-and-over groups, on the per-item 1-5 scale.",
    "reliability": {"domain": 0.85, "facet": 0.7, "provisional": True, "note": "Typical published values for 24-item domains and 4-item facets. scripts/metrics/fit_irt.py replaces them when it is run on Johnson's open response file."},
    "facets": {f"{d}{i + 1}": {"trait": d, "name": name} for d in ORDER for i, name in enumerate(FACETS[d])},
    "items": items,
    "norms": {"adult": adult, "groups": by_group},
}
json.dump(out, open("src/lib/bank/ipipNeo120.json", "w"), indent=1, ensure_ascii=False)
print(len(items), "items;", sum(1 for i in items if i["reverse"]), "reverse-keyed;", sum(1 for i in items if "sameAs" in i), "shared with the 50-item test")
print({d: adult["domains"][d] for d in ORDER})
