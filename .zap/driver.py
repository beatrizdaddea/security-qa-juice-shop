"""Fixed-scope Docker ZAP lifecycle and reports. / Ciclo de vida e relatórios ZAP com escopo fixo."""
import collections
import fcntl
import json
import os
from pathlib import Path
import re
import signal
import secrets
import subprocess
import sys
import time
import urllib.parse
import urllib.request
import urllib.error

TARGET = "http://localhost:3000"
API = "http://localhost:8080"
ROOT = Path(__file__).resolve().parent
REPORTS = Path("/zap/wrk/reports")
READY = Path("/tmp/juice-shop-zap-ready")
KEY_FILE = Path("/tmp/juice-shop-zap-api-key")
GUARD = "juice-shop-only"
SENDER_GUARD = "juice-shop-http-sender"
INCLUDE = r"^http://localhost:3000(?:/.*)?$"
OUTSIDE = r"^(?!http://localhost:3000(?:/|$)).*$"
OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def key():
    value = os.environ.get("ZAP_API_KEY", "")
    if not value and KEY_FILE.exists():
        value = KEY_FILE.read_text().strip()
    if len(value) < 32 or not re.fullmatch(r"[A-Za-z0-9_-]+", value):
        raise RuntimeError("ZAP_API_KEY must be a locally generated secret of at least 32 characters.")
    return value


def prepare_key():
    if not os.environ.get("ZAP_API_KEY"):
        KEY_FILE.write_text(secrets.token_urlsafe(32))
        KEY_FILE.chmod(0o600)
    key()


def api(component, operation, name, **parameters):
    url = f"{API}/JSON/{component}/{operation}/{name}/?{urllib.parse.urlencode(parameters)}"
    request = urllib.request.Request(url, headers={"X-ZAP-API-Key": key()})
    try:
        with OPENER.open(request, timeout=20) as response:
            result = json.load(response)
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf8", errors="replace")
        raise RuntimeError(f"ZAP {component}/{name} HTTP {error.code}: {detail[:600]}") from None
    if "code" in result:
        raise RuntimeError(f"ZAP {component}/{name}: {result['code']} {result.get('message', '')}")
    return result


def settings():
    config = json.loads((ROOT / "context.json").read_text())
    if config["target"] != TARGET or config["include"] != INCLUDE or OUTSIDE not in config["exclude"]:
        raise RuntimeError("Refusing modified target or permissive context.")
    return config


def configure():
    config = settings()
    api("core", "action", "setMode", mode="safe")
    if config["name"] in api("context", "view", "contextList")["contextList"]:
        api("context", "action", "removeContext", contextName=config["name"])
    context_id = api("context", "action", "newContext", contextName=config["name"])["contextId"]
    api("context", "action", "includeInContext", contextName=config["name"], regex=INCLUDE)
    for pattern in config["exclude"]:
        api("context", "action", "excludeFromContext", contextName=config["name"], regex=pattern)
        api("spider", "action", "excludeFromScan", regex=pattern)
        api("ascan", "action", "excludeFromScan", regex=pattern)
    api("context", "action", "setContextInScope", contextName=config["name"], booleanInScope="true")
    api("pscan", "action", "setScanOnlyInScope", onlyInScope="true")
    engines = api("script", "view", "listEngines")["listEngines"]
    names = [item["name"] if isinstance(item, dict) else item for item in engines]
    engine = next((name for name in names if "graal" in name.lower()), None)
    if not engine:
        raise RuntimeError("The stable image must include the Graal.js script engine.")
    api("script", "action", "load", scriptName=GUARD, scriptType="proxy", scriptEngine=engine,
        fileName=str(ROOT / "scope-guard.js"), scriptDescription="Only http://localhost:3000")
    api("script", "action", "enable", scriptName=GUARD)
    api("script", "action", "load", scriptName=SENDER_GUARD, scriptType="httpsender", scriptEngine=engine,
        fileName=str(ROOT / "http-sender-guard.js"), scriptDescription="Local-only scanner and redirect transport")
    api("script", "action", "enable", scriptName=SENDER_GUARD)
    api("core", "action", "setMode", mode="protect")
    return context_id


