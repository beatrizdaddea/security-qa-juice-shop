import { defineConfig } from "cypress";
import { allureCypress } from "allure-cypress/reporter";
import { copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const LOCAL_TARGET = "http://localhost:3000";

export default defineConfig({
  screenshotsFolder: "cypress/screenshots",
  screenshotOnRunFailure: true,
  videosFolder: "cypress/videos",
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
        resultsDir: "allure-results",
        environmentInfo: {
          app: "OWASP Juice Shop",
          "app.version": "20.2.0",
          browser: "Electron 146 (headless)",
          url: LOCAL_TARGET,
        },
      });

      on("before:run", () => {
        const resultsDir = join(__dirname, "allure-results");

        mkdirSync(resultsDir, { recursive: true });
        copyFileSync(join(__dirname, "allure", "categories.json"), join(resultsDir, "categories.json"));
      });

      return config;
    },
  },
});
