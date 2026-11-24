import { defineConfig, devices } from "@playwright/test";
import { zapProxyOptions } from "./utils/zap-proxy";

// Optional local overrides (.env is git-ignored; see .env.example).
try {
  process.loadEnvFile();
} catch {
  // No .env file: defaults below apply.
}

const DEFAULT_TARGET = "http://localhost:3000";
const BASE_URL = process.env.BASE_URL ?? DEFAULT_TARGET;

// Project rule: security tests may only target the local Juice Shop.
if (BASE_URL !== DEFAULT_TARGET) {
  throw new Error(`BASE_URL must be exactly ${DEFAULT_TARGET}.`);
}

const isCI = Boolean(process.env.CI);

// Evidence modes. Local default: "on". CI default: retain on failure.
// Playwright's screenshot option has no "retain-on-failure" value, so the
// equivalent "only-on-failure" is used for screenshots.
type Evidence = "on" | "off" | "retain-on-failure";
const evidence = (name: string): Evidence => {
  const value = process.env[name] ?? (isCI ? "retain-on-failure" : "on");
  if (!["on", "off", "retain-on-failure"].includes(value)) {
    throw new Error(`${name} must be one of: on, off, retain-on-failure (received "${value}").`);
  }
  return value as Evidence;
};
const screenshot = evidence("PW_SCREENSHOT");

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",
  globalSetup: "./fixtures/global-setup.ts",
  outputDir: "test-results",
  ...(process.env.CI_REPORT_DIR ? { outputDir: `${process.env.CI_REPORT_DIR}/test-results` } : {}),
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [
    ["list"],
    ["html", { outputFolder: process.env.CI_REPORT_DIR ? `${process.env.CI_REPORT_DIR}/playwright-report` : "playwright-report", open: "never" }],
    ["json", { outputFile: process.env.CI_REPORT_DIR ? `${process.env.CI_REPORT_DIR}/report.json` : "test-results/playwright-results.json" }],
    [
      "allure-playwright",
      {
        resultsDir: process.env.CI_REPORT_DIR ? `${process.env.CI_REPORT_DIR}/allure-results` : "allure-results-playwright",
        detail: true,
        environmentInfo: { app: "OWASP Juice Shop", url: BASE_URL },
      },
    ],
  ],
  use: {
    baseURL: BASE_URL,
    ...zapProxyOptions(),
    serviceWorkers: "block",
    trace: evidence("PW_TRACE"),
    video: evidence("PW_VIDEO"),
    screenshot: screenshot === "retain-on-failure" ? "only-on-failure" : screenshot,
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  projects: process.env.PW_BROWSER ? (() => {
    const browsers = { chromium: "Desktop Chrome", firefox: "Desktop Firefox", webkit: "Desktop Safari" } as const;
    const browser = process.env.PW_BROWSER as keyof typeof browsers;
    if (!(browser in browsers)) throw new Error("PW_BROWSER must be chromium, firefox or webkit.");
    return [{ name: browser, use: { ...devices[browsers[browser]] } }];
  })() : [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // Optional: PW_FIREFOX=1 (requires `playwright install firefox`).
    ...(process.env.PW_FIREFOX === "1"
      ? [{ name: "firefox", use: { ...devices["Desktop Firefox"] } }]
      : []),
  ],
});
