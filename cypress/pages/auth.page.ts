import { BasePage } from "./base.page";

export class AuthPage extends BasePage {
  visit(): void {
    this.visitPath("/#/login");
  }

  login(email: string, password: string): void {
    cy.intercept("POST", "**/rest/user/login").as("loginRequest");
    this.visit();
    cy.get("#email").clear().type(email);
    cy.get("#password").clear().type(password, { log: false });
    cy.get("#loginButton").click();
    cy.wait("@loginRequest").its("response.statusCode").should("eq", 200);
    cy.url().should("not.include", "/login");
  }

  loginWithSession(email: string, password: string): void {
    cy.session(["juice-shop-user", email], () => this.login(email, password), {
      validate: () => {
        cy.window().its("localStorage.token").should("be.a", "string").and("not.be.empty");
      },
    });
  }
}

export const authPage = new AuthPage();
