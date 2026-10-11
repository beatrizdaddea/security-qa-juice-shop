import { administrationPage } from "../../pages/administration.page";
import { authPage } from "../../pages/auth.page";
import { productsPage } from "../../pages/products.page";
import { registrationPage } from "../../pages/registration.page";
import { addSecurityMetadata, assertSecure, securityStep } from "../../support/security";

const PASSWORD = "Qa!Secure12345";

function uniqueEmail(prefix: string): string {
  return `${prefix}.${Date.now()}.${Cypress._.random(1000, 9999)}@example.com`;
}

function createUser(email: string, password = PASSWORD): Cypress.Chainable<Cypress.Response<unknown>> {
  return cy.request({
    method: "POST",
    url: "/api/Users",
    failOnStatusCode: false,
    body: {
      email,
      password,
      passwordRepeat: password,
      securityQuestion: { id: 1, question: "Your eldest siblings middle name?" },
      securityAnswer: "qa-answer",
    },
  }).then((response) => {
    expect(response.status).to.be.oneOf([200, 201]);
  });
}

describe("OWASP Juice Shop UI cases", () => {
  let regularUser: string;

  before(() => {
    regularUser = uniqueEmail("ui-user");
    createUser(regularUser);
  });

  it("TC-001 valid login", () => {
    addSecurityMetadata("Functional Baseline", "critical", "Functional");
    securityStep("Submit valid credentials through the login page");
    authPage.login(regularUser, PASSWORD);
    cy.screenshot("TC-001-valid-login");
    cy.window().its("localStorage.token").should("be.a", "string").and("not.be.empty");
  });

  it("TC-002 user registration", () => {
    addSecurityMetadata("Functional Baseline", "critical", "Functional");
    const email = uniqueEmail("ui-registration");
    securityStep("Register a unique user through the UI");
    registrationPage.register(email, PASSWORD);
    cy.screenshot("TC-002-registration-success");
  });

  it("TC-003 product search", () => {
    addSecurityMetadata("Functional Baseline", "normal", "Functional");
    securityStep("Search for a known product term");
    productsPage.visit();
    productsPage.search("apple");
    cy.screenshot("TC-003-product-search");
    cy.get("mat-card").should("have.length.greaterThan", 0).and("contain.text", "Apple");
  });

  it("TC-004 add product to basket", () => {
    addSecurityMetadata("Functional Baseline", "critical", "Functional");
    authPage.loginWithSession(regularUser, PASSWORD);
    securityStep("Add the first visible product and open the basket");
    productsPage.visit();
    productsPage.addFirstProductToBasket();
    productsPage.openBasket();
    cy.screenshot("TC-004-product-in-basket");
    cy.get("mat-row, mat-table, .mat-mdc-table").should("contain.text", "1");
  });

  it("TC-006 search input is treated as text and executes no script", () => {
    addSecurityMetadata("Injection", "critical", "A03:2021");
    const marker = "<b>qa-marker</b>";
    let alertCalled = false;
    cy.on("window:alert", () => { alertCalled = true; });

    securityStep("Enter a harmless HTML marker in the search field");
    productsPage.visit();
    productsPage.search(marker);
    cy.get("#searchQuery input").should("have.value", marker);
    cy.get("body").then(($body) => {
      const interpretedHtml = $body.find("b").toArray().some((element) => element.textContent?.includes("qa-marker"));
      assertSecure(
        !alertCalled && !interpretedHtml,
        "bugs/BUG-TC-006.md",
        "Search input was interpreted as HTML or executed script content.",
      );
    });
    cy.screenshot("TC-006-search-input-encoded");
  });

  it("TC-008 regular user cannot access administration", () => {
    addSecurityMetadata("Broken Access Control", "critical", "A01:2021");
    authPage.loginWithSession(regularUser, PASSWORD);
    securityStep("Navigate directly to the administration route");
    administrationPage.visitDirectly();
    cy.screenshot("TC-008-administration-access-denied");
    cy.url().then((url) => {
      const denied = !url.includes("/administration");
      assertSecure(denied, "bugs/BUG-TC-008.md", "A regular user remained on the administration route.");
    });
    cy.contains(/user administration|registered users/i).should("not.exist");
  });

  it("TC-016 weak password policy rejects a five-character password", () => {
    addSecurityMetadata("Identification and Authentication Failures", "normal", "A07:2021");
    const email = uniqueEmail("weak-password");
    securityStep("Attempt registration with the weak password 12345");
    cy.intercept("POST", "**/api/Users").as("weakRegistration");
    registrationPage.visit();
    registrationPage.fillRequiredFields(email, "12345");

    cy.get("#registerButton").then(($button) => {
      if ($button.is(":disabled")) {
        expect($button).to.be.disabled;
        return;
      }

      cy.wrap($button).click();
      cy.wait("@weakRegistration").then(({ response }) => {
        const rejected = Boolean(response && response.statusCode >= 400);
        // Known failure is tracked in bugs/BUG-TC-016.md when reproduced.
        assertSecure(rejected, "bugs/BUG-TC-016.md", "Registration accepted the weak password 12345.");
      });
    });
    cy.screenshot("TC-016-weak-password-rejected");
  });
});
