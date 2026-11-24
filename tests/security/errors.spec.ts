import { details, title } from "./catalog";
import { assertSecure, expect, test } from "./fixtures";

test(title("TC-038"), details("TC-038"), async ({ api }, info) => {
  const response = await api.call("POST", "/rest/user/login", { headers: { "Content-Type": "application/json" }, data: Buffer.from('{"email":') });
  expect([400, 500], "must exercise malformed JSON handling").toContain(response.status());
  const body = await response.text();
  const leakedInternals = /(?:stack|sequelize|node_modules|\.js:\d+|SyntaxError|SELECT\s+.+FROM|\/juice-shop\/)/i.test(body);
  await assertSecure(info, response.status() === 400 && !leakedInternals, { status: response.status(), leakedInternals, scope: "Response disclosure only; server audit logging is not measured. / Somente exposição na resposta; logs de auditoria do servidor não são medidos." });
});
