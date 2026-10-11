const { spawn } = require("node:child_process");
const path = require("node:path");

const allureHome = path.resolve(__dirname, "..", "node_modules", "allure-commandline", "dist");
const classpath = [path.join(allureHome, "lib", "*"), path.join(allureHome, "lib", "config")].join(path.delimiter);
const child = spawn(
  "java",
  ["-classpath", classpath, "io.qameta.allure.CommandLine", ...process.argv.slice(2)],
  { stdio: "inherit", shell: false },
);

child.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});

child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
