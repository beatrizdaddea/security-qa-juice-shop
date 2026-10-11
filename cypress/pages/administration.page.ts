import { BasePage } from "./base.page";

export class AdministrationPage extends BasePage {
  visitDirectly(): void {
    this.visitPath("/#/administration");
  }
}

export const administrationPage = new AdministrationPage();
