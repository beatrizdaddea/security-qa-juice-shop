import { BasePage } from "./base.page";

export class ProductsPage extends BasePage {
  visit(): void {
    cy.intercept("GET", "**/rest/products/search**").as("initialProductSearch");
    this.visitPath("/#/search");
    cy.wait("@initialProductSearch").its("response.statusCode").should("be.oneOf", [200, 304]);
    cy.get("mat-card").should("have.length.greaterThan", 0);
  }

  search(term: string): void {
    cy.get("#searchQuery").click();
    cy.get("#searchQuery input").clear().type(`${term}{enter}`);
    cy.get("#searchQuery input").should("have.value", term);
  }

  addFirstProductToBasket(): void {
    cy.intercept("POST", "**/api/BasketItems").as("addBasketItem");
    cy.get('button[aria-label^="Add to Basket"]').first().click();
    cy.wait("@addBasketItem").its("response.statusCode").should("be.oneOf", [200, 201]);
  }

  openBasket(): void {
    cy.get('button[aria-label="Show the shopping cart"]').click();
    cy.url().should("include", "/basket");
  }
}

export const productsPage = new ProductsPage();
