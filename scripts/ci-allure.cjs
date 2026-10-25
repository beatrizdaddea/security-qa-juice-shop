const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { sanitizeReport } = require("./sanitize-allure-report.cjs");
const toolImages = require("../.github/tool-images.json");
const root = path.resolve(__dirname, "..");
const inputs = path.resolve(root, process.argv[2] || ".ci-artifacts");
const merged = path.join(root, "reports", "ci", "allure-results");
const output = path.join(root, "reports", "ci", "allure-report");
if (path.dirname(merged) !== path.join(root, "reports", "ci")) throw new Error("Unexpected Allure output path.");
fs.rmSync(merged, { recursive: true, force: true });
fs.mkdirSync(merged, { recursive: true });
let results = 0;
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      if (entry.name === "allure-results" && file !== merged) {
        for (const name of fs.readdirSync(file)) {
          if (name.endsWith("-result.json")) results++;
          if (fs.statSync(path.join(file, name)).isFile()) fs.copyFileSync(path.join(file, name), path.join(merged, name));
        }
      } else if (file !== merged && file !== output) walk(file);
    }
  }
}
walk(inputs);
if (results === 0) throw new Error("No Allure results to publish.");
const identity = process.getuid ? ["--user", `${process.getuid()}:${process.getgid()}`] : [];
const args = ["run", "--rm", ...identity, "--volume", `${root}:/workspace`, "--workdir", "/workspace", toolImages["eclipse-temurin:17-jre"], "java", "-classpath", "/workspace/node_modules/allure-commandline/dist/lib/*:/workspace/node_modules/allure-commandline/dist/lib/config", "io.qameta.allure.CommandLine", "generate", "reports/ci/allure-results", "--clean", "-o", "reports/ci/allure-report"];
const child = spawnSync("docker", args, { cwd: root, stdio: "inherit", windowsHide: true });
if (child.status !== 0) throw new Error("Allure generation failed.");
const index = path.join(output, "index.html");
const notice = '<aside style="padding:1rem;background:#fff7ed">Local OWASP Juice Shop training report; deliberately vulnerable application. No production system was tested. / Relatório de treinamento OWASP Juice Shop local; aplicação propositalmente vulnerável. Nenhum sistema de produção foi testado.</aside>';
fs.writeFileSync(index, fs.readFileSync(index, "utf8").replace("<body>", `<body>${notice}`));
sanitizeReport(output);
console.log(`Generated sanitized Allure site from ${results} test results.`);
