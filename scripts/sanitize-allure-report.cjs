const {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} = require("node:fs");
const path = require("node:path");

const prohibitedExtensions = new Set([
  ".avi",
  ".har",
  ".log",
  ".mov",
  ".mp4",
  ".webm",
]);
const sensitiveKeys = /(authorization|cookie|password|session|token)/i;
const emailPattern = /[A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,})/gi;
const jwtPattern = /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g;
const bearerPattern = /\bBearer\s+[A-Za-z0-9._~+/-]{10,}={0,2}/gi;
const basicPattern = /\bBasic\s+[A-Za-z0-9+/]{8,}={0,2}/gi;
const authorizationPattern = /(Authorization\s*[:=]\s*)(?!\[REDACTED\])(?:\\?["'])?[^,\s}\\'"<>]{6,}/gi;
const quotedSecretPattern = /((?:password|token|cookie|session)\\?["']?\s*[:=]\s*\\?["'])(?!\[REDACTED\])([^\\\s"']{4,})/gi;

function walkFiles(directory) {
  if (!existsSync(directory)) return [];

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(entryPath) : [entryPath];
  });
}

function sanitizeText(value) {
  return value
    .replace(emailPattern, (email, domain) =>
      domain.toLowerCase() === "example.com" ? email : "redacted@example.com",
    )
    .replace(jwtPattern, "[REDACTED_JWT]")
    .replace(bearerPattern, "Bearer [REDACTED]")
    .replace(basicPattern, "Basic [REDACTED]")
    .replace(authorizationPattern, "$1[REDACTED]")
    .replace(quotedSecretPattern, "$1[REDACTED]");
}

function sanitizeJson(value) {
  if (Array.isArray(value)) return value.map(sanitizeJson);
  if (typeof value === "string") return sanitizeText(value);
  if (value === null || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key.toLowerCase() !== "attachments")
      .map(([key, child]) => [
        key,
        sensitiveKeys.test(key) && typeof child === "string" ? "[REDACTED]" : sanitizeJson(child),
      ]),
  );
}

function findProhibitedData(text) {
  const findings = [];
  const nonExampleEmail = [...text.matchAll(emailPattern)].find(
    (match) => match[1].toLowerCase() !== "example.com",
  );

  if (nonExampleEmail) findings.push("non-example.com email");
  if (jwtPattern.test(text)) findings.push("JWT");
  jwtPattern.lastIndex = 0;
  if (bearerPattern.test(text)) findings.push("Bearer credential");
  bearerPattern.lastIndex = 0;
  if (basicPattern.test(text)) findings.push("Basic credential");
  basicPattern.lastIndex = 0;
  if (authorizationPattern.test(text)) findings.push("Authorization value");
  authorizationPattern.lastIndex = 0;
  if (quotedSecretPattern.test(text)) findings.push("authentication value");
  quotedSecretPattern.lastIndex = 0;

  return findings;
}

function sanitizeReport(reportDirectory) {
  const reportDir = path.resolve(reportDirectory);

  if (path.basename(reportDir) !== "allure-report" || !existsSync(reportDir) || !lstatSync(reportDir).isDirectory()) {
    throw new Error(`Expected an existing allure-report directory, received: ${reportDir}`);
  }

  const attachmentsDir = path.join(reportDir, "data", "attachments");
  rmSync(attachmentsDir, { recursive: true, force: true });

  for (const file of walkFiles(reportDir)) {
    if (prohibitedExtensions.has(path.extname(file).toLowerCase())) rmSync(file, { force: true });
  }

  const jsonFiles = walkFiles(reportDir).filter(
    (file) => path.extname(file).toLowerCase() === ".json",
  );

  for (const file of jsonFiles) {
    const data = JSON.parse(readFileSync(file, "utf8"));
    writeFileSync(file, `${JSON.stringify(sanitizeJson(data))}\n`, "utf8");
  }

  const filesToVerify = [path.join(reportDir, "index.html"), ...jsonFiles].filter(existsSync);
  const findings = filesToVerify.flatMap((file) =>
    findProhibitedData(readFileSync(file, "utf8")).map((finding) => `${file}: ${finding}`),
  );

  if (findings.length > 0) {
    throw new Error(`Sanitization failed:\n${findings.join("\n")}`);
  }

  console.log(`Sanitization passed: ${jsonFiles.length} JSON files checked; attachments and media removed.`);
}

if (require.main === module) {
  const reportDirectory = process.argv[2] || path.join("publication", "allure-report");

  try {
    sanitizeReport(reportDirectory);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { findProhibitedData, sanitizeJson, sanitizeReport, sanitizeText };
