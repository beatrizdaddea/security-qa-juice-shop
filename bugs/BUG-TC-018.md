# BUG-TC-018 — Token remains valid after logout / Token permanece válido após logout

- **Severity / Severidade:** Medium / Média
- **Priority / Prioridade:** P2
- **Environment / Ambiente:** Juice Shop 20.2.0; Electron 146 headless; Windows
- **Related case / Caso relacionado:** TC-018
- **OWASP / CWE:** A07:2021 / CWE-613
- **Steps / Passos:** Log out, then reuse the previous token on the user's basket. / Faça logout e reutilize o token anterior na cesta do usuário.
- **Expected / Esperado:** HTTP 401. / HTTP 401.
- **Actual / Obtido:** HTTP 200; the token remained valid. / HTTP 200; o token permaneceu válido.
- **Evidence / Evidência:** `cypress/screenshots/security-api.cy.ts/`
- **Impact / Impacto:** A stolen token remains usable after the user logs out. / Um token roubado continua utilizável após o logout.
- **Suggested remediation / Sugestão de correção:** Revoke tokens on logout or use short-lived access tokens with server-side revocation. / Revogue tokens no logout ou use tokens curtos com revogação no servidor.
