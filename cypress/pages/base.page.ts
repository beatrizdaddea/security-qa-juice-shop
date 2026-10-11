export class BasePage {
  protected visitPath(path: string): void {
    cy.intercept("GET", "**/rest/admin/application-configuration").as("appConfiguration");
    cy.visit(path, {
      onBeforeLoad(window) {
        window.document.cookie = "welcomebanner_status=dismiss; path=/";
        window.document.cookie = "cookieconsent_status=dismiss; path=/";
      },
    });
    cy.wait("@appConfiguration").its("response.statusCode").should("be.oneOf", [200, 304]);
    this.dismissOverlays();
  }

  protected dismissOverlays(): void {
    cy.get("body").then(($body) => {
      if ($body.find('[aria-label="Close Welcome Banner"]').length) {
        cy.get('[aria-label="Close Welcome Banner"]').click({ force: true });
        cy.get(".cdk-overlay-backdrop").should("not.exist");
      }
      if ($body.find("#onetrust-accept-btn-handler").length) {
        cy.get("#onetrust-accept-btn-handler").click();
      }
      if ($body.find(".cc-btn").length) {
        cy.get(".cc-btn").click({ force: true });
      }
    });
  }
}
