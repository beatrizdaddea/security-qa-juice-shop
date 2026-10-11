# BUG-TC-006 — Search interprets HTML / Busca interpreta HTML

- **Severity / Severidade:** High / Alta
- **Priority / Prioridade:** P1
- **Environment / Ambiente:** Juice Shop 20.2.0; Electron 146 headless; Windows
- **Related case / Caso relacionado:** TC-006
- **OWASP / CWE:** A03:2021 / CWE-79
- **Steps / Passos:** Search for `<b>qa-marker</b>`. / Busque por `<b>qa-marker</b>`.
- **Expected / Esperado:** The marker is rendered only as text. / O marcador é exibido apenas como texto.
- **Actual / Obtido:** A rendered `<b>` element containing the marker was found. / Foi encontrado um elemento `<b>` renderizado com o marcador.
- **Evidence / Evidência:** `cypress/screenshots/juice-shop-ui.cy.ts/`
- **Impact / Impacto:** Untrusted search input can be interpreted as markup. / Entrada não confiável da busca pode ser interpretada como marcação.
- **Suggested remediation / Sugestão de correção:** Contextually encode output and avoid unsafe HTML rendering. / Codifique a saída conforme o contexto e evite renderização insegura de HTML.
