import { details, title } from "./catalog";
import { assertSecure, auth, denied, evidence, expect, test, type Customer } from "./fixtures";
import { LoginPage } from "../../pages/login.page";

for (const [id, authenticated] of [["TC-019", false], ["TC-020", true]] as const) {
  test(title(id), details(id), async ({ page, api }, info) => {
    let customer: Customer | undefined;
    if (authenticated) {
      customer = await api.customer();
      const login = new LoginPage(page);
      await login.goto();
      await login.login(customer.user.email, customer.user.password);
      await expect(page).not.toHaveURL(/#\/login/);
    }
    await page.goto("/#/administration");
    const forbidden = page.getByText("You are not allowed to access this page!");
    const administration = page.getByText("User Administration", { exact: true });
    await expect(forbidden.or(administration).first()).toBeVisible();
    const administrationVisible = await administration.isVisible();
    const response = await api.call("GET", "/api/Users", { headers: customer ? auth(customer) : {} });
    await evidence(info, "administration rendered state", { url: page.url(), administrationVisible, text: await page.locator("body").innerText() });
    await assertSecure(info, !administrationVisible && [401, 403].includes(response.status()), {
      administrationVisible, usersApiStatus: response.status(), route: page.url(),
    });
  });
}

test(title("TC-021"), details("TC-021"), async ({ api }, info) => {
  const a = await api.customer();
  const b = await api.customer();
  expect(a.id).not.toBe(b.id);
  expect(a.bid).not.toBe(b.bid);
  const owner = await api.call("GET", `/rest/basket/${b.bid}`, { headers: auth(b) });
  expect(owner.status()).toBe(200);
  expect((await owner.json()).data.id).toBe(b.bid);
  const response = await api.call("GET", `/rest/basket/${b.bid}`, { headers: auth(a) });
  const body = response.headers()["content-type"]?.includes("json") ? await response.json() : {};
  await assertSecure(info, denied(response.status()) && body.data?.id !== b.bid, {
    status: response.status(), ownerBasket: b.bid, returnedBasket: body.data?.id,
  });
});

test(title("TC-022"), details("TC-022"), async ({ api }, info) => {
  const a = await api.customer();
  const b = await api.customer();
  expect(a.id).not.toBe(b.id);
  const added = await api.call("POST", "/api/BasketItems", { headers: auth(b), data: { BasketId: b.bid, ProductId: 1, quantity: 1 } });
  expect([200, 201]).toContain(added.status());
  const checkout = await api.call("POST", `/rest/basket/${b.bid}/checkout`, { headers: auth(b), data: { deliveryMethodId: 1 } });
  expect(checkout.status()).toBe(200);
  const { orderConfirmation } = await checkout.json();
  expect(orderConfirmation).toEqual(expect.any(String));
  const path = `/rest/track-order/${encodeURIComponent(orderConfirmation)}`;
  const owner = await api.call("GET", path, { headers: auth(b) });
  expect(owner.status()).toBe(200);
  const ownBody = await owner.json();
  expect(ownBody.data).toHaveLength(1);
  const ownOrder = ownBody.data[0];
  expect(ownOrder.orderId).toBe(orderConfirmation);
  expect(ownOrder._id).toEqual(expect.any(String));
  expect(ownOrder.products).toEqual(expect.arrayContaining([expect.objectContaining({ id: 1, quantity: 1 })]));
  const response = await api.call("GET", path, { headers: auth(a) });
  const otherBody = response.headers()["content-type"]?.includes("json") ? await response.json() : {};
  const exposed = Array.isArray(otherBody.data) && otherBody.data.some((order: { _id?: string; products?: unknown[] }) => order._id === ownOrder._id && Array.isArray(order.products) && order.products.length > 0);
  await assertSecure(info, denied(response.status()) && !exposed, { status: response.status(), anotherCustomersOrderReturned: exposed });
});
