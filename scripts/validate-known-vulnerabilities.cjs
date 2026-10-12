const { existsSync, readFileSync, readdirSync } = require("node:fs");
const path = require("node:path");

const resultsDir = path.resolve(__dirname, "..", "allure-results");

if (!existsSync(resultsDir)) {
  console.error("Allure results were not generated.");
  process.exit(1);
}

const resultFiles = readdirSync(resultsDir).filter((name) => name.endsWith("-result.json"));

if (resultFiles.length === 0) {
  console.error("No Allure test results were generated.");
  process.exit(1);
}

const failedResults = resultFiles
  .map((name) => ({
    name,
    result: JSON.parse(readFileSync(path.join(resultsDir, name), "utf8")),
  }))
  .filter(({ result }) => ["failed", "broken"].includes(result.status));

const unexpected = failedResults
  .filter(({ result }) => !result.statusDetails?.message?.includes("KNOWN_VULNERABILITY"))
  .map(({ name, result }) => result.name || name);

if (unexpected.length > 0) {
  console.error(`Unexpected test failures: ${unexpected.join(", ")}`);
  process.exit(1);
}

if (failedResults.length === 0) {
  console.error("Cypress failed without producing failed Allure test results.");
  process.exit(1);
}

console.log("Only documented KNOWN_VULNERABILITY failures were found; continuing.");
