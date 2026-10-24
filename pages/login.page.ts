import type { Locator, Page } from "@playwright/test";

export class LoginPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;

  constructor(private readonly page: Page) {
    this.email = page.getByLabel("Text field for the login email");
    this.password = page.getByLabel("Text field for the login password");
    this.submit = page.getByRole("button", { name: "Login", exact: true });
  }

  async goto(): Promise<void> {
    await this.page.goto("/#/login");
    await this.email.waitFor();
  }

  async login(email: string, password: string): Promise<void> {
    await this.email.fill(email);
    await this.password.fill(password);
    const response = this.page.waitForResponse(
      (r) => r.url().includes("/rest/user/login") && r.request().method() === "POST",
    );
    await this.submit.click();
    return void (await response);
  }
}
