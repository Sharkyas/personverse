// Accessibility: axe-core scan (WCAG 2.1 A/AA) of every main page on desktop and phone. Serious and critical issues fail.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { DEFAULT_ANSWERS } from "../src/lib/questions";

test("no serious or critical accessibility issues on the main pages", async ({ page, request }) => {
  test.slow();
  const id = (await (await request.post("/api/profile", { data: { ...DEFAULT_ANSWERS, inventory: "quick" } })).json()).id;
  const report: string[] = [];
  for (const path of ["/", "/quiz", `/r/${id}`, "/types", "/types/INTP", "/science"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1200); // let entrance animations finish so colours are final
    const res = await new AxeBuilder({ page: page as unknown as ConstructorParameters<typeof AxeBuilder>[0]["page"] }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    for (const v of res.violations.filter((v) => v.impact === "serious" || v.impact === "critical"))
      report.push(`${path}: ${v.id} (${v.impact}) x${v.nodes.length}: ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
  }
  expect(report, report.join("\n")).toEqual([]);
});
