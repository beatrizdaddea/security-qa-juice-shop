import { addMetadata } from "../../utils/allure-meta";
import { newTestUser } from "../../utils/data";
import { AUTH_FILE, expect, test } from "../../fixtures";

test.describe("Functional baseline (Playwright PoC)", () => {
  test("TC-001 valid login", async ({ page, loginPage, user }) => {
    await addMetadata("Functional Baseline", "critical", "Functional");

    await test.step("Submit valid credentials through the login page", async () => {
      await loginPage.goto();
      await loginPage.login(user.email, user.password);
    });

    await test.step("The session is established", async () => {
      await expect(page).not.toHaveURL(/#\/login/);
      await expect.poll(() => page.evaluate(() => localStorage.getItem("token"))).toBeTruthy();
    });
  });

  test("TC-002 user registration", async ({ page, registrationPage }) => {
    await addMetadata("Functional Baseline", "critical", "Functional");
    const user = newTestUser("pw-registration");

    await test.step("Register a unique user through the UI", async () => {
      await registrationPage.goto();
      const status = await registrationPage.register(user.email, user.password);
      expect(status).toBeLessThan(300);
    });

    await test.step("The user is redirected to the login page", async () => {
      await expect(page).toHaveURL(/#\/login/);
    });
  });

  test("TC-003 product search", async ({ productsPage }) => {
    await addMetadata("Functional Baseline", "normal", "Functional");

    await productsPage.goto();
    await test.step("Search for a known product term", async () => {
      await productsPage.search("apple");
    });

    await test.step("Only matching products are listed", async () => {
      await expect(productsPage.product("Apple Juice (1000ml)")).toBeVisible();
      await expect(productsPage.product("Banana Juice (1000ml)")).toHaveCount(0);
    });
  });
});

test.describe("Authenticated flows (storageState)", () => {
  test.use({ storageState: AUTH_FILE });

  test("TC-004 add product to basket", async ({ productsPage, basketPage }) => {
    await addMetadata("Functional Baseline", "critical", "Functional");
    const product = "Apple Juice (1000ml)";

    await productsPage.goto();
    await test.step("Add a product and open the basket", async () => {
      await productsPage.addToBasket(product);
      await productsPage.openBasket();
    });

    await test.step("The product is listed in the basket", async () => {
      await expect(basketPage.item(product)).toBeVisible();
    });
  });
});