def check_scope():
    if not READY.exists():
        raise RuntimeError("Scoped ZAP daemon has not finished initialization.")
    config = settings()
    if api("core", "view", "mode")["mode"] != "protect":
        raise RuntimeError("ZAP must be in Protected mode.")
    context = api("context", "view", "context", contextName=config["name"])["context"]
    includes = json.loads(context["includeRegexs"]) if isinstance(context["includeRegexs"], str) else context["includeRegexs"]
    excludes = json.loads(context["excludeRegexs"]) if isinstance(context["excludeRegexs"], str) else context["excludeRegexs"]
    if includes != [INCLUDE] or set(excludes) != set(config["exclude"]):
        raise RuntimeError("Running ZAP context differs from the locked configuration.")
    if str(context["inScope"]).lower() != "true":
        raise RuntimeError("Local context must be in scope.")
    scripts = api("script", "view", "listScripts")["listScripts"]
    for name in [GUARD, SENDER_GUARD]:
        guard = next((item for item in scripts if item["name"] == name), {})
        if str(guard.get("enabled")).lower() != "true" or str(guard.get("error", False)).lower() not in {"false", "none", ""}:
            raise RuntimeError("Local-only request guard is disabled or has failed.")
    return context


def daemon():
    READY.unlink(missing_ok=True)
    settings()
    prepare_key()
    process = subprocess.Popen([
        "/zap/zap.sh", "-daemon", "-silent", "-host", "0.0.0.0", "-port", "8080", "-loglevel", "WARN",
        "-config", f"api.key={key()}", "-config", "api.addrs.addr.name=^(localhost|127[.]0[.]0[.]1|0:0:0:0:0:0:0:1|::1)$",
        "-config", "api.addrs.addr.regex=true", "-config", "mode=safe",
    ], start_new_session=True)
    def stop(_signal, _frame):
        READY.unlink(missing_ok=True)
        if process.poll() is None:
            os.killpg(process.pid, signal.SIGTERM)
    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    try:
        deadline = time.monotonic() + 180
        while True:
            if process.poll() is not None:
                raise RuntimeError("ZAP exited before initialization.")
            try:
                api("core", "view", "version")
                break
            except (OSError, ValueError):
                if time.monotonic() > deadline:
                    raise RuntimeError("ZAP startup timed out.")
                time.sleep(1)
        configure()
        READY.write_text("configured\n")
        check_scope()
        print("ZAP ready: Protected mode, local context and proxy guard. / ZAP pronto: modo protegido, contexto local e trava do proxy.", flush=True)
        return process.wait()
    finally:
        stop(None, None)
        try:
            process.wait(timeout=15)
        except subprocess.TimeoutExpired:
            os.killpg(process.pid, signal.SIGKILL)


def wait_passive():
    deadline = time.monotonic() + 150
    stable = 0
    while stable < 3:
        remaining = int(api("pscan", "view", "recordsToScan")["recordsToScan"])
        stable = stable + 1 if remaining == 0 else 0
        if time.monotonic() > deadline:
            raise RuntimeError("Passive scan did not finish; results are incomplete.")
        time.sleep(1)


def timestamp():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def save(name, value):
    REPORTS.mkdir(parents=True, exist_ok=True)
    (REPORTS / name).write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n")


