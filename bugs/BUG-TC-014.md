# BUG-TC-014 — Malformed request returns internal error / Requisição malformada retorna erro interno

- **Severity / Severidade:** Medium / Média
- **Priority / Prioridade:** P2
- **Environment / Ambiente:** Juice Shop 20.2.0; Electron 146 headless; Windows
- **Related case / Caso relacionado:** TC-014
- **OWASP / CWE:** A05:2021 / CWE-209
- **Steps / Passos:** Send malformed JSON to `/rest/user/login`. / Envie JSON malformado para `/rest/user/login`.
- **Expected / Esperado:** Generic HTTP 400 response without internals. / Resposta HTTP 400 genérica sem detalhes internos.
- **Actual / Obtido:** HTTP 500 and internal error indicators. / HTTP 500 e indicadores de erro interno.
- **Evidence / Evidência:** `cypress/screenshots/security-api.cy.ts/`
- **Impact / Impacto:** Internal implementation details may aid attackers. / Detalhes internos podem auxiliar atacantes.
- **Suggested remediation / Sugestão de correção:** Normalize parser errors and return sanitized 400 responses. / Normalize erros de parsing e retorne respostas 400 sanitizadas.
