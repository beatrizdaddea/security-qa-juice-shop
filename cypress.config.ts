import { defineConfig } from "cypress";
import { allureCypress } from "allure-cypress/reporter";
import { copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const LOCAL_TARGET = "http://localhost:3000";
const evidenceRoot = process.env.CI_REPORT_DIR;
const allureResults = evidenceRoot ? join(evidenceRoot, "allure-results") : "allure-results";

export default defineConfig({
  screenshotsFolder: evidenceRoot ? join(evidenceRoot, "screenshots") : "cypress/screenshots",
  screenshotOnRunFailure: true,
  videosFolder: evidenceRoot ? join(evidenceRoot, "videos") : "cypress/videos",
  video: true,
  e2e: {
    baseUrl: LOCAL_TARGET,
    specPattern: "cypress/e2e/**/*.cy.ts",
    supportFile: "cypress/support/e2e.ts",
    setupNodeEvents(on, config) {
      if (config.baseUrl !== LOCAL_TARGET) {
        throw new Error(`Security tests may only target ${LOCAL_TARGET}.`);
      }

      allureCypress(on, config, {
        resultsDir: allureResults,
        environmentInfo: {
          app: "OWASP Juice Shop",
          "app.version": "20.2.0",
          browser: "Electron 146 (headless)",
          url: LOCAL_TARGET,
        },
      });

      on("before:run", () => {
        const resultsDir = allureResults;

        mkdirSync(resultsDir, { recursive: true });
        copyFileSync(join(__dirname, "allure", "categories.json"), join(resultsDir, "categories.json"));
      });

      return config;
    },
  },
});
