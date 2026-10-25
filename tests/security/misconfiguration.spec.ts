import { details, title } from "./catalog";
import { assertSecure, auth, denied, expect, test } from "./fixtures";

const headerChecks: [string, string, (value: string) => boolean][] = [
  ["TC-023", "content-security-policy", (value) => {
    const directives = Object.fromEntries(value.split(";").map((part) => { const [name, ...sources] = part.trim().split(/\s+/); return [name, sources]; }));
    const scripts = directives["script-src"] ?? directives["default-src"] ?? [];
    return scripts.length > 0 && !scripts.some((item) => ["*", "'unsafe-inline'", "'unsafe-eval'", "data:", "http:", "https:"].includes(item))
      && directives["object-src"]?.includes("'none'") === true;
  }],
  ["TC-024", "strict-transport-security", (value) => Number(value.match(/(?:^|;)\s*max-age=(\d+)/i)?.[1] ?? 0) >= 31_536_000 && /(?:^|;)\s*includeSubDomains\s*(?:;|$)/i.test(value)],
  ["TC-025", "x-frame-options", (value) => /^(DENY|SAMEORIGIN)$/i.test(value.trim())],
  ["TC-026", "x-content-type-options", (value) => value.trim().toLowerCase() === "nosniff"],
  ["TC-027", "referrer-policy", (value) => ["no-referrer", "same-origin", "strict-origin", "strict-origin-when-cross-origin"].includes(value.trim().toLowerCase())],
];
for (const [id, header, check] of headerChecks) {
  test(title(id), details(id), async ({ api }, info) => {
    const response = await api.call("GET", "/");
    expect(response.status(), "application root must be available").toBe(200);
    expect(response.headers()["content-type"]).toContain("text/html");
    const value = response.headers()[header] ?? "";
    await assertSecure(info, check(value), { header, value: value || "missing / ausente", httpOnlyBaseline: id === "TC-024" });
  });
}

test(title("TC-028"), details("TC-028"), async ({ api, customer }, info) => {
  const path = `/rest/basket/${customer.bid}`;
  const response = await api.call("GET", path, { headers: { ...auth(customer), Origin: "null" } });
  expect(response.status()).toBe(200);
  expect((await response.json()).data.id).toBe(customer.bid);
  const preflight = await api.call("OPTIONS", path, { headers: {
    Origin: "null", "Access-Control-Request-Method": "GET", "Access-Control-Request-Headers": "authorization",
  } });
  expect([200, 204, 400, 401, 403, 404, 405]).toContain(preflight.status());
  const actualOrigin = response.headers()["access-control-allow-origin"] ?? "";
  const preflightOrigin = preflight.headers()["access-control-allow-origin"] ?? "";
  const permitted = ["*", "null"].includes(actualOrigin) || ["*", "null"].includes(preflightOrigin);
  await assertSecure(info, !permitted, {
    actualOrigin, preflightOrigin, preflightStatus: preflight.status(),
    allowedHeaders: preflight.headers()["access-control-allow-headers"],
    allowedCredentials: response.headers()["access-control-allow-credentials"] ?? "absent",
    scope: "Header policy test with opaque Origin: null; no request to another host. / Teste de política com origem opaca; sem requisição a outro host.",
  });
});

for (const [id, path, marker] of [
  ["TC-029", "/ftp/", /href=["'][^"']*(?:acquisitions\.md|incident-support|eastere\.gg|legal\.md)/i],
  ["TC-030", "/metrics", /^#\s+(?:HELP|TYPE)\s+/m],
] as const) {
  test(title(id), details(id), async ({ api }, info) => {
    const response = await api.call("GET", path);
    expect(response.status(), "server errors are not known exposure findings").toBeLessThan(500);
    const exposed = marker.test(await response.text());
    if (!denied(response.status())) {
      expect(response.status(), "exposure must be real content, not redirect/SPA fallback").toBe(200);
      expect(exposed, "expected endpoint content must exist").toBe(true);
    }
    await assertSecure(info, denied(response.status()) && !exposed, { path, status: response.status(), contentExposed: exposed });
  });
}
