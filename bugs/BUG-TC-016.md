# BUG-TC-016 — Weak password accepted / Senha fraca aceita

- **Severity / Severidade:** Medium / Média
- **Priority / Prioridade:** P2
- **Environment / Ambiente:** Juice Shop 20.2.0; Electron 146 headless; Windows
- **Related case / Caso relacionado:** TC-016
- **OWASP / CWE:** A07:2021 / CWE-521
- **Steps / Passos:** Register through the UI with password `12345`. / Cadastre-se pela UI com a senha `12345`.
- **Expected / Esperado:** Registration is blocked with clear guidance. / O cadastro é bloqueado com orientação clara.
- **Actual / Obtido:** Registration succeeded. / O cadastro foi concluído.
- **Evidence / Evidência:** `cypress/screenshots/juice-shop-ui.cy.ts/`
- **Impact / Impacto:** Accounts can be protected by easily guessed passwords. / Contas podem usar senhas fáceis de adivinhar.
- **Suggested remediation / Sugestão de correção:** Enforce a server-side password policy and block common passwords. / Aplique política de senha no servidor e bloqueie senhas comuns.