def verify_proxy():
    check_scope()
    messages = api("core", "view", "messages", baseurl=TARGET, start=0, count=10000)["messages"]
    coverage = []
    for item in messages:
        header = item["requestHeader"]
        method, url, _version = header.splitlines()[0].split(" ", 2)
        parsed = urllib.parse.urlsplit(url)
        if f"{parsed.scheme}://{parsed.netloc}" != TARGET:
            raise RuntimeError("ZAP captured an out-of-scope destination.")
        coverage.append({"method": method, "path": parsed.path.rstrip("/") or "/",
                         "browser": "sec-fetch-" in header.lower(),
                         "api": bool(re.search(r"user-agent:.*playwright", header, re.I))})
    required = [("GET", "/"), ("GET", "/rest/products/search"), ("POST", "/api/Users"),
                ("POST", "/rest/user/login"), ("POST", "/api/BasketItems")]
    for method, path in required:
        if not any(row["method"] == method and row["path"] == path for row in coverage):
            raise RuntimeError(f"Missing functional traffic in ZAP: {method} {path}")
    if not any(row["browser"] for row in coverage) or not any(row["api"] for row in coverage):
        raise RuntimeError("Both Playwright browser and API/setup traffic must reach ZAP.")
    sites = api("core", "view", "sites")["sites"]
    if any(site.rstrip("/") != TARGET for site in sites):
        raise RuntimeError("Unexpected site in the ZAP session.")
    save("proxy-coverage.json", {"verifiedAt": timestamp(), "target": TARGET, "messages": len(coverage),
                                 "browserMessages": sum(row["browser"] for row in coverage),
                                 "apiMessages": sum(row["api"] for row in coverage), "routes": coverage})
    print(f"Verified {len(coverage)} local requests, including browser and API/setup traffic.")


def rules():
    policies = {}
    for line in (ROOT / "rules.tsv").read_text().splitlines():
        if not line or line.startswith("#"):
            continue
        parts = line.split("\t")
        if len(parts) != 4 or not parts[0].isdigit() or parts[1] not in {"FAIL", "WARN", "IGNORE"} or not all(parts[2:]):
            raise RuntimeError("Every rules.tsv exception needs an ID, policy and bilingual justification.")
        if parts[0] in policies:
            raise RuntimeError("Duplicate rule exception.")
        policies[parts[0]] = parts[1:]
    return policies


def gate():
    policies = rules()
    alerts = api("core", "view", "alerts", baseurl=TARGET, start=0, count=10000)["alerts"]
    counts = collections.Counter()
    grouped = {}
    for alert in alerts:
        rule = str(alert["pluginId"])
        risk = int(alert["riskcode"]) if "riskcode" in alert else {"High": 3, "Medium": 2, "Low": 1, "Informational": 0}[alert["risk"]]
        policy, *reason = policies.get(rule, ["FAIL" if risk >= 2 else "WARN"])
        counts[policy] += 1
        grouped[rule] = {"ruleId": rule, "name": alert["name"], "risk": alert["risk"], "policy": policy,
                         "justification": reason}
    result = {"target": TARGET, "evaluatedAt": timestamp(), "counts": dict(counts), "rules": list(grouped.values()),
              "nativeReportsRetainAllFindings": True}
    save("policy.json", result)
    print("ZAP finding policy: " + json.dumps(dict(counts)))
    return 1 if counts["FAIL"] else 0


def sanitize_reports():
    for name in ["zap.html", "zap.json", "zap.sarif"]:
        file = REPORTS / name
        content = file.read_text()
        content = content.replace(key(), "[REDACTED_API_KEY]")
        content = re.sub(r"\beyJ[\w-]+\.[\w-]+\.[\w-]+\b", "[REDACTED_JWT]", content)
        content = re.sub(r"Bearer\s+[A-Za-z0-9._~+/-]{10,}=*", "Bearer [REDACTED]", content, flags=re.I)
        file.write_text(content)
    report = json.loads((REPORTS / "zap.json").read_text())
    if not report.get("site"):
        raise RuntimeError("No local traffic in the report; an empty report is not scan evidence.")
    for site in report.get("site", []):
        if site["@name"].rstrip("/") != TARGET:
            raise RuntimeError("Report contains an out-of-scope site.")
    sarif = json.loads((REPORTS / "zap.sarif").read_text())
    if sarif.get("version") != "2.1.0" or not sarif.get("runs"):
        raise RuntimeError("Invalid SARIF report.")
    for run in sarif["runs"]:
        for result in run.get("results", []):
            for location in result.get("locations", []):
                uri = location.get("physicalLocation", {}).get("artifactLocation", {}).get("uri", "")
                if uri and not re.match(r"^http://localhost:3000(?:/|$)", uri):
                    raise RuntimeError("SARIF finding is outside the local target.")


