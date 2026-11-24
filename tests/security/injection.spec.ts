import { details, title } from "./catalog";
import { assertSecure, evidence, expect, test } from "./fixtures";
import { ProductsPage } from "../../pages/products.page";
import { uniqueEmail } from "../../utils/data";

test(title("TC-031"), details("TC-031"), async ({ api }, info) => {
  const invalid = await api.call("POST", "/rest/user/login", { data: { email: uniqueEmail("invalid-security"), password: "invalid-training-control" } });
  expect([400, 401, 403]).toContain(invalid.status());
  const response = await api.call("POST", "/rest/user/login", { data: { email: "' OR 1=1--", password: "local-training-only" } });
  expect(response.status(), "server errors are not authentication bypass").toBeLessThan(500);
  const body = await response.json();
  const tokenIssued = Boolean(body.authentication?.token);
  if (response.status() === 200) expect(tokenIssued, "bypass must issue a real token").toBe(true);
  await assertSecure(info, [400, 401, 403].includes(response.status()) && !tokenIssued, { status: response.status(), tokenIssued });
});

test(title("TC-032"), details("TC-032"), async ({ page }, info) => {
  const products = new ProductsPage(page);
  const marker = '<b data-security-marker="encoding">qa-security-encoding</b>';
  const responsePromise = page.waitForResponse((response) => new URL(response.url()).pathname === "/rest/products/search");
  await products.goto();
  const response = await responsePromise;
  await products.search(marker);
  expect(response.status()).toBe(200);
  const searchValue = page.locator("#searchValue");
  await expect(searchValue).toContainText("qa-security-encoding");
  const state = await searchValue.evaluate((element) => ({ text: element.textContent, html: element.innerHTML, interpreted: Boolean(element.querySelector('b[data-security-marker="encoding"]')) }));
  await evidence(info, "search encoding request-response and DOM", { request: { method: "GET", url: response.url() }, response: { status: response.status(), body: await response.json() }, browserRoute: page.url(), submittedSearch: marker, state });
  await assertSecure(info, !state.interpreted && Boolean(state.text?.includes(marker)), state);
});

test(title("TC-033"), details("TC-033"), async ({ page }, info) => {
  const products = new ProductsPage(page);
  const marker = "qa-security-xss";
  const payload = `<iframe src="javascript:alert('${marker}')"></iframe>`;
  const dialogs: string[] = [];
  page.on("dialog", async (dialog) => { dialogs.push(dialog.message()); await dialog.dismiss(); });
  const responsePromise = page.waitForResponse((response) => new URL(response.url()).pathname === "/rest/products/search");
  await products.goto();
  const response = await responsePromise;
  await products.search(payload);
  expect(response.status()).toBe(200);
  await expect(page.locator("#searchValue")).toBeVisible();
  await expect.poll(() => new URLSearchParams(page.url().split("?")[1]).get("q")).toBe(payload);
  await page.waitForFunction(() => {
    const frame = document.querySelector<HTMLIFrameElement>("#searchValue iframe");
    return !frame || frame.contentDocument?.readyState === "complete";
  });
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  const state = { executed: dialogs.includes(marker), dialogs, executableFrames: await page.locator('#searchValue iframe[src^="javascript:"]').count(), html: await page.locator("#searchValue").innerHTML() };
  await evidence(info, "search XSS request-response and execution", { request: { method: "GET", url: response.url() }, response: { status: response.status(), body: await response.json() }, browserRoute: page.url(), submittedSearch: payload, state });
  await assertSecure(info, !state.executed && state.executableFrames === 0, state);
});
