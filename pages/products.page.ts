import type { Locator, Page } from "@playwright/test";

export class ProductsPage {
  readonly openSearch: Locator;
  readonly searchBox: Locator;
  readonly basketButton: Locator;
  readonly products: Locator;

  constructor(private readonly page: Page) {
    this.openSearch = page.getByRole("button", { name: "Open search" });
    this.searchBox = page.locator("#searchQuery").getByRole("textbox");
    this.basketButton = page.getByRole("button", { name: "Show the shopping cart" });
    this.products = page.getByRole("article");
  }

  async goto(): Promise<void> {
    await this.page.goto("/#/search");
    await this.products.first().waitFor();
  }

  async search(term: string): Promise<void> {
    await this.openSearch.click();
    await this.searchBox.fill(term);
    await this.searchBox.press("Enter");
  }

  product(name: string): Locator {
    return this.products.filter({ has: this.page.getByText(name, { exact: true }) });
  }

  async addToBasket(name: string): Promise<void> {
    const added = this.page.waitForResponse(
      (r) => r.url().includes("/api/BasketItems") && r.request().method() === "POST",
    );
    await this.product(name).getByRole("button", { name: "Add to Basket" }).click();
    const response = await added;
    if (!response.ok()) {
      throw new Error(`Adding "${name}" to the basket failed with HTTP ${response.status()}`);
    }
  }

  async openBasket(): Promise<void> {
    await this.basketButton.click();
    await this.page.waitForURL(/#\/basket/);
  }
}
