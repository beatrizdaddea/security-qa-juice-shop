import type { Locator, Page } from "@playwright/test";

export class BasketPage {
  readonly rows: Locator;

  constructor(private readonly page: Page) {
    this.rows = page.getByRole("row");
  }

  item(name: string): Locator {
    return this.rows.filter({ hasText: name });
  }
}
