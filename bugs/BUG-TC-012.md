# BUG-TC-012 — Recommended security headers missing / Cabeçalhos de segurança recomendados ausentes

- **Severity / Severidade:** Medium / Média
- **Priority / Prioridade:** P2
- **Environment / Ambiente:** Juice Shop 20.2.0; Electron 146 headless; Windows
- **Related case / Caso relacionado:** TC-012
- **OWASP / CWE:** A05:2021 / CWE-693
- **Steps / Passos:** Inspect headers returned by `/`. / Inspecione os cabeçalhos retornados por `/`.
- **Expected / Esperado:** CSP, nosniff, frame protection, and Referrer-Policy. / CSP, nosniff, proteção contra frames e Referrer-Policy.
- **Actual / Obtido:** At least one required control was missing or unsafe. / Ao menos um controle exigido estava ausente ou inseguro.
- **Evidence / Evidência:** `cypress/screenshots/security-api.cy.ts/`
- **Impact / Impacto:** Reduced browser-side defense in depth. / Redução da defesa em profundidade no navegador.
- **Suggested remediation / Sugestão de correção:** Configure and test appropriate response headers centrally. / Configure e teste os cabeçalhos adequados de forma centralizada.
