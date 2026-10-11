# BUG-TC-008 — Regular user reaches administration route / Usuário comum acessa rota administrativa

- **Severity / Severidade:** High / Alta
- **Priority / Prioridade:** P1
- **Environment / Ambiente:** Juice Shop 20.2.0; Electron 146 headless; Windows
- **Related case / Caso relacionado:** TC-008
- **OWASP / CWE:** A01:2021 / CWE-285
- **Steps / Passos:** Log in as a regular user and navigate to `/#/administration`. / Entre como usuário comum e acesse `/#/administration`.
- **Expected / Esperado:** Redirect or access denial. / Redirecionamento ou acesso negado.
- **Actual / Obtido:** The browser remained on the administration route. / O navegador permaneceu na rota administrativa.
- **Evidence / Evidência:** `cypress/screenshots/juice-shop-ui.cy.ts/TC-008-administration-access-denied.png`
- **Impact / Impacto:** A regular user can reach an administrative surface. / Um usuário comum pode alcançar uma área administrativa.
- **Suggested remediation / Sugestão de correção:** Enforce role authorization in both route guards and server APIs. / Aplique autorização por perfil nos guards e nas APIs do servidor.
