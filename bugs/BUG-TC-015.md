# BUG-TC-015 — Metrics endpoint is public / Endpoint de métricas é público

- **Severity / Severidade:** Medium / Média
- **Priority / Prioridade:** P2
- **Environment / Ambiente:** Juice Shop 20.2.0; Electron 146 headless; Windows
- **Related case / Caso relacionado:** TC-015
- **OWASP / CWE:** A05:2021 / CWE-200
- **Steps / Passos:** Request `/metrics` without authentication. / Solicite `/metrics` sem autenticação.
- **Expected / Esperado:** HTTP 401/403/404. / HTTP 401/403/404.
- **Actual / Obtido:** HTTP 200 exposed operational metrics. / HTTP 200 expôs métricas operacionais.
- **Evidence / Evidência:** `cypress/screenshots/security-api.cy.ts/`
- **Impact / Impacto:** Operational information is available to anonymous users. / Informações operacionais ficam disponíveis a anônimos.
- **Suggested remediation / Sugestão de correção:** Restrict the endpoint to an authenticated monitoring network or role. / Restrinja o endpoint a rede ou perfil autenticado de monitoramento.
