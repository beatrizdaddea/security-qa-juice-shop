const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const executions = [];
function collect(suite) {
  for (const spec of suite.specs || []) {
    for (const test of spec.tests || []) executions.push({ title: spec.title, ...test });
  }
  for (const child of suite.suites || []) collect(child);
}
collect(readJson(path.join(root, "test-results", "security-results.json")));
assert(executions.length > 0, "Security tests must execute.");
assert.equal(new Set(executions.map((item) => item.title)).size, executions.length, "Duplicate test names.");

const directory = path.join(root, "allure-results-security");
const results = fs.readdirSync(directory).filter((file) => file.endsWith("-result.json")).map((file) => readJson(path.join(directory, file)));
assert.equal(results.length, executions.length, "Allure and Playwright counts differ.");
const document = fs.readFileSync(path.join(root, "docs", "SECURITY-TESTS.md"), "utf8");
const matrix = [...document.matchAll(/^\| (TC-\d+) (.+)$/gm)];
assert.equal(matrix.length, executions.length, "Matrix and Playwright counts differ (run the full suite).");
const attachments = [];
function collectAttachments(value, output) {
  output.push(...(value.attachments || []));
  for (const step of value.steps || []) collectAttachments(step, output);
}
let findings = 0;
for (const execution of executions) {
  const id = execution.title.split(" ")[0];
  assert.equal(execution.status, "expected", `${id}: unexpected execution outcome.`);
  const result = results.find((item) => item.name === execution.title);
  assert(result, `${id}: missing Allure result.`);
  const label = (name) => result.labels.filter((item) => item.name === name).map((item) => item.value);
  const annotation = (type) => execution.annotations.find((item) => item.type === type)?.description;
  assert(annotation("security-observation"), `${id}: no security verdict.`);
  assert(label("epic").length > 0, `${id}: no epic.`);
  assert(label("feature").includes(annotation("OWASP")), `${id}: wrong feature grouping.`);
  assert(label("suite").includes(annotation("OWASP")), `${id}: wrong OWASP suite.`);
  assert(label("severity").includes(annotation("severity")), `${id}: wrong severity.`);
  assert(label("tag").includes("security"), `${id}: missing security tag.`);
  assert(label("tag").some((value) => value.startsWith("OWASP ")), `${id}: missing OWASP tag.`);
  const row = matrix.find((match) => match[1] === id)?.[2];
  assert(row, `${id}: missing matrix row.`);
  const testAttachments = [];
  collectAttachments(result, testAttachments);
  assert(testAttachments.some((item) => item.name.includes("request-response")), `${id}: no HTTP evidence.`);
  if (annotation("known-vuln")) {
    findings++;
    assert.equal(execution.expectedStatus, "failed", `${id}: known vulnerability must use test.fail().`);
    assert(label("tag").includes("known-vuln"), `${id}: no finding tag.`);
    assert(testAttachments.some((item) => item.name === "security-finding"), `${id}: no finding evidence.`);
    assert(row.includes("Known vulnerability (expected failure)"), `${id}: wrong matrix finding.`);
  } else {
    assert(row.includes("Secure control passed"), `${id}: wrong matrix control.`);
  }
  attachments.push(...testAttachments);
}
for (const attachment of attachments.filter((item) => item.type === "application/json")) {
  const content = fs.readFileSync(path.join(directory, attachment.source), "utf8");
  assert(!/\beyJ[\w-]+\.[\w-]+\.[\w-]+\b/.test(content), "Unredacted JWT in evidence.");
  const value = JSON.parse(content);
  if (value.request?.url) assert.equal(new URL(value.request.url).origin, "http://localhost:3000", "Out-of-scope HTTP evidence.");
}
console.log(`Security evidence verified: ${executions.length} cases, ${findings} known findings, OWASP metadata, request/response attachments, JWT redaction and matching documentation.`);
