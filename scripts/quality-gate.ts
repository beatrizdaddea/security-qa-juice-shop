const fs: typeof import("node:fs") = require("node:fs");
const path: typeof import("node:path") = require("node:path");
const crypto: typeof import("node:crypto") = require("node:crypto");

type Native = Record<string, any>;
type Finding = { id: string; source: string; severity: string; title: string; test?: boolean };
type ExceptionEntry = { id: string; source: string; justification: { en: string; ptBR: string }; owner: string; expiresOn: string };
type Options = { reports: string; baseline: string; profile: string; now?: Date };
const json = (file: string): Native => JSON.parse(fs.readFileSync(file, "utf8"));
const digest = (value: unknown): string => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 24);
const severity = (value: unknown): string => ({ blocker: "CRITICAL", critical: "CRITICAL", normal: "MEDIUM", minor: "LOW", trivial: "INFO", ERROR: "HIGH", WARNING: "MEDIUM", INFO: "INFO" }[String(value)] ?? String(value).toUpperCase());
const numericSeverity = (score: number): string => score >= 9 ? "CRITICAL" : score >= 7 ? "HIGH" : score >= 4 ? "MEDIUM" : "LOW";

function files(directory: string, name: string): string[] {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((item) => item.isSymbolicLink() ? [] : item.isDirectory() ? files(path.join(directory, item.name), name) : item.name === name ? [path.join(directory, item.name)] : []);
}

function requiredJobs(profile: string): string[] {
  if (!["quick", "full", "nightly"].includes(profile)) throw new Error("Invalid gate profile.");
  return ["lint", "gitleaks", "semgrep", "sca", "playwright-chromium", "security", profile === "nightly" ? "zap-full" : "zap-baseline",
    ...(profile !== "quick" ? ["cypress", "trivy-image"] : []), ...(profile === "nightly" ? ["playwright-firefox", "playwright-webkit"] : [])];
}

function nativeReport(jobFile: string, manifest: Native, field = "native"): Native {
  const relative = manifest.reports?.[field];
  if (typeof relative !== "string" || path.isAbsolute(relative)) throw new Error(`Missing ${field} report reference.`);
  const root = path.dirname(jobFile);
  const target = path.resolve(root, relative);
  if (!target.startsWith(root + path.sep) || !fs.existsSync(target)) throw new Error(`Missing/unsafe ${field} report.`);
  return json(target);
}

