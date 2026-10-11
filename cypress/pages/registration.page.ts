import { BasePage } from "./base.page";

export class RegistrationPage extends BasePage {
  visit(): void {
    this.visitPath("/#/register");
  }

  fillRequiredFields(email: string, password: string): void {
    cy.get("#emailControl").clear().type(email);
    cy.get("#passwordControl").clear().type(password, { log: false });
    cy.get("#repeatPasswordControl").clear({ force: true }).type(password, { force: true, log: false });
    cy.get('mat-select[name="securityQuestion"], mat-select[formcontrolname="securityQuestion"]')
      .first()
      .click({ force: true });
    cy.get("mat-option").first().click();
    cy.get("#securityAnswerControl").clear().type("qa-answer", { log: false });
  }

  submit(): void {
    cy.get("#registerButton").click();
  }

  register(email: string, password: string): void {
    cy.intercept("POST", "**/api/Users").as("registerRequest");
    this.visit();
    this.fillRequiredFields(email, password);
    this.submit();
    cy.wait("@registerRequest").its("response.statusCode").should("be.oneOf", [200, 201]);
    cy.url().should("include", "/login");
  }
}

export const registrationPage = new RegistrationPage();
