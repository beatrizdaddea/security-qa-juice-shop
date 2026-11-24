import { test as base, expect, type APIRequestContext, type APIResponse, type TestInfo } from "@playwright/test";
import * as allure from "allure-js-commons";
import { newTestUser, SECURITY_ANSWER, SECURITY_QUESTION, type TestUser } from "../../utils/data";
import { categories, securityCase } from "./catalog";
import { zapProxyOptions } from "../../utils/zap-proxy";

export const TARGET = "http://localhost:3000";
export const denied = (status: number): boolean => [401, 403, 404].includes(status);

export function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key,
      /authorization|cookie|password|token|secret|securityAnswer/i.test(key) && typeof child === "string"
        ? "[REDACTED]" : sanitize(child),
    ]));
  }
  if (typeof value === "string") return value
    .replace(/\beyJ[\w-]+\.[\w-]+\.[\w-]+\b/g, "[REDACTED_JWT]")
    .replace(/Bearer\s+[^\s"<>]+/gi, "Bearer [REDACTED]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "redacted@example.com");
  return value;
}

export async function evidence(info: TestInfo, name: string, value: unknown): Promise<void> {
  await info.attach(name, { body: Buffer.from(JSON.stringify(sanitize(value), null, 2)), contentType: "application/json" });
}

export interface Customer { user: TestUser; token: string; bid: number; id: number }
type Options = Parameters<APIRequestContext["fetch"]>[1];
export class SecurityApi {
  constructor(private readonly request: APIRequestContext, private readonly info: TestInfo) {}

  async call(method: string, path: string, options: Options = {}): Promise<APIResponse> {
    const url = new URL(path, TARGET);
    if (url.origin !== TARGET || url.username || url.password || !path.startsWith("/") || path.startsWith("//")) {
      throw new Error("Security requests must stay on http://localhost:3000.");
    }
    const response = await this.request.fetch(url.href, { ...options, method, maxRedirects: 0, timeout: 15_000 });
    const text = await response.text();
    let body: unknown = text;
    try { body = JSON.parse(text); } catch { /* Preserve non-JSON evidence. / Preserve evidência não JSON. */ }
    await evidence(this.info, `${method} ${url.pathname} request-response`, {
      request: { method, url: url.href, headers: options?.headers, body: Buffer.isBuffer(options?.data) ? options.data.toString("utf8") : options?.data },
      response: { status: response.status(), headers: response.headers(), body },
    });
    return response;
  }

  async register(user = newTestUser("pw-security")): Promise<TestUser> {
    const response = await this.call("POST", "/api/Users", { data: {
      ...user, passwordRepeat: user.password, securityQuestion: SECURITY_QUESTION, securityAnswer: SECURITY_ANSWER,
    } });
    expect([200, 201], "test-user registration must succeed").toContain(response.status());
    return user;
  }

  async login(user: TestUser): Promise<Customer> {
    const response = await this.call("POST", "/rest/user/login", { data: user });
    expect(response.status(), "test-user login must succeed").toBe(200);
    const { authentication } = await response.json();
    expect(authentication.token, "login must issue a JWT").toEqual(expect.any(String));
    const claims = decodeJwt(authentication.token);
    expect(claims.data.role, "fixture must be an ordinary customer").toBe("customer");
    return { user, token: authentication.token, bid: authentication.bid, id: claims.data.id };
  }

  async customer(): Promise<Customer> { return this.login(await this.register()); }
}

export function decodeJwt(token: string) {
  return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
}
export const auth = (customer: Pick<Customer, "token">) => ({ Authorization: `Bearer ${customer.token}` });

interface Fixtures {
  api: SecurityApi;
  customer: Customer;
  metadata: void;
}

export const test = base.extend<Fixtures>({
  api: async ({ playwright }, use, info) => {
    const request = await playwright.request.newContext({ baseURL: TARGET, ...zapProxyOptions() });
    await use(new SecurityApi(request, info));
    await request.dispose();
  },
  customer: async ({ api }, use) => use(await api.customer()),
  metadata: [async ({}, use, info) => {
    const entry = securityCase(info.title.split(" ")[0]);
    await allure.epic("OWASP Juice Shop Security QA");
    await allure.feature(categories[entry.owasp]);
    await allure.severity(entry.severity);
    await allure.tags("security", `OWASP ${entry.owasp}:2021`, ...(entry.known ? ["known-vuln"] : []));
    await allure.parentSuite("OWASP Top 10 (2021)");
    await allure.suite(categories[entry.owasp]);
    await allure.description([entry.expected.join(" / "), entry.known?.join(" / ")].filter(Boolean).join("\n"));
    await use();
  }, { auto: true }],
  context: async ({ context }, use, info) => {
    const violations: string[] = [];
    await context.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (url.origin === TARGET) await route.continue();
      else { violations.push(url.origin); await route.abort("blockedbyclient"); }
    });
    // The tested flows do not need sockets. / Os fluxos testados não precisam de sockets.
    await context.routeWebSocket("**/*", (socket) => socket.close());
    await context.addCookies([
      { name: "welcomebanner_status", value: "dismiss", url: TARGET },
      { name: "cookieconsent_status", value: "dismiss", url: TARGET },
    ]);
    await use(context);
    if (violations.length) {
      info.expectedStatus = "passed";
      throw new Error("Browser attempted an out-of-scope request; the request was blocked.");
    }
  },
});
export { expect };

/** Call only after setup and evidence succeed. / Chame somente após preparação e evidências concluídas. */
export async function assertSecure(info: TestInfo, secure: boolean, observation: Record<string, unknown>): Promise<void> {
  const entry = securityCase(info.title.split(" ")[0]);
  const verdict = { id: entry.id, secure, observation, justification: entry.known };
  await evidence(info, secure ? "security-verdict" : "security-finding", verdict);
  info.annotations.push({ type: "security-observation", description: JSON.stringify(sanitize(observation)) });
  await allure.parameter("Security outcome / Resultado de segurança", secure ? "secure / seguro" : "vulnerability reproduced / vulnerabilidade reproduzida");
  if (entry.known) test.fail(true, entry.known.join(" / "));
  expect(secure, `${entry.id}: ${entry.expected[0]}${entry.known ? " [known-vuln]" : ""}`).toBe(true);
}
