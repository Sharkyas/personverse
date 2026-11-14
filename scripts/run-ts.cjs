// Runs a TypeScript script that imports app code ("@/lib/..."), without a build step: node scripts/run-ts.cjs <file.ts> [args]
const path = require("node:path");
const jiti = require("jiti")(__filename, { alias: { "@": path.join(__dirname, "..", "src") }, interopDefault: true });
jiti(path.resolve(process.argv[2]));
