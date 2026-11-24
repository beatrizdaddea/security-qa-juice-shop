const { rmSync } = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
for (const name of ["allure-results-security", "allure-report-security", "playwright-report-security", "test-results/security", "test-results/security-results.json"]) {
  const target = path.resolve(root, name);
  if (!target.startsWith(root + path.sep)) throw new Error("Unexpected output path.");
  rmSync(target, { force: true, recursive: true });
}
