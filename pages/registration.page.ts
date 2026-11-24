import { expect, type Locator, type Page } from "@playwright/test";
import { SECURITY_ANSWER } from "../utils/data";

export class RegistrationPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly repeatPassword: Locator;
  readonly securityQuestion: Locator;
  readonly securityAnswer: Locator;
  readonly submit: Locator;

  constructor(private readonly page: Page) {
    this.email = page.getByLabel("Email address field");
    this.password = page.getByLabel("Field for the password");
    this.repeatPassword = page.getByLabel("Field to confirm the password");
    this.securityQuestion = page.getByRole("combobox", { name: "Selection list for the security question" });
    this.securityAnswer = page.getByLabel("Field for the answer to the security question");
    this.submit = page.getByRole("button", { name: "Button to complete the registration" });
  }

  async goto(): Promise<void> {
    await this.page.goto("/#/register");
    await this.email.waitFor();
  }

  async register(email: string, password: string): Promise<number> {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.repeatPassword.fill(password);
    // The Material label overlays the select and intercepts pointer events, so
    // the label itself is the accessible click target (no `force: true`).
    await expect(async () => {
      if ((await this.securityQuestion.getAttribute("aria-expanded")) !== "true") {
        await this.page.getByText("Security Question", { exact: true }).click();
      }
      await expect(this.securityQuestion).toHaveAttribute("aria-expanded", "true", { timeout: 2_000 });
    }).toPass({ timeout: 10_000 });
    await this.page.getByRole("option").first().click();
    await this.securityAnswer.fill(SECURITY_ANSWER);

    const response = this.page.waitForResponse(
      (r) => /\/api\/Users\/?(\?.*)?$/.test(r.url()) && r.request().method() === "POST",
    );
    await this.submit.click();
    return (await response).status();
  }
}
