import { defineConfig } from "vitest/config";
import path from "node:path";

// The long simulation report: npm run sim (writes research/simulation_report.json).
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: { environment: "node", include: ["tests/sim/**/*.sim.ts"], testTimeout: 600_000 },
});
