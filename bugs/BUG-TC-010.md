# BUG-TC-010 — Users API exposes sensitive data / API de usuários expõe dados sensíveis

- **Severity / Severidade:** High / Alta
- **Priority / Prioridade:** P1
- **Environment / Ambiente:** Juice Shop 20.2.0; Electron 146 headless; Windows
- **Related case / Caso relacionado:** TC-010
- **OWASP / CWE:** A02:2021 / CWE-200
- **Steps / Passos:** Request `/api/Users` with a regular-user token. / Solicite `/api/Users` com token de usuário comum.
- **Expected / Esperado:** Only authorized, non-sensitive user data. / Apenas dados autorizados e não sensíveis.
- **Actual / Obtido:** Sensitive fields or other users' records were returned. / Campos sensíveis ou registros de outros usuários foram retornados.
- **Evidence / Evidência:** `cypress/screenshots/security-api.cy.ts/`
- **Impact / Impacto:** Confidentiality loss and support for further attacks. / Perda de confidencialidade e apoio a ataques adicionais.
- **Suggested remediation / Sugestão de correção:** Apply object authorization and response allowlists. / Aplique autorização de objeto e listas permitidas de campos na resposta.
