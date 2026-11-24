const fs: typeof import("node:fs") = require("node:fs");
const path: typeof import("node:path") = require("node:path");
const { spawnSync }: typeof import("node:child_process") = require("node:child_process");
const { evaluate } = require("./quality-gate.ts");
const root = path.resolve(__dirname, "..");
const reportRoot = path.join(root, "reports", "ci");
const native = path.join(reportRoot, "sca", "report.json");
const baseline = path.join(root, "security-baseline.json");
const folder = path.join(root, "reports", "quality-gate-checks");
fs.mkdirSync(folder, { recursive: true });
const cases: { name: string; exitCode: number; passed: boolean; failures: string[] }[] = [];
function run(name: string, expected: number) {
  const output = path.join(folder, `${name}.json`);
  const result = spawnSync(process.execPath, ["--experimental-strip-types", path.join(root, "scripts", "quality-gate.ts"), "--reports", reportRoot, "--profile", "full", "--output", output], { cwd: root, encoding: "utf8", windowsHide: true });
  if (result.status !== expected) throw new Error(`${name}: expected exit ${expected}, got ${result.status}. ${result.stderr}`);
  const verdict = JSON.parse(fs.readFileSync(output, "utf8"));
  cases.push({ name, exitCode: result.status, passed: verdict.passed, failures: verdict.failures });
  console.log(`${name}: exit ${result.status}; ${verdict.passed ? "PASS" : "FAIL as expected / FALHA esperada"}`);
  return verdict;
}
const original = fs.readFileSync(native);
const originalBaseline = fs.readFileSync(baseline);
const functionalReport = path.join(reportRoot, "playwright-chromium", "report.json");
const originalFunctional = fs.readFileSync(functionalReport);
const functionalManifest = path.join(reportRoot, "playwright-chromium", "job.json");
const originalManifest = fs.readFileSync(functionalManifest);
try {
  run("real-reports-pass", 0);
  const altered = JSON.parse(original.toString("utf8"));
  altered.Results[0].Vulnerabilities ??= [];
  altered.Results[0].Vulnerabilities.push({ VulnerabilityID: "CVE-2099-QE-FICTITIOUS", PkgName: "qe-gate-demonstration-only", InstalledVersion: "0.0.0", Severity: "HIGH", Title: "Fictitious acceptance finding / Achado fictício de aceite" });
  fs.writeFileSync(native, JSON.stringify(altered));
  const rejected = run("fictitious-high-fails", 1);
  if (!rejected.newFindings.some((finding: { id: string }) => finding.id.includes("CVE-2099-QE-FICTITIOUS"))) throw new Error("Fictitious finding was not the reason for rejection.");
  fs.writeFileSync(native, original);
  const emptyScan = JSON.parse(original.toString("utf8"));
  emptyScan.Results = [];
  fs.writeFileSync(native, JSON.stringify(emptyScan));
  if (!run("empty-scan-fails", 1).failures.some((failure: string) => failure.includes("Invalid/empty Trivy"))) throw new Error("Empty scanner evidence was not rejected.");
  fs.writeFileSync(native, original);
  const wrongProfile = JSON.parse(originalManifest.toString("utf8"));
  wrongProfile.profile = "quick";
  fs.writeFileSync(functionalManifest, JSON.stringify(wrongProfile));
  if (!run("wrong-profile-fails", 1).failures.some((failure: string) => failure.includes("Report profile mismatch"))) throw new Error("Partial-profile evidence was not rejected.");
  fs.writeFileSync(functionalManifest, originalManifest);
  const failedTests = JSON.parse(originalFunctional.toString("utf8"));
  function failCritical(suite: Record<string, any>): boolean {
    for (const spec of suite.specs ?? []) if (spec.title.startsWith("TC-001 ")) {
      const test = spec.tests[0];
      test.status = "unexpected";
      test.expectedStatus = "passed";
      test.results.at(-1).status = "failed";
      return true;
    }
    return (suite.suites ?? []).some(failCritical);
  }
  if (!failCritical(failedTests)) throw new Error("Real critical TC-001 result is missing.");
  fs.writeFileSync(functionalReport, JSON.stringify(failedTests));
  if (!run("critical-test-failure-fails", 1).failures.some((failure: string) => failure.includes("TC-001"))) throw new Error("Critical test failure was not rejected.");
  fs.writeFileSync(functionalReport, originalFunctional);
  const expired = JSON.parse(originalBaseline.toString("utf8"));
  expired.exceptions[0].expiresOn = "2000-01-01";
  fs.writeFileSync(baseline, JSON.stringify(expired));
  if (!run("expired-exception-fails", 1).failures.some((failure: string) => failure.startsWith("Expired exception:"))) throw new Error("Expired exception was not rejected.");
  fs.writeFileSync(baseline, originalBaseline);
  const missing = evaluate({ reports: path.join(folder, "missing-reports"), baseline, profile: "full" });
  if (missing.passed || !missing.failures.some((failure: string) => failure.startsWith("Missing required job/report:"))) throw new Error("Missing reports must fail closed.");
  cases.push({ name: "missing-reports-fail", exitCode: 1, passed: false, failures: missing.failures });
  run("restored-real-reports-pass", 0);
} finally {
  fs.writeFileSync(native, original);
  fs.writeFileSync(baseline, originalBaseline);
  fs.writeFileSync(functionalReport, originalFunctional);
  fs.writeFileSync(functionalManifest, originalManifest);
}
fs.writeFileSync(path.join(folder, "verification.json"), JSON.stringify({ verifiedAt: new Date().toISOString(), cases, reportsRestored: fs.readFileSync(native).equals(original) && fs.readFileSync(functionalReport).equals(originalFunctional) && fs.readFileSync(functionalManifest).equals(originalManifest), baselineRestored: fs.readFileSync(baseline).equals(originalBaseline) }, null, 2) + "\n");
