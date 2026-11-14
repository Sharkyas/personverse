// Usage: GEMINI_API_KEY=... node scripts/check-ai.mjs
// Lists the Gemma models your key can see and runs one tiny JSON request through the same chain the app uses.
import { GoogleGenAI } from "@google/genai";

const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!key) {
  console.error("Set GEMINI_API_KEY first (https://aistudio.google.com/apikey).");
  process.exit(1);
}
const models = (process.env.AI_MODEL || "gemma-4-31b-it,gemma-4-26b-a4b-it,gemma-3-27b-it").split(",").map((m) => m.trim());
const ai = new GoogleGenAI({ apiKey: key });

const available = [];
try {
  const pager = await ai.models.list({ config: { pageSize: 200 } });
  for await (const m of pager) if (m.name?.includes("gemma")) available.push(m.name.replace("models/", ""));
  console.log("Gemma models on this key:", available.join(", ") || "(none listed)");
} catch (e) {
  console.error("Could not list models:", e.message);
}

for (const model of models) {
  const t0 = Date.now();
  try {
    const r = await ai.models.generateContent({
      model,
      contents: 'Return ONLY this JSON with a real value: {"greeting": "<a five-word hello>"}',
    });
    console.log(`✓ ${model} answered in ${Date.now() - t0} ms:`, r.text?.trim().slice(0, 120));
    process.exit(0);
  } catch (e) {
    console.log(`✗ ${model}: ${e.message?.slice(0, 160)}`);
  }
}
console.error("No model in the chain worked. Set AI_MODEL to one of the listed models.");
process.exit(1);
