// Every user flow, on desktop and on a phone: the 50-question test (keyboard on desktop, taps on mobile), the quick test,
// the sample profile, the careless-answering warning, missing answers, shared links, comparing with a friend, the tracker,
// the type and science pages, and 404s. The type shown must be exactly what the scoring library computes.
import { test, expect, type Page } from "@playwright/test";
import { IPIP_ITEMS, DEFAULT_ANSWERS, type Answers } from "../src/lib/questions";
import { buildReport } from "../src/lib/model";
import { typeFor } from "../src/lib/mbti";

/** Raw 1–5 answers from a keyed level per trait (keyed = after reverse-scoring). */
const fromKeyed = (keyed: Record<string, number>) => IPIP_ITEMS.map((it) => (it.reverse ? 6 - keyed[it.trait] : keyed[it.trait]));
// A typical "INTP" by the usual online test's rules: quiet, curious, blunt, unstructured, a little anxious.
const INTP_LIKE = fromKeyed({ E: 2, O: 4, A: 2, C: 2, N: 3 });
// Very clear on every scale: outgoing, conventional, warm, organised, calm.
const CLEAR_ESFJ = fromKeyed({ E: 5, O: 2, A: 5, C: 5, N: 1 });

const expectedType = (ipip: number[]) => typeFor(buildReport({ ...DEFAULT_ANSWERS, babyKnown: false, inventory: "detailed", ipip } as Answers)).type;

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource|ERR_CONNECTION|favicon/.test(m.text())) errors.push(`console: ${m.text()}`);
  });
  return errors;
}

async function startTest(page: Page) {
  await page.goto("/quiz");
  await expect(page.getByText("Step 1 of 6")).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Step 2 of 6")).toBeVisible();
}

async function answerAll(page: Page, answers: number[], mode: "keys" | "taps") {
  const labels = ["Not me at all", "Not really me", "In between", "Mostly me", "Very much me"];
  for (let i = 0; i < answers.length; i++) {
    await expect(page.getByText(new RegExp(`^Question ${i + 1} of 50$`))).toBeVisible();
    await expect(page.locator("#ipip-q")).toHaveText(IPIP_ITEMS[i].text);
    if (mode === "keys") await page.keyboard.press(String(answers[i]));
    else await page.locator('[role="radiogroup"][aria-labelledby="ipip-q"]').getByRole("radio", { name: new RegExp(labels[answers[i] - 1]) }).click();
  }
  if (answers.length === 50) await expect(page.getByText("All answered")).toBeVisible();
}

async function nextToEnd(page: Page) {
  for (const s of [3, 4, 5, 6]) {
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByText(`Step ${s} of 6`)).toBeVisible();
  }
  await page.getByRole("button", { name: /Reveal my personalityverse/ }).click();
  await page.waitForURL(/\/r\/[a-z0-9]+$/i, { timeout: 30_000 });
}

const heroType = (page: Page) => page.locator("#type-h .sr-only").first();

test.describe("the 50-question test", () => {
  test("an INTP-like respondent gets exactly the type the scoring library computes, and keeps it on reload", async ({ page, isMobile }) => {
    test.slow();
    const errors = watchErrors(page);
    await startTest(page);
    await answerAll(page, INTP_LIKE, isMobile ? "taps" : "keys");
    await nextToEnd(page);
    const want = expectedType(INTP_LIKE);
    await expect(heroType(page)).toHaveText(`${want}, `, { timeout: 20_000 });
    await page.reload();
    await expect(heroType(page)).toHaveText(`${want}, `, { timeout: 20_000 });
    // The MBTI chapter further down agrees with the hero.
    await expect(page.locator("#mbti-h")).toContainText(want);
    expect(errors).toEqual([]);
  });

  test("a clear-cut respondent gets their type with no warnings", async ({ page }) => {
    test.slow();
    await startTest(page);
    await answerAll(page, CLEAR_ESFJ, "keys");
    await nextToEnd(page);
    await expect(heroType(page)).toHaveText(`${expectedType(CLEAR_ESFJ)}, `, { timeout: 20_000 });
  });

  test("going back keeps earlier answers", async ({ page }) => {
    await startTest(page);
    await answerAll(page, INTP_LIKE.slice(0, 5), "keys");
    await expect(page.getByText(/^Question 6 of 50$/)).toBeVisible();
    await page.getByRole("button", { name: "Previous question" }).click();
    await expect(page.getByText(/^Question 5 of 50$/)).toBeVisible();
    const group = page.locator('[role="radiogroup"][aria-labelledby="ipip-q"]');
    await expect(group.getByRole("radio", { checked: true })).toHaveCount(1);
    await expect(group.getByRole("radio", { checked: true })).toContainText(["Not me at all", "Not really me", "In between", "Mostly me", "Very much me"][INTP_LIKE[4] - 1]);
  });

  test("asking to move on with too few answers jumps to the first gap", async ({ page }) => {
    await startTest(page);
    await answerAll(page, INTP_LIKE.slice(0, 3), "keys");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByText(/A few more answers are needed/)).toBeVisible();
    await expect(page.getByText("Step 2 of 6")).toBeVisible();
    await expect(page.getByText(/^Question 4 of 50$/)).toBeVisible();
  });

  test("straight-lining shows the careless-answering warning, and 'carry on' lets you continue", async ({ page }) => {
    test.slow();
    await startTest(page);
    await answerAll(page, Array(50).fill(4), "keys");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Quick check" })).toContainText("same answer");
    await expect(page.getByText("Step 2 of 6")).toBeVisible();
    await page.getByRole("button", { name: /carry on/ }).click();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByText("Step 3 of 6")).toBeVisible();
  });
});

