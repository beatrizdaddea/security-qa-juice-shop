# Allure Publication Policy / Política de Publicação do Allure

## 1. Scope / Escopo

### English

This policy governs publication of the Allure report generated from Cypress executions against the local or CI-hosted OWASP Juice Shop instance at `http://localhost:3000`.

The following MAY be published:

- The latest sanitized Allure HTML report.
- Test case names, statuses, severity, OWASP references and summarized findings.
- Sanitized screenshots that contain no secrets or personal data.
- Links to repository bug reports and documented test evidence.

The following MUST NOT be published:

- Credentials, passwords, access tokens, JWTs or `Authorization` headers.
- Cookies, session identifiers or other authentication material.
- Real email addresses, personal data or third-party data.
- Raw request/response logs containing sensitive values.
- Videos or artifacts that expose secrets, private data or uncontrolled system details.

All published material must remain limited to the controlled Juice Shop test environment.

### PT-BR

Esta política define a publicação do relatório Allure gerado a partir de execuções Cypress contra a instância local ou de CI do OWASP Juice Shop em `http://localhost:3000`.

Pode ser publicado:

- O relatório HTML Allure mais recente e sanitizado.
- Nomes dos casos, status, severidade, referências OWASP e achados resumidos.
- Screenshots sanitizados, sem segredos ou dados pessoais.
- Links para os bugs e evidências documentados no repositório.

É proibido publicar:

- Credenciais, senhas, tokens, JWTs ou cabeçalhos `Authorization`.
- Cookies, identificadores de sessão ou outro material de autenticação.
- E-mails reais, dados pessoais ou dados de terceiros.
- Logs brutos de requisições/respostas com valores sensíveis.
- Vídeos ou artefatos que exponham segredos, dados privados ou detalhes de sistemas não controlados.

Todo material publicado deve permanecer limitado ao ambiente controlado de testes do Juice Shop.

## 2. Disclosure / Divulgação

### English

The following notice MUST be displayed in the published Allure report and in the README:

> This report was generated from tests against OWASP Juice Shop, a deliberately vulnerable training application, running in a local or controlled CI environment. No real production system was tested or affected. Findings describe known Juice Shop vulnerabilities and are documented for educational and QA purposes only.

Known Juice Shop vulnerabilities are intentionally present, publicly documented by the project, and must not be presented as newly discovered vulnerabilities in a real system.

### PT-BR

O aviso abaixo DEVE ser exibido no relatório Allure publicado e no README:

> Este relatório foi gerado a partir de testes contra o OWASP Juice Shop, uma aplicação de treinamento propositalmente vulnerável, executada em ambiente local ou CI controlado. Nenhum sistema real de produção foi testado ou afetado. Os achados descrevem vulnerabilidades conhecidas do Juice Shop e são documentados exclusivamente para fins educacionais e de QA.

As vulnerabilidades conhecidas do Juice Shop são intencionais e documentadas publicamente pelo projeto. Elas não devem ser apresentadas como vulnerabilidades novas descobertas em um sistema real.

## 3. Retention and takedown / Retenção e remoção

### English

- GitHub Pages publishes only the most recent report from `main`; each publication overwrites the previous one.
- The recommended Allure history is the last **10 executions**. This provides short-term trend visibility without retaining unnecessary test data. The history must contain only sanitized summaries.
- GitHub Actions artifacts should use `retention-days: 14`, unless a repository owner approves a different period for a documented reason.
- To remove the public report quickly, disable GitHub Pages in repository settings and remove or replace the Pages deployment. Also delete the corresponding Pages artifact/deployment when the hosting configuration provides that option.
- If sensitive data is discovered, stop publication, remove the deployment, rotate any exposed secret, and record the incident before republishing a sanitized report.

### PT-BR

- O GitHub Pages publica apenas o relatório mais recente da branch `main`; cada publicação sobrescreve a anterior.
- A retenção recomendada no histórico Allure é de **10 execuções**. Isso permite acompanhar tendências de curto prazo sem manter dados desnecessários. O histórico deve conter apenas resumos sanitizados.
- Os artifacts do GitHub Actions devem usar `retention-days: 14`, salvo aprovação do responsável pelo repositório para outro período justificado.
- Para remover rapidamente o relatório público, desabilite o GitHub Pages nas configurações do repositório e remova ou substitua o deployment do Pages. Remova também o artifact/deployment correspondente quando a configuração de hospedagem oferecer essa opção.
- Se um dado sensível for encontrado, interrompa a publicação, remova o deployment, faça a rotação de qualquer segredo exposto e registre o incidente antes de publicar novamente um relatório sanitizado.

## 4. Sanitization checklist / Checklist de sanitização

### English

Before every publication, the reviewer MUST:

