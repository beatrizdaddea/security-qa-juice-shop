# BUG-TC-007 — Basket IDOR / IDOR na cesta

- **Severity / Severidade:** High / Alta
- **Priority / Prioridade:** P1
- **Environment / Ambiente:** Juice Shop 20.2.0; Electron 146 headless; Windows
- **Related case / Caso relacionado:** TC-007
- **OWASP / CWE:** A01:2021 / CWE-639
- **Steps / Passos:** Request user B's basket ID with user A's token. / Solicite o ID da cesta de B com o token de A.
- **Expected / Esperado:** HTTP 401/403/404 without basket data. / HTTP 401/403/404 sem dados da cesta.
- **Actual / Obtido:** HTTP 200 exposed the other basket. / HTTP 200 expôs a outra cesta.
- **Evidence / Evidência:** `cypress/screenshots/security-api.cy.ts/`
- **Impact / Impacto:** Unauthorized access to another user's basket. / Acesso indevido à cesta de outro usuário.
- **Suggested remediation / Sugestão de correção:** Enforce basket ownership server-side for every request. / Valide a propriedade da cesta no servidor em cada requisição.