function collectFindings(jobFile: string, manifest: Native, fatal: string[]): Finding[] {
  const found: Finding[] = [];
  const source = manifest.kind as string;
  const add = (id: string, level: unknown, title: string, test = false) => {
    const resolvedSeverity = severity(level);
    if (!["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO", "INFORMATIONAL"].includes(resolvedSeverity)) fatal.push(`Unknown severity: ${id}`);
    found.push({ id, source: source.startsWith("zap-") ? "zap" : source, severity: resolvedSeverity, title, test });
  };
  if (source === "cypress") {
    const folder = path.resolve(path.dirname(jobFile), manifest.reports?.allure ?? "missing");
    if (!folder.startsWith(path.dirname(jobFile) + path.sep) || !fs.existsSync(folder)) throw new Error("Missing Cypress Allure evidence.");
    const results = fs.readdirSync(folder).filter((name) => name.endsWith("-result.json")).map((name) => json(path.join(folder, name)));
    if (results.length !== 17) fatal.push("cypress: expected all 17 tests, no missing/partial suite");
    for (const test of results) {
      const id = test.name?.match(/^TC-\d+/)?.[0];
      const level = test.labels?.find((label: Native) => label.name === "severity")?.value;
      if (!id || !level) throw new Error("Cypress result missing ID/severity.");
      if (["failed", "broken"].includes(test.status)) {
        if (test.statusDetails?.message?.includes("KNOWN_VULNERABILITY")) add(`test:cypress:${id}`, level, test.name, true);
        else fatal.push(`Unexpected Cypress failure: ${id}`);
      } else if (test.status !== "passed") fatal.push(`Non-executed Cypress case: ${id}`);
    }
    return found;
  }
  const report = nativeReport(jobFile, manifest);
  if (source === "lint") {
    if (report.passed !== true || !Array.isArray(report.checks) || !report.checks.includes("actionlint-shellcheck")) fatal.push("Static lint/workflow validation failed or missing.");
  } else if (source === "gitleaks") {
    if (!Array.isArray(report)) throw new Error("Invalid Gitleaks JSON.");
    for (const item of report) {
      if (!item.RuleID || !item.File || !item.Fingerprint) throw new Error("Incomplete Gitleaks finding.");
      add(`gitleaks:${item.Fingerprint}`, "HIGH", `${item.RuleID}: ${item.File}`);
    }
  } else if (source === "semgrep") {
    if (!Array.isArray(report.results) || !Array.isArray(report.errors) || !report.paths?.scanned?.length) throw new Error("Invalid/empty Semgrep analysis.");
    if (report.errors.some((error: Native) => error.level === "error")) fatal.push("Semgrep reported analysis errors.");
    for (const item of report.results) {
      if (!item.check_id || !item.path || !item.extra?.severity) throw new Error("Incomplete Semgrep finding.");
      const score = Number(item.extra.metadata?.["security-severity"]);
      add(`semgrep:${digest([item.check_id, item.path.replace(/^\/workspace\//, ""), item.extra.fingerprint ?? item.extra.lines ?? item.start?.line])}`,
        Number.isFinite(score) ? numericSeverity(score) : item.extra.severity, item.check_id);
    }
  } else if (["sca", "trivy-image"].includes(source)) {
    if (report.SchemaVersion !== 2 || !Array.isArray(report.Results) || report.Results.length === 0) throw new Error("Invalid/empty Trivy JSON.");
    for (const result of report.Results) for (const item of result.Vulnerabilities ?? []) {
      if (!item.VulnerabilityID || !item.PkgName || !item.InstalledVersion || !item.Severity) throw new Error("Incomplete vulnerability finding.");
      const target = String(result.Target).replace(/^\/workspace\//, "");
      add(`${source}:${item.VulnerabilityID}:${item.PkgName}@${item.InstalledVersion}:${target}`, item.Severity, item.Title ?? item.VulnerabilityID);
    }
    if (source === "trivy-image") {
      const sbom = nativeReport(jobFile, manifest, "sbom");
      if (sbom.bomFormat !== "CycloneDX" || !Array.isArray(sbom.components) || sbom.components.length === 0) throw new Error("Missing/empty CycloneDX SBOM.");
    }
  } else if (["zap-baseline", "zap-full"].includes(source)) {
    const scan = nativeReport(jobFile, manifest, "scan");
    const sarif = nativeReport(jobFile, manifest, "sarif");
    if (!scan.complete || scan.target !== "http://localhost:3000" || scan.passiveQueue !== 0 || sarif.version !== "2.1.0") throw new Error("Incomplete/invalid local ZAP scan.");
    if (Boolean(scan.activeScanStarted) !== (source === "zap-full")) throw new Error("Wrong ZAP scan mode.");
    if (!Array.isArray(report.site) || report.site.length === 0) throw new Error("Empty ZAP report.");
    for (const site of report.site) {
      if (site["@name"].replace(/\/$/, "") !== "http://localhost:3000") throw new Error("Out-of-scope ZAP site.");
      for (const alert of site.alerts ?? []) for (const instance of alert.instances ?? []) {
        const url = new URL(instance.uri);
        if (url.origin !== "http://localhost:3000") throw new Error("Out-of-scope ZAP finding.");
        add(`zap:${alert.pluginid}:${instance.method ?? "GET"}:${url.pathname}:${instance.param ?? ""}`,
          ["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"][Number(alert.riskcode)], alert.name);
      }
    }
  } else if (["playwright", "security"].includes(source)) {
    if (!Array.isArray(report.suites) || !report.stats || !Array.isArray(report.errors)) throw new Error("Invalid Playwright JSON.");
    if (report.errors.length) fatal.push(`${manifest.jobId}: Playwright run/global errors`);
    const tests: Native[] = [];
    function walk(suite: Native) {
      for (const spec of suite.specs ?? []) for (const test of spec.tests ?? []) tests.push({ ...test, title: spec.title });
      for (const child of suite.suites ?? []) walk(child);
    }
    walk(report);
    const expected = source === "security" ? 20 : manifest.profile === "quick" ? 4 : 5;
    if (tests.length !== expected) fatal.push(`${manifest.jobId}: expected ${expected} cases, got ${tests.length}`);
    for (const test of tests) {
      const id = test.title?.match(/^TC-\d+/)?.[0];
      if (!id || test.results.length === 0) throw new Error("Missing test ID/execution.");
      const last = test.results.at(-1);
      if (test.expectedStatus === "failed" && last.status === "failed" && test.status === "expected") {
        const known = test.annotations?.find((annotation: Native) => annotation.type === "known-vuln")?.description;
        const level = test.annotations?.find((annotation: Native) => annotation.type === "severity")?.description;
        const observed = test.annotations?.some((annotation: Native) => annotation.type === "security-observation");
        if (!known || !level || !observed) fatal.push(`${id}: expected failure without documented security verdict`);
        else add(`test:playwright-security:${id}`, level, test.title, true);
      } else if (test.status !== "expected" || last.status !== "passed" || test.expectedStatus === "failed") {
        fatal.push(`Unexpected test result (including remediation/flakiness): ${manifest.jobId}/${id}`);
      }
    }
  } else throw new Error(`Unsupported report producer: ${source}`);
  return found;
}

function evaluate(options: Options) {
  const fatal: string[] = [];
  const findings: Finding[] = [];
  const exceptions = new Map<string, ExceptionEntry>();
  const now = options.now ?? new Date();
  const today = now.toISOString().slice(0, 10);
  if (process.env.QG_NEEDS_JSON) {
    try {
      const jobs = JSON.parse(process.env.QG_NEEDS_JSON);
      for (const [name, value] of Object.entries(jobs) as [string, Native][]) {
        if (["failure", "cancelled"].includes(value.result)) fatal.push(`Workflow producer ${name}: ${value.result}`);
      }
    } catch { fatal.push("Invalid workflow job-status evidence."); }
  }
  try {
    const baseline = json(options.baseline);
    if (baseline.schemaVersion !== 1 || baseline.target !== "http://localhost:3000" || !Array.isArray(baseline.exceptions)) throw new Error("Invalid exception baseline schema/target.");
    for (const entry of baseline.exceptions as ExceptionEntry[]) {
      if (!entry.id || /[*?]/.test(entry.id) || !entry.source || !entry.owner?.trim() || !entry.justification?.en?.trim() || !entry.justification?.ptBR?.trim()
        || !/^\d{4}-\d{2}-\d{2}$/.test(entry.expiresOn) || new Date(`${entry.expiresOn}T00:00:00Z`).toISOString().slice(0, 10) !== entry.expiresOn) throw new Error("Exception requires exact id, source, bilingual justification, owner and valid expiration date.");
      if (exceptions.has(entry.id)) throw new Error(`Duplicate exception: ${entry.id}`);
      if (entry.expiresOn < today) fatal.push(`Expired exception: ${entry.id} (${entry.expiresOn})`);
      exceptions.set(entry.id, entry);
    }
  } catch (error) { fatal.push(`Baseline error: ${(error as Error).message}`); }
  const manifests = new Map<string, string>();
  for (const file of files(path.resolve(options.reports), "job.json")) {
    try {
      const job = json(file);
      if (job.schemaVersion !== 1 || typeof job.jobId !== "string") throw new Error("Invalid job manifest.");
      const expectedKind = job.jobId.startsWith("playwright-") ? "playwright" : job.jobId;
      const allowedJobs = new Set([...requiredJobs("full"), ...requiredJobs("nightly")]);
      if (!allowedJobs.has(job.jobId) || job.kind !== expectedKind) throw new Error("Job ID/producer mismatch.");
      if (job.profile !== options.profile) throw new Error(`Report profile mismatch: expected ${options.profile}, got ${job.profile}`);
      if (manifests.has(job.jobId)) throw new Error(`Duplicate job evidence: ${job.jobId}`);
      manifests.set(job.jobId, file);
      if (job.status !== "completed") { fatal.push(`${job.jobId}: producer failed/incomplete (${job.error ?? job.status})`); continue; }
      findings.push(...collectFindings(file, job, fatal));
    } catch (error) { fatal.push(`Report error (${path.basename(path.dirname(file))}): ${(error as Error).message}`); }
  }
  for (const id of requiredJobs(options.profile)) if (!manifests.has(id)) fatal.push(`Missing required job/report: ${id}`);
  const unique = [...new Map(findings.map((item) => [item.id, item])).values()];
  const accepted: Finding[] = [];
  const newFindings: Finding[] = [];
  for (const finding of unique) {
    const entry = exceptions.get(finding.id);
    if (entry && entry.source === finding.source && entry.expiresOn >= today) accepted.push(finding);
    else if (["CRITICAL", "HIGH"].includes(finding.severity) || finding.test) newFindings.push(finding);
  }
  for (const item of newFindings) fatal.push(`New/unexcepted ${item.severity}: ${item.id}`);
  return { schemaVersion: 1, passed: fatal.length === 0, profile: options.profile, evaluatedAt: now.toISOString(), jobs: [...manifests.keys()].sort(), findings: unique, accepted, newFindings, failures: fatal };
}

function main() {
  const args = process.argv.slice(2);
  const allowed = new Set(["--reports", "--baseline", "--profile", "--output"]);
  const values: Record<string, string> = {};
  for (let index = 0; index < args.length; index += 2) {
    if (!allowed.has(args[index]) || !args[index + 1]) throw new Error("Use --reports, --baseline, --profile and --output.");
    values[args[index]] = args[index + 1];
  }
  const result = evaluate({ reports: values["--reports"] ?? "reports/ci", baseline: values["--baseline"] ?? "security-baseline.json", profile: values["--profile"] ?? process.env.QG_PROFILE ?? "quick" });
  const output = values["--output"] ?? "reports/quality-gate.json";
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(result, null, 2) + "\n");
  const escape = (text: string) => text.replace(/[|<>`\r\n]/g, " ");
  const summary = [`## Quality and security gate / Gate de qualidade e segurança`, "", `**${result.passed ? "PASS / APROVADO" : "FAIL / REPROVADO"}** · ${result.profile}`, "",
    `Jobs / Jobs: ${result.jobs.length}; findings / achados: ${result.findings.length}; accepted exceptions / exceções aceitas: ${result.accepted.length}; new high/critical or test findings / novos achados altos/críticos ou de testes: ${result.newFindings.length}.`, "",
    ...result.failures.map((failure) => `- ${escape(failure)}`), ""].join("\n");
  fs.writeFileSync(output.replace(/\.json$/, ".md"), summary);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  console.log(summary);
  process.exitCode = result.passed ? 0 : 1;
}

module.exports = { evaluate, collectFindings, requiredJobs };
if (require.main === module) main();