def report():
    check_scope()
    wait_passive()
    config = settings()
    for template, name in [("traditional-html", "zap.html"), ("traditional-json", "zap.json"), ("sarif-json", "zap.sarif")]:
        result = api("reports", "action", "generate", title="Juice Shop local DAST / DAST local Juice Shop",
                     template=template, contexts=config["name"], sites=TARGET, reportFileName=name,
                     reportDir=str(REPORTS), display="false")
        generated = Path(result["generate"])
        destination = REPORTS / name
        if generated != destination and generated.exists():
            generated.replace(destination)
        if not destination.exists() or destination.stat().st_size == 0:
            raise RuntimeError(f"Missing generated {name} report.")
    sanitize_reports()
    print("Generated and validated HTML, JSON and SARIF in reports/security/zap/.")
    return gate()


def scan(mode):
    context = check_scope()
    rules()
    state = {"mode": mode, "target": TARGET, "startedAt": timestamp(), "complete": False,
             "activeScanStarted": False}
    save("scan.json", state)
    spider_id = active_id = None
    try:
        api("spider", "action", "setOptionMaxDuration", Integer=1 if mode == "baseline" else 3)
        api("spider", "action", "setOptionMaxDepth", Integer=3 if mode == "baseline" else 6)
        api("spider", "action", "setOptionThreadCount", Integer=2)
        spider_id = api("spider", "action", "scan", url=TARGET, maxChildren=20, recurse="true",
                        contextName=settings()["name"], subtreeOnly="true")["scan"]
        deadline = time.monotonic() + (90 if mode == "baseline" else 210)
        while int(api("spider", "view", "status", scanId=spider_id)["status"]) < 100:
            check_scope()
            if time.monotonic() > deadline:
                raise RuntimeError("Spider exceeded its time budget; incomplete scan.")
            time.sleep(1)
        if mode == "full":
            api("ascan", "action", "setOptionThreadPerHost", Integer=2)
            api("ascan", "action", "setOptionMaxRuleDurationInMins", Integer=2)
            api("ascan", "action", "setOptionMaxScanDurationInMins", Integer=15)
            api("ascan", "action", "setOptionDelayInMs", Integer=50)
            # OAST and DoS rules do not belong in this isolated local lab.
            # Regras OAST e DoS não pertencem a este laboratório local isolado.
            scanners = api("ascan", "view", "scanners")["scanners"]
            excluded = [item["id"] for item in scanners if re.search(r"out.of.band|OAST|denial.of.service|SSRF|Log4Shell", item["name"], re.I)]
            if excluded:
                api("ascan", "action", "disableScanners", ids=",".join(excluded))
            state["excludedActiveRules"] = excluded
            active_id = api("ascan", "action", "scan", url=TARGET, recurse="true", inScopeOnly="true", contextId=context["id"])["scan"]
            state["activeScanStarted"] = True
            save("scan.json", state)
            deadline = time.monotonic() + 960
            while int(api("ascan", "view", "status", scanId=active_id)["status"]) < 100:
                check_scope()
                if time.monotonic() > deadline:
                    raise RuntimeError("Active scan timed out; incomplete scan.")
                time.sleep(2)
        wait_passive()
        state.update(complete=True, finishedAt=timestamp(), passiveQueue=0)
        print(f"Completed {mode} scan against {TARGET}.")
    finally:
        if spider_id is not None:
            api("spider", "action", "stop", scanId=spider_id)
        if active_id is not None:
            api("ascan", "action", "stop", scanId=active_id)
        save("scan.json", state)
    return report()


def main():
    if len(sys.argv) != 2 or sys.argv[1] not in {"daemon", "health", "baseline", "full", "report", "verify-proxy"}:
        raise RuntimeError("Fixed local target only; invalid command.")
    mode = sys.argv[1]
    if mode == "daemon":
        return daemon()
    if mode == "health":
        check_scope()
        return 0
    # Prevent report/session races. / Evite concorrência nos relatórios e na sessão.
    with open("/tmp/juice-shop-zap-operation.lock", "w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        if mode == "verify-proxy":
            verify_proxy()
            return 0
        return report() if mode == "report" else scan(mode)


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as error:
        print(f"ZAP infrastructure/scope error: {error}", file=sys.stderr)
        sys.exit(3)
