import * as allure from "allure-js-commons";

export type Severity = "blocker" | "critical" | "normal" | "minor" | "trivial";

/** Mandatory Allure metadata: epic, feature, severity and an OWASP tag. */
export async function addMetadata(feature: string, severity: Severity, owasp: string): Promise<void> {
  await allure.epic("OWASP Juice Shop Security QA");
  await allure.feature(feature);
  await allure.severity(severity);
  await allure.tags(`OWASP ${owasp}`, "playwright");
}
