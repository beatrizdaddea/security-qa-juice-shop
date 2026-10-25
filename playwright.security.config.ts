import { defineConfig, devices } from "@playwright/test";

try { process.loadEnvFile(); } catch { /* Optional local configuration. / Configuração local opcional. */ }

export const SECURITY_TARGET = "http://localhost:3000";
if (process.env.BASE_URL && process.env.BASE_URL !== SECURITY_TARGET) {
  throw new Error(`Security tests require exactly ${SECURITY_TARGET}.`);
}

export default defineConfig({
  testDir: "./tests/security",
  testMatch: "**/*.spec.ts",
  outputDir: "test-results/security",
  fullyParallel: true,
  workers: 2,
  retries: 0,
  forbidOnly: true,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report-security", open: "never" }],
    ["json", { outputFile: "test-results/security-results.json" }],
    ["allure-playwright", {
      resultsDir: "allure-results-security", detail: false, suiteTitle: false,
      environmentInfo: { app: "OWASP Juice Shop", url: SECURITY_TARGET },
    }],
    ["./scripts/security-reporter.ts"],
  ],
  use: {
    baseURL: SECURITY_TARGET,
    // Sanitized HTTP/DOM evidence is attached explicitly. / Evidência HTTP/DOM sanitizada anexada explicitamente.
    trace: "off", video: "off", screenshot: "off",
    serviceWorkers: "block",
    actionTimeout: 10_000, navigationTimeout: 15_000,
  },
  projects: [{ name: "security-chromium", use: { ...devices["Desktop Chrome"] } }],
});
