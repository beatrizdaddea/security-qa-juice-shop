import { addMetadata } from "../../utils/allure-meta";
import { expect, test } from "../../fixtures";

test.describe("Access control (Playwright PoC)", () => {
  test("TC-009 protected endpoints require authentication", async ({ request }) => {
    await addMetadata("Broken Access Control", "critical", "A01:2021");

    const response = await test.step("Request a protected basket without an authorization header", () =>
      request.get("/rest/basket/1"),
    );

    expect([401, 403]).toContain(response.status());
  });
});
