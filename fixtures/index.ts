import { test as base } from "@playwright/test";
import { BasketPage } from "../pages/basket.page";
import { LoginPage } from "../pages/login.page";
import { ProductsPage } from "../pages/products.page";
import { RegistrationPage } from "../pages/registration.page";
import { registerUser } from "../utils/api";
import { newTestUser, type TestUser } from "../utils/data";
import { AUTH_FILE, BID_STORAGE_KEY } from "./constants";

interface Fixtures {
  /** A freshly registered user (API), unique per test. */
  user: TestUser;
  loginPage: LoginPage;
  registrationPage: RegistrationPage;
  productsPage: ProductsPage;
  basketPage: BasketPage;
}

export { AUTH_FILE };

export const test = base.extend<Fixtures>({
  // Dismiss the welcome banner / cookie notice and restore the basket id that
  // storageState cannot carry (it lives in sessionStorage).
  context: async ({ context, baseURL }, use) => {
    await context.addCookies([
      { name: "welcomebanner_status", value: "dismiss", url: baseURL! },
      { name: "cookieconsent_status", value: "dismiss", url: baseURL! },
    ]);
    await context.addInitScript((key) => {
      const bid = window.localStorage.getItem(key);
      if (bid) window.sessionStorage.setItem("bid", bid);
    }, BID_STORAGE_KEY);
    await use(context);
  },

  user: async ({ request }, use, testInfo) => {
    const user = newTestUser(`pw-${testInfo.workerIndex}`);
    await registerUser(request, user);
    await use(user);
  },

  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  registrationPage: async ({ page }, use) => use(new RegistrationPage(page)),
  productsPage: async ({ page }, use) => use(new ProductsPage(page)),
  basketPage: async ({ page }, use) => use(new BasketPage(page)),
});

export { expect } from "@playwright/test";