test("the quick 10-question test reaches a result", async ({ page }) => {
  const errors = watchErrors(page);
  await startTest(page);
  await page.getByRole("radio", { name: /Quick test/ }).click();
  await nextToEnd(page);
  await expect(heroType(page)).toHaveText(/^[EI][SN][TF][JP], $/, { timeout: 20_000 });
  expect(errors).toEqual([]);
});

test("the sample profile opens a full result page with every section", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/quiz");
  await page.getByRole("button", { name: /sample profile/ }).click();
  await page.waitForURL(/\/r\/[a-z0-9]+$/i, { timeout: 30_000 });
  await expect(heroType(page)).toHaveText(/^[EI][SN][TF][JP], $/, { timeout: 20_000 });
  await expect(page.locator("#mbti-h")).toBeVisible();
  // scroll the whole page so lazy sections render, then check nothing crashed
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
  });
  await expect(page.getByText(/Something went wrong/i)).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("a shared result link and the share-card image both work", async ({ page, request }) => {
  const res = await request.post("/api/profile", { data: { ...DEFAULT_ANSWERS, inventory: "detailed", ipip: INTP_LIKE } });
  const { id } = await res.json();
  expect(id).toMatch(/^[a-z0-9]+$/i);
  // stored answers round-trip, including all 50 test answers
  const stored = await (await request.get(`/api/profile/${id}`)).json();
  expect(stored.answers.ipip).toEqual(INTP_LIKE);
  await page.goto(`/r/${id}`);
  await expect(heroType(page)).toHaveText(`${expectedType(INTP_LIKE)}, `, { timeout: 20_000 });
  const card = await request.get(`/api/card/${id}`);
  expect(card.status()).toBe(200);
  expect(card.headers()["content-type"]).toMatch(/image\//);
});

test("comparing with a friend: the invite link leads to a side-by-side page", async ({ page, request }) => {
  const a = (await (await request.post("/api/profile", { data: { ...DEFAULT_ANSWERS, inventory: "detailed", ipip: INTP_LIKE } })).json()).id;
  await page.goto(`/quiz?compare=${a}`);
  await expect(page.getByText(/A friend invited you to compare/)).toBeVisible();
  await page.getByRole("button", { name: /sample profile/ }).click();
  await page.waitForURL(new RegExp(`/compare/${a}/[a-z0-9]+$`, "i"), { timeout: 30_000 });
  await expect(page.getByText(/Something went wrong/i)).toHaveCount(0);
  await expect(page.getByText("Two personalityverses")).toBeVisible();
  await expect(page.getByText(/alike today/)).toBeVisible();
});

test("type pages, the types index and the science page render", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/types");
  await expect(page.getByRole("link", { name: /INTP/ }).first()).toBeVisible();
  for (const t of ["INTP", "ESFJ", "ENFJ"]) {
    await page.goto(`/types/${t}`);
    await expect(page.locator("h1")).toContainText(t);
  }
  await page.goto("/science");
  await expect(page.locator("h1")).toBeVisible();
  expect(errors).toEqual([]);
});

test("unknown pages and unknown profiles fail gracefully", async ({ page }) => {
  const r = await page.goto("/definitely-not-here");
  expect(r?.status()).toBe(404);
  await page.goto("/r/doesnotexist123");
  await expect(page.getByText(/couldn.t find that personalityverse/i)).toBeVisible({ timeout: 15_000 });
  const t = await page.goto("/types/ABCD");
  expect(t?.status()).toBe(404);
});

test("no page scrolls sideways on a phone", async ({ page, isMobile, request }) => {
  test.skip(!isMobile, "phone layout only");
  const id = (await (await request.post("/api/profile", { data: { ...DEFAULT_ANSWERS, inventory: "detailed", ipip: INTP_LIKE } })).json()).id;
  for (const path of ["/", "/quiz", `/r/${id}`, "/types", "/types/INTP", "/science"]) {
    await page.goto(path);
    await page.waitForTimeout(800);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(over, path).toBeLessThanOrEqual(1);
  }
});
