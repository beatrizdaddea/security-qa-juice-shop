import { execFileSync } from "node:child_process";
import { details, title } from "./catalog";
import { assertSecure, auth, decodeJwt, evidence, expect, test } from "./fixtures";
import { LoginPage } from "../../pages/login.page";
import { newTestUser, SECURITY_ANSWER, SECURITY_QUESTION } from "../../utils/data";

test(title("TC-034"), details("TC-034"), async ({ api }, info) => {
  const user = { ...newTestUser("weak-security"), password: "12345" };
  const response = await api.call("POST", "/api/Users", { data: { ...user, passwordRepeat: user.password, securityQuestion: SECURITY_QUESTION, securityAnswer: SECURITY_ANSWER } });
  expect([200, 201, 400, 422], "must be a genuine registration or validation response").toContain(response.status());
  let weakLoginAccepted = false;
  if ([200, 201].includes(response.status())) {
    const login = await api.call("POST", "/rest/user/login", { data: user });
    weakLoginAccepted = login.status() === 200 && Boolean((await login.json()).authentication?.token);
    expect(weakLoginAccepted, "accepted weak registration must be usable").toBe(true);
  }
  await assertSecure(info, [400, 422].includes(response.status()) && !weakLoginAccepted, { registrationStatus: response.status(), weakLoginAccepted });
});

test(title("TC-035"), details("TC-035"), async ({ page, context, api }, info) => {
  const user = await api.register();
  const login = new LoginPage(page);
  await login.goto();
  const responsePromise = page.waitForResponse((response) => response.url().endsWith("/rest/user/login") && response.request().method() === "POST");
  await login.login(user.email, user.password);
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  await expect(page).not.toHaveURL(/#\/login/);
  await expect.poll(async () => (await context.cookies()).filter((cookie) => cookie.name === "token").length).toBe(1);
  const cookies = (await context.cookies()).filter((cookie) => cookie.name === "token");
  expect(cookies.length, "observe the application's real authentication cookie").toBe(1);
  const cookie = cookies[0];
  const scriptReadableToken = await page.evaluate(() => Boolean(localStorage.getItem("token")));
  const flags = { httpOnly: cookie.httpOnly, secure: cookie.secure, sameSite: cookie.sameSite, expires: cookie.expires, scriptReadableToken };
  await evidence(info, "actual UI login request-response and cookie flags", {
    request: { method: response.request().method(), url: response.url(), body: response.request().postDataJSON() },
    response: { status: response.status(), headers: await response.allHeaders(), body: await response.json() }, flags,
  });
  await assertSecure(info, cookie.httpOnly && cookie.secure && ["Lax", "Strict"].includes(cookie.sameSite) && !scriptReadableToken, flags);
});

test(title("TC-036"), details("TC-036"), async ({ customer }, info) => {
  const { iat, exp } = decodeJwt(customer.token);
  const now = Math.floor(Date.now() / 1000);
  const lifetimeSeconds = exp - iat;
  const secure = Number.isFinite(iat) && Number.isFinite(exp) && iat <= now + 30 && exp > now && lifetimeSeconds > 0 && lifetimeSeconds <= 3600;
  await assertSecure(info, secure, { iat, exp: exp ?? "missing / ausente", lifetimeSeconds: Number.isFinite(lifetimeSeconds) ? lifetimeSeconds : "unbounded / ilimitada", maximumLifetimeSeconds: 3600 });
});

test(title("TC-037"), details("TC-037"), async ({ api, customer }, info) => {
  // Use only this Compose service's own signer; never read/export signing keys.
  // Use somente o assinador deste serviço Compose; nunca leia/exporte chaves.
  const program = `
    const fs = require('node:fs');
    const crypto = require('node:crypto');
    const security = require('./build/lib/insecurity');
    const claims = JSON.parse(fs.readFileSync(0, 'utf8'));
    if (claims.data?.role !== 'customer') throw new Error('Customer fixture required');
    const now = Math.floor(Date.now() / 1000);
    const decode = token => JSON.parse(Buffer.from(token.split('.')[1], 'base64url'));
    let control = security.authorize({ data: claims.data });
    const timing = decode(control);
    let expired;
    if (Number.isFinite(timing.exp)) {
      expired = security.authorize({ data: claims.data, iat: now - (timing.exp - timing.iat) - 60 });
    } else {
      control = security.authorize({ data: claims.data, exp: now + 300 });
      expired = security.authorize({ data: claims.data, exp: now - 60 });
    }
    for (const token of [control, expired]) {
      const [header, payload, signature] = token.split('.');
      if (JSON.parse(Buffer.from(header, 'base64url')).alg !== 'RS256' || !crypto.verify('RSA-SHA256', Buffer.from(header + '.' + payload), security.publicKey, Buffer.from(signature, 'base64url'))) throw new Error('Invalid fixture signature');
    }
    if (!(decode(expired).exp < now && decode(control).exp > now)) throw new Error('Invalid fixture expiration');
    process.stdout.write(JSON.stringify({ control, expired }));
  `;
  const output = execFileSync("docker", ["compose", "exec", "-T", "juice-shop", "/nodejs/bin/node", "-e", program], {
    input: JSON.stringify(decodeJwt(customer.token)), encoding: "utf8", timeout: 20_000, windowsHide: true, stdio: ["pipe", "pipe", "pipe"],
  });
  const { control, expired } = JSON.parse(output);
  const expiredClaims = decodeJwt(expired);
  expect(expiredClaims.exp).toBeLessThan(Math.floor(Date.now() / 1000));
  expect(expiredClaims.data.id).toBe(customer.id);
  const path = `/rest/basket/${customer.bid}`;
  const validResponse = await api.call("GET", path, { headers: auth({ token: control }) });
  expect(validResponse.status(), "fresh control signed with the identical signer must work").toBe(200);
  expect((await validResponse.json()).data.id).toBe(customer.bid);
  const response = await api.call("GET", path, { headers: auth({ token: expired }) });
  expect(response.status(), "server errors do not prove expiration enforcement").toBeLessThan(500);
  await assertSecure(info, [401, 403].includes(response.status()), { controlStatus: validResponse.status(), expiredStatus: response.status(), expiredAt: expiredClaims.exp, signatureVerified: true });
});
