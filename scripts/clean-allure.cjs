const { rmSync } = require("node:fs");
const path = require("node:path");

const workspace = path.resolve(__dirname, "..");
const resultsDir = path.resolve(workspace, "allure-results");

if (path.dirname(resultsDir) !== workspace || path.basename(resultsDir) !== "allure-results") {
  throw new Error("Refusing to remove an unexpected path.");
}

rmSync(resultsDir, { recursive: true, force: true });
