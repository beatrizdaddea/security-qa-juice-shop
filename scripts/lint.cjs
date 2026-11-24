const { execFileSync } = require("node:child_process");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
for (const config of ["tsconfig.json", "tsconfig.playwright.json"]) {
  execFileSync(process.execPath, ["node_modules/typescript/bin/tsc", "-p", config, "--noEmit"], { cwd: root, stdio: "inherit" });
}
const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { cwd: root, encoding: "utf8" }).split("\0").filter(Boolean);
for (const file of new Set(files)) {
  if (file.endsWith(".json")) JSON.parse(readFileSync(path.join(root, file), "utf8"));
  if (file.endsWith(".cjs")) execFileSync(process.execPath, ["--check", file], { cwd: root, stdio: "inherit" });
}
console.log("Lint passed: TypeScript, JavaScript syntax and JSON. / Lint aprovado: TypeScript, sintaxe JavaScript e JSON.");
