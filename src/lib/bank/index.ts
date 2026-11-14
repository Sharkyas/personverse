// Item bank and scoring upgrades, in one place. Everything here is additive: nothing in questions.ts, model.ts or mbti.ts
// changes, and each piece returns the shapes the existing code already takes. See research/items_metrics.md.
import neo from "./ipipNeo120.json";
import type from "./typeItems.json";
import up from "./upbringingItems.json";
import par from "./parentItems.json";
import { IPIP_ITEMS, TEMPERAMENT_ITEMS } from "../questions";

export * from "./irt";
export * from "./bigfive";
export * from "./typeEngine";
export * from "./consistency";
export * from "./background";
export * from "./neo120";
export * from "./appMetrics";
export * from "./metricsSuite";

/** What is in the bank, for the "how many questions" line and for tests. */
export const BANK_SUMMARY = {
  bigFive50: IPIP_ITEMS.length,
  facets120: neo.items.length,
  facetsNew: neo.items.filter((i) => !("sameAs" in i)).length,
  typeStatements: type.items.length,
  upbringing: up.items.length + 1,
  parentPerPerson: par.items.length,
  temperament: TEMPERAMENT_ITEMS.length,
  get total() {
    return this.bigFive50 + this.facetsNew + this.typeStatements + this.upbringing + this.parentPerPerson * 2 + this.temperament;
  },
};
