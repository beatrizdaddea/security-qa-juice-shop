const { rmSync } = require("node:fs");
const path = require("node:path");

const workspace = path.resolve(__dirname, "..");
// Only these generated, git-ignored Playwright folders may be removed.
const generated = ["allure-results-playwright", "test-results", "playwright-report"];

for (const name of generated) {
  const target = path.resolve(workspace, name);

  if (path.dirname(target) !== workspace || !generated.includes(path.basename(target))) {
    throw new Error("Refusing to remove an unexpected path.");
  }

  rmSync(target, { recursive: true, force: true });
}
