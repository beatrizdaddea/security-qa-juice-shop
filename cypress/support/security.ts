import * as allure from "allure-js-commons";

export type AllureSeverity = "blocker" | "critical" | "normal" | "minor" | "trivial";

export function addSecurityMetadata(
  feature: string,
  severity: AllureSeverity,
  owasp: string,
): void {
  allure.epic("OWASP Juice Shop Security QA");
  allure.feature(feature);
  allure.severity(severity);
  allure.tags(`OWASP ${owasp}`);
}

export function securityStep(name: string): void {
  allure.logStep(name);
}

export function assertSecure(condition: boolean, bugFile: string, message: string): void {
  if (!condition) {
    throw new Error(`KNOWN_VULNERABILITY [${bugFile}]: ${message}`);
  }
}
