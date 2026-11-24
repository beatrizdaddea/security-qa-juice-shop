import { defineConfig, devices } from "@playwright/test";
import { zapProxyOptions } from "./utils/zap-proxy";

try { process.loadEnvFile(); } catch { /* Optional local configuration. / Configuração local opcional. */ }

export const SECURITY_TARGET = "http://localhost:3000";
if (process.env.BASE_URL && process.env.BASE_URL !== SECURITY_TARGET) {
  throw new Error(`Security tests require exactly ${SECURITY_TARGET}.`);
}

export default defineConfig({
  testDir: "./tests/security",
  testMatch: "**/*.spec.ts",
  outputDir: "test-results/security",
  ...(process.env.CI_REPORT_DIR ? { outputDir: `${process.env.CI_REPORT_DIR}/test-results` } : {}),
  fullyParallel: true,
  workers: 2,
  retries: 0,
  forbidOnly: true,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [
    ["list"],
    ["html", { outputFolder: process.env.CI_REPORT_DIR ? `${process.env.CI_REPORT_DIR}/playwright-report` : "playwright-report-security", open: "never" }],
    ["json", { outputFile: process.env.CI_REPORT_DIR ? `${process.env.CI_REPORT_DIR}/report.json` : "test-results/security-results.json" }],
    ["allure-playwright", {
      resultsDir: process.env.CI_REPORT_DIR ? `${process.env.CI_REPORT_DIR}/allure-results` : "allure-results-security", detail: false, suiteTitle: false,
      environmentInfo: { app: "OWASP Juice Shop", url: SECURITY_TARGET },
    }],
    ["./scripts/security-reporter.ts"],
  ],
  use: {
    baseURL: SECURITY_TARGET,
    ...zapProxyOptions(),
    // Sanitized HTTP/DOM evidence is attached explicitly. / Evidência HTTP/DOM sanitizada anexada explicitamente.
    trace: "off", video: "off", screenshot: "off",
    serviceWorkers: "block",
    actionTimeout: 10_000, navigationTimeout: 15_000,
  },
  projects: [{ name: "security-chromium", use: { ...devices["Desktop Chrome"] } }],
});
