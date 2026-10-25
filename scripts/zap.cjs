const { mkdirSync, readFileSync, appendFileSync, existsSync } = require("node:fs");
const { randomBytes } = require("node:crypto");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const mode = process.argv[2];
if (process.argv.length !== 3 || !["up", "baseline", "full", "report", "verify-proxy"].includes(mode)) {
  console.error("Use up, baseline, full, report or verify-proxy; custom targets/arguments are forbidden.");
  process.exit(64);
}
const envFile = path.join(root, ".env");
if (mode === "up") {
  const content = existsSync(envFile) ? readFileSync(envFile, "utf8") : "";
  const configured = content.match(/^ZAP_API_KEY=(.+)$/m)?.[1]?.trim();
  if (!configured && !process.env.ZAP_API_KEY) {
    appendFileSync(envFile, `\nZAP_API_KEY=${randomBytes(32).toString("hex")}\n`, { mode: 0o600 });
    console.log("Created a git-ignored local ZAP API key. / Chave local ZAP criada e ignorada pelo Git.");
  }
}
mkdirSync(path.join(root, "reports", "security", "zap"), { recursive: true });
const args = mode === "up"
  ? ["compose", "up", "-d", "--wait", "--wait-timeout", "240", "juice-shop", "zap"]
  : ["compose", "exec", "-T", "zap", "python3", "/zap/wrk/.zap/driver.py", mode];
const result = spawnSync("docker", args, { cwd: root, stdio: "inherit", windowsHide: true });
if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 3;
