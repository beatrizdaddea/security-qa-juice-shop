# BUG-TC-017 — No brute-force protection / Sem proteção contra força bruta

- **Severity / Severidade:** High / Alta
- **Priority / Prioridade:** P1
- **Environment / Ambiente:** Juice Shop 20.2.0; Electron 146 headless; Windows
- **Related case / Caso relacionado:** TC-017
- **OWASP / CWE:** A07:2021 / CWE-307
- **Steps / Passos:** Send 20 failed logins for one local test account. / Envie 20 logins falhos para uma conta de teste local.
- **Expected / Esperado:** Throttling or lockout (HTTP 429/403). / Limitação ou bloqueio (HTTP 429/403).
- **Actual / Obtido:** All 20 attempts completed without protection. / As 20 tentativas terminaram sem proteção.
- **Evidence / Evidência:** `cypress/screenshots/security-api.cy.ts/`
- **Impact / Impacto:** Automated password guessing is not constrained. / Tentativas automatizadas de senha não são limitadas.
- **Suggested remediation / Sugestão de correção:** Add rate limiting, progressive delay, and monitored lockout. / Adicione rate limiting, atraso progressivo e bloqueio monitorado.
