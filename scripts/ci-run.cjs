const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const toolImages = require("../.github/tool-images.json");
const root = path.resolve(__dirname, "..");
const kind = process.argv[2];
const browser = process.argv[3] || "chromium";
const profile = process.env.QG_PROFILE || "quick";
const allowed = ["lint", "gitleaks", "semgrep", "sca", "playwright", "security", "cypress", "trivy-image", "zap-baseline", "zap-full"];
if (!allowed.includes(kind) || !["quick", "full", "nightly"].includes(profile) || !["chromium", "firefox", "webkit"].includes(browser)) throw new Error("Invalid fixed CI job/profile/browser.");
const jobId = kind === "playwright" ? `${kind}-${browser}` : kind;
const out = path.join(root, "reports", "ci", jobId);
fs.mkdirSync(out, { recursive: true });
for (const entry of fs.readdirSync(out)) {
  if (kind.startsWith("zap-") && entry === "seed") continue;
  const target = path.resolve(out, entry);
  if (path.dirname(target) !== out) throw new Error("Unexpected generated evidence path.");
  fs.rmSync(target, { recursive: true, force: true });
}
const manifest = { schemaVersion: 1, jobId, kind, profile, status: "running", startedAt: new Date().toISOString(), reports: {}, commands: [] };
const save = () => fs.writeFileSync(path.join(out, "job.json"), JSON.stringify(manifest, null, 2) + "\n");
save();
function run(command, args, env = {}, accepted = [0]) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", windowsHide: true, env: { ...process.env, ...env } });
  manifest.commands.push({ command: path.basename(command), exitCode: result.status ?? -1 });
  if (result.error || !accepted.includes(result.status)) throw new Error(`CI command failed (${result.status ?? result.error?.code}).`);
  return result.status;
}
const node = (args, env, accepted) => run(process.execPath, args, env, accepted);
const mount = ["--volume", `${root}:/workspace:ro`, "--volume", `${out}:/output:rw`, "--workdir", "/workspace"];
const docker = (image, args, extra = []) => run("docker", ["run", "--rm", ...mount, ...extra, toolImages[image] ?? image, ...args]);
const cache = path.join(root, ".cache", "trivy");
const trivy = (args) => {
  fs.mkdirSync(cache, { recursive: true });
  docker("aquasec/trivy:latest", ["--cache-dir", "/cache", ...args], ["--volume", `${cache}:/cache:rw`]);
};
try {
  if (kind === "lint") {
    node(["scripts/lint.cjs"]);
    docker("rhysd/actionlint:latest", ["-color"]);
    fs.writeFileSync(path.join(out, "report.json"), JSON.stringify({ passed: true, checks: ["typescript", "javascript-syntax", "json", "actionlint-shellcheck"] }));
    manifest.reports.native = "report.json";
  } else if (kind === "gitleaks") {
    docker("zricethezav/gitleaks:latest", ["git", "/workspace", "--no-banner", "--redact=100", "--exit-code", "0", "--report-format", "json", "--report-path", "/output/report.json"], ["--env", "GIT_CONFIG_COUNT=1", "--env", "GIT_CONFIG_KEY_0=safe.directory", "--env", "GIT_CONFIG_VALUE_0=/workspace"]);
    manifest.reports.native = "report.json";
  } else if (kind === "semgrep") {
    docker("semgrep/semgrep:latest", ["semgrep", "scan", "--config", "/workspace/.semgrep.yml", "--metrics=off", "--disable-version-check", "--json", "--output", "/output/report.json", "--exclude", "node_modules", "--exclude", "reports", "--exclude", ".ci-artifacts", "--exclude", "allure-*", "--exclude", "test-results", "--exclude", "playwright-report*", "/workspace"]);
    manifest.reports.native = "report.json";
  } else if (kind === "sca") {
    trivy(["fs", "--scanners", "vuln", "--include-dev-deps", "--format", "json", "--output", "/output/report.json", "/workspace/package-lock.json"]);
    manifest.reports.native = "report.json";
  } else if (kind === "trivy-image") {
    const image = "bkimminich/juice-shop:latest";
    run("docker", ["image", "inspect", "--format", "{{.Id}}", image], {}, [0]);
    const archive = path.join(out, "image.tar");
    try {
      run("docker", ["image", "save", "--output", archive, image]);
      trivy(["image", "--input", "/output/image.tar", "--scanners", "vuln", "--list-all-pkgs", "--format", "json", "--output", "/output/report.json"]);
      trivy(["convert", "--format", "cyclonedx", "--output", "/output/sbom.cdx.json", "/output/report.json"]);
    } finally { fs.rmSync(archive, { force: true }); }
    manifest.reports = { native: "report.json", sbom: "sbom.cdx.json" };
  } else if (["playwright", "security", "cypress"].includes(kind)) {
    const env = { CI_REPORT_DIR: out, PW_BROWSER: browser };
    if (kind === "cypress") {
      node(["node_modules/cypress/bin/cypress", "run"], env, Array.from({ length: 101 }, (_, i) => i));
    } else {
      const args = ["node_modules/@playwright/test/cli.js", "test", "--config", kind === "security" ? "playwright.security.config.ts" : "playwright.config.ts"];
      if (kind === "playwright" && profile === "quick") args.push("--grep", "@smoke");
      node(args, env, [0, 1]);
      manifest.reports.native = "report.json";
    }
    manifest.reports.allure = "allure-results";
  } else {
    node(["scripts/zap.cjs", kind === "zap-full" ? "full" : "baseline"], {}, [0, 1]);
    for (const name of ["zap.html", "zap.json", "zap.sarif", "policy.json", "scan.json"]) {
      fs.copyFileSync(path.join(root, "reports", "security", "zap", name), path.join(out, name));
    }
    const coverage = path.join(root, "reports", "security", "zap", "proxy-coverage.json");
    if (fs.existsSync(coverage)) fs.copyFileSync(coverage, path.join(out, "proxy-coverage.json"));
    manifest.reports = { native: "zap.json", scan: "scan.json", sarif: "zap.sarif" };
  }
  manifest.status = "completed";
} catch (error) {
  manifest.status = "failed";
  manifest.error = error.message;
  console.error(error.message);
  process.exitCode = 1;
} finally {
  manifest.completedAt = new Date().toISOString();
  save();
}
