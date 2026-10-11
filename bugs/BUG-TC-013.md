# BUG-TC-013 — FTP directory is public / Diretório FTP é público

- **Severity / Severidade:** Medium / Média
- **Priority / Prioridade:** P2
- **Environment / Ambiente:** Juice Shop 20.2.0; Electron 146 headless; Windows
- **Related case / Caso relacionado:** TC-013
- **OWASP / CWE:** A05:2021 / CWE-548
- **Steps / Passos:** Request `/ftp` without authentication. / Solicite `/ftp` sem autenticação.
- **Expected / Esperado:** HTTP 401/403/404. / HTTP 401/403/404.
- **Actual / Obtido:** HTTP 200 exposed the directory. / HTTP 200 expôs o diretório.
- **Evidence / Evidência:** `cypress/screenshots/security-api.cy.ts/`
- **Impact / Impacto:** Anonymous users can discover exposed files. / Usuários anônimos podem descobrir arquivos expostos.
- **Suggested remediation / Sugestão de correção:** Remove directory listing and authorize file access. / Remova a listagem e autorize o acesso aos arquivos.