- [ ] Inspect all files under `allure-results/` and the generated report.
- [ ] Search for `Authorization`, `Bearer`, `token`, `password`, `cookie`, `session` and similar authentication terms.
- [ ] Confirm that no credential, JWT, cookie value or raw authorization header is present.
- [ ] Confirm that email addresses are limited to approved test domains such as `example.com`.
- [ ] Remove real emails, personal data, third-party data and uncontrolled hostnames.
- [ ] Review screenshots and attachments individually for secrets, tokens and private data.
- [ ] Confirm that every URL targets only `http://localhost:3000` or an approved CI representation of the same controlled application.
- [ ] Re-run the scan after sanitization and record the reviewer and date.

Example PowerShell scan (review matches manually; do not publish the output):

```powershell
Get-ChildItem -Recurse allure-results | Select-String -Pattern 'Authorization|Bearer|token|password|cookie|session|[A-Za-z0-9._%+-]+@(?!example\.com\b)[A-Za-z0-9.-]+\.[A-Za-z]{2,}'
```

### PT-BR

Antes de cada publicação, o revisor DEVE:

- [ ] Inspecionar todos os arquivos de `allure-results/` e o relatório gerado.
- [ ] Procurar `Authorization`, `Bearer`, `token`, `password`, `cookie`, `session` e termos de autenticação semelhantes.
- [ ] Confirmar que não há credenciais, JWTs, cookies ou cabeçalhos de autorização brutos.
- [ ] Confirmar que os e-mails estão limitados a domínios de teste aprovados, como `example.com`.
- [ ] Remover e-mails reais, dados pessoais, dados de terceiros e hosts não controlados.
- [ ] Revisar individualmente screenshots e anexos em busca de segredos, tokens e dados privados.
- [ ] Confirmar que toda URL aponta somente para `http://localhost:3000` ou para uma representação CI aprovada da mesma aplicação controlada.
- [ ] Reexecutar a varredura após a sanitização e registrar revisor e data.

Exemplo de varredura em PowerShell (revisar os resultados manualmente; não publicar a saída):

```powershell
Get-ChildItem -Recurse allure-results | Select-String -Pattern 'Authorization|Bearer|token|password|cookie|session|[A-Za-z0-9._%+-]+@(?!example\.com\b)[A-Za-z0-9.-]+\.[A-Za-z]{2,}'
```

## 5. Responsibilities and review / Responsabilidades e revisão

### English

- The test author prepares the report and performs the first sanitization pass.
- A repository owner or designated QA/security reviewer approves publication.
- No report may be published without a recorded reviewer and review date.
- This policy is reviewed every six months and whenever the repository, hosting model or data classification changes.

### PT-BR

- O autor dos testes prepara o relatório e realiza a primeira sanitização.
- O responsável pelo repositório ou um revisor designado de QA/segurança aprova a publicação.
- Nenhum relatório pode ser publicado sem revisor e data de revisão registrados.
- Esta política deve ser revisada a cada seis meses e sempre que mudarem o repositório, o modelo de hospedagem ou a classificação dos dados.

## 6. Risks and alternatives / Riscos e alternativas

### English

GitHub Pages is public and does not provide access control suitable for confidential reports. A public repository also makes the report and its history discoverable. The safer alternatives are:

- Publish the report only as a private GitHub Actions artifact.
- Publish only sanitized screenshots and summaries in the README.
- Keep detailed evidence in a private system and publish aggregated results only.

### PT-BR

O GitHub Pages é público e não oferece controle de acesso adequado para relatórios confidenciais. Um repositório público também torna o relatório e seu histórico localizáveis. Alternativas mais seguras:

- Publicar o relatório somente como artifact privado do GitHub Actions.
- Publicar apenas screenshots e resumos sanitizados no README.
- Manter evidências detalhadas em sistema privado e publicar somente resultados agregados.

## Decisions required / Decisões necessárias

### English

The repository owner must answer:

1. Should the Allure history retain the proposed 10 executions, or another number?
2. Should videos ever be published after sanitization, or should videos always remain private?
3. Is the proposed 14-day retention for GitHub Actions artifacts acceptable?
4. Who is the named approver for each GitHub Pages publication?
5. Should GitHub Pages be public, or should reports remain private Actions artifacts?
6. Which test email domain(s) are approved besides `example.com`, if any?

### PT-BR

O responsável pelo repositório precisa responder:

1. O histórico Allure deve manter as 10 execuções propostas ou outra quantidade?
2. Vídeos poderão ser publicados após sanitização ou devem permanecer sempre privados?
3. A retenção proposta de 14 dias para artifacts do GitHub Actions é aceitável?
4. Quem será o aprovador nominal de cada publicação no GitHub Pages?
5. O GitHub Pages será público ou os relatórios ficarão apenas como artifacts privados do Actions?
6. Quais domínios de e-mail de teste, além de `example.com`, são aprovados, se houver?
