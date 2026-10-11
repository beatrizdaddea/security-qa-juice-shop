# BUG-TC-005 — SQL injection bypasses login / Injeção de SQL contorna o login

- **Severity / Severidade:** Critical / Crítica
- **Priority / Prioridade:** P0
- **Environment / Ambiente:** Juice Shop 20.2.0; Electron 146 headless; Windows
- **Related case / Caso relacionado:** TC-005
- **OWASP / CWE:** A03:2021 / CWE-89
- **Steps / Passos:** Send `' OR 1=1--` as the login email with any password. / Envie `' OR 1=1--` como e-mail de login com qualquer senha.
- **Expected / Esperado:** HTTP 400/401 without a token. / HTTP 400/401 sem token.
- **Actual / Obtido:** HTTP 200 with authentication accepted. / HTTP 200 com autenticação aceita.
- **Evidence / Evidência:** `cypress/screenshots/security-api.cy.ts/`
- **Impact / Impacto:** Authentication bypass and unauthorized account access. / Desvio de autenticação e acesso indevido a conta.
- **Suggested remediation / Sugestão de correção:** Use parameterized queries and validate credentials without SQL string composition. / Use consultas parametrizadas e valide credenciais sem concatenar SQL.
