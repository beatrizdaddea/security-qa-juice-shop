# Security QA — OWASP Juice Shop

## Playwright security / Segurança com Playwright

Run `npm run pw:security` for the 20 OWASP-mapped security checks; generate their separate Allure report in Docker with `npm run pw:security:allure`. See [the security matrix and execution instructions](docs/SECURITY-TESTS.md) for actual results, known vulnerabilities and scope limits.

Execute `npm run pw:security` para as 20 verificações de segurança mapeadas ao OWASP; gere o relatório Allure separado em Docker com `npm run pw:security:allure`. Consulte [a matriz de segurança e as instruções de execução](docs/SECURITY-TESTS.md) para resultados reais, vulnerabilidades conhecidas e limites de escopo.

## English

### Project summary

This repository is a security-focused QA portfolio for OWASP Juice Shop 20.2.0 running locally at `http://localhost:3000`. It contains a bilingual test plan, 18 manual test cases, Cypress UI/API automation, defect templates, execution reporting, Allure integration, and an optional OWASP ZAP baseline scan.

### Ethical notice

OWASP Juice Shop is deliberately vulnerable. Run every test and scan only against the local, controlled instance defined in this repository. Never target a third-party system or any environment without explicit written authorization. The Cypress base URL and ZAP script are restricted to `http://localhost:3000`.

### Stack

- Cypress + TypeScript for UI and API checks
- Allure Report through `allure-cypress`
- Docker Compose for OWASP Juice Shop
- Markdown for plans, cases, reports, and bugs
- OWASP ZAP baseline scan through Docker

### Repository structure

| Path | Purpose |
| --- | --- |
| `docs/` | Test plan, cases, automation matrix, and execution report |
| `bugs/` | One Markdown file per confirmed bug plus a bilingual template |
| `cypress/e2e/api/` | Cypress API security cases |
| `cypress/e2e/ui/` | Cypress UI cases |
| `cypress/pages/` | Page Objects |
| `cypress/support/` | Allure setup and shared security helpers |
| `evidence/` | Approved test evidence |
| `allure/` | Allure categories and environment metadata sources |
| `scripts/` | Local-only security tooling |
| `reports/` | Generated ZAP HTML reports (ignored by Git) |

### Run locally

```bash
docker compose up -d
npm install
npm run cy:run
npm run allure:generate
npm run allure:open
```

Run only one automation layer with `npm run test:api` or `npm run test:ui`. Allure results are written to `allure-results/`; the generated site is written to `allure-report/`.

### Execution summary

The template in [docs/execution-report.md](docs/execution-report.md) does not yet contain completed totals. Record passed, failed, blocked, and not-run counts there after the formal execution. This README intentionally makes no final pass-rate claim.

### ZAP baseline

Start the local DAST stack and run the passive baseline:

```bash
npm run sec:zap:up
npm run sec:zap:baseline
npm run sec:zap:report
```

The daemon accepts only `http://localhost:3000` as scan target and exports HTML, JSON and SARIF to `reports/security/zap/`. See [docs/DAST.md](docs/DAST.md) for proxy-fed Playwright, justified rule exceptions, nightly active scanning and cleanup.

### Key learnings

- Secure expected behavior must remain the assertion even when a deliberately vulnerable application fails it.
- Test IDs, Allure metadata, evidence, and bug links provide traceability.
- Local-only guards reduce the risk of accidental testing outside the lab.

### Next steps

- Complete a formal run and fill the execution report.
- Review and stabilize selectors across supported browsers.
- Pin the Juice Shop image by immutable digest.
- Review the publication policy before enabling the optional Pages deployment. [Allure publication policy](docs/publication-policy.md)

---

## Português (PT-BR)

### Resumo do projeto

Este repositório é um portfólio de QA com foco em segurança para o OWASP Juice Shop 20.2.0 executado localmente em `http://localhost:3000`. Ele contém plano de testes bilíngue, 18 casos manuais, automação Cypress de UI/API, modelos de defeito, relatório de execução, integração Allure e um scan baseline opcional do OWASP ZAP.

### Aviso ético

O OWASP Juice Shop é propositalmente vulnerável. Execute todos os testes e scans somente contra a instância local e controlada definida neste repositório. Nunca teste sistemas de terceiros ou ambientes sem autorização explícita por escrito. A URL-base do Cypress e o script do ZAP estão restritos a `http://localhost:3000`.

### Stack

- Cypress + TypeScript para verificações de UI e API
- Allure Report por meio do `allure-cypress`
- Docker Compose para o OWASP Juice Shop
- Markdown para planos, casos, relatórios e bugs
- Scan baseline do OWASP ZAP via Docker

### Estrutura do repositório

| Caminho | Finalidade |
| --- | --- |
| `docs/` | Plano, casos, matriz de automação e relatório de execução |
| `bugs/` | Um Markdown por bug confirmado e um template bilíngue |
| `cypress/e2e/api/` | Casos de segurança de API em Cypress |
| `cypress/e2e/ui/` | Casos de UI em Cypress |
| `cypress/pages/` | Page Objects |
| `cypress/support/` | Configuração Allure e utilitários compartilhados |
| `evidence/` | Evidências de teste aprovadas |
| `allure/` | Fontes das categorias e metadados de ambiente do Allure |
| `scripts/` | Ferramentas de segurança limitadas ao ambiente local |
| `reports/` | Relatórios HTML gerados pelo ZAP (ignorados pelo Git) |

### Como executar

```bash
docker compose up -d
npm install
npm run cy:run
npm run allure:generate
npm run allure:open
```

Execute somente uma camada com `npm run test:api` ou `npm run test:ui`. Os resultados Allure são gravados em `allure-results/`; o site gerado fica em `allure-report/`.

### Resumo dos resultados

O template em [docs/execution-report.md](docs/execution-report.md) ainda não contém totais preenchidos. Registre ali as quantidades de casos que passaram, falharam, foram bloqueados ou não executados após a execução formal. Este README não afirma uma taxa final de sucesso.

### ZAP baseline

Suba a stack DAST local e execute o baseline passivo:

```bash
npm run sec:zap:up
npm run sec:zap:baseline
npm run sec:zap:report
```

O daemon aceita somente `http://localhost:3000` como alvo e exporta HTML, JSON e SARIF para `reports/security/zap/`. Consulte [docs/DAST.md](docs/DAST.md) para Playwright pelo proxy, exceções justificadas, scan ativo noturno e limpeza.

### Principais aprendizados

- O comportamento seguro esperado deve permanecer na asserção mesmo quando uma aplicação propositalmente vulnerável falha.
- IDs, metadados Allure, evidências e links de bugs fornecem rastreabilidade.
- Restrições a localhost reduzem o risco de testes acidentais fora do laboratório.

### Próximos passos

- Concluir uma execução formal e preencher o relatório.
- Revisar e estabilizar seletores nos navegadores suportados.
- Fixar a imagem do Juice Shop por digest imutável.
- Revisar a política de publicação antes de habilitar o deploy opcional no Pages. [Política de publicação do Allure](docs/publication-policy.md)

## Quality and security pipeline / Pipeline de qualidade e segurança

### English

Open a **Quality and Security** run to see the gate verdict and download its artifacts. [GitHub Actions](https://github.com/beatrizdaddea/security-qa-juice-shop/actions)

| Profile | Trigger | Coverage |
| --- | --- | --- |
| `quick` | Pull request targeting `main`, or manual selection | Lint, secret scanning, SAST, dependency scanning, Chromium smoke, Playwright security and passive ZAP baseline |
| `full` | Push to `main`, or manual default | Quick coverage with the full Chromium regression, plus Cypress and container image scanning |
| `nightly` | Daily at 04:00 UTC, or manual selection | Full regression on Chromium, Firefox and WebKit, with the full ZAP scan |

Gitleaks scans Git history for secrets. Semgrep analyzes source code with repository-local rules. Trivy FS scans the npm lockfile and Trivy Image scans the Juice Shop image and exports `sbom.cdx.json` (CycloneDX) in `quality-trivy-image`. OWASP ZAP produces DAST reports in HTML, JSON and SARIF 2.1.0 in `quality-zap-baseline` or `quality-zap-full`.

The `quality-gate` job uses `scripts/quality-gate.ts` to aggregate producer manifests and reports. It blocks missing or incomplete evidence, new High/Critical scanner findings and unaccepted security test failures. Read the job summary or download the JSON and Markdown from `quality-gate-summary`. Each exception in `security-baseline.json` requires an exact finding ID and source, an owner, a bilingual justification and an `expiresOn` date. The date is inclusive in UTC. Wildcards and expired entries fail the gate across all profiles. Maintainers review each exception individually before renewing it.

The unified workflow is `.github/workflows/quality-security.yml`. Application tests target only `http://localhost:3000`. A successful run provides the `sanitized-allure-site` artifact. The optional public deployment also requires a successful push to `main`. [CI and local verification](docs/CI.md) · [Allure publication policy](docs/publication-policy.md)

To enable public deployment, select **GitHub Actions** as the Pages source, review the `github-pages` environment, and set the repository Actions variable `PUBLISH_ALLURE_PAGES` to `true`.

### Português (PT-BR)

Abra uma execução de **Quality and Security** para ver o resultado do gate e baixar os artefatos. [GitHub Actions](https://github.com/beatrizdaddea/security-qa-juice-shop/actions)

| Perfil | Gatilho | Cobertura |
| --- | --- | --- |
| `quick` | Pull request para `main` ou seleção manual | Lint, busca de segredos, SAST, análise de dependências, smoke no Chromium, testes de segurança Playwright e baseline passivo do ZAP |
| `full` | Push na `main` ou padrão manual | Cobertura do quick com regressão completa no Chromium, Cypress e scan da imagem de contêiner |
| `nightly` | Diariamente às 04:00 UTC ou seleção manual | Regressão completa em Chromium, Firefox e WebKit, com scan completo do ZAP |

O Gitleaks procura segredos no histórico Git. O Semgrep analisa o código-fonte com regras locais do repositório. O Trivy FS verifica o lockfile do npm e o Trivy Image analisa a imagem do Juice Shop e exporta `sbom.cdx.json` (CycloneDX) em `quality-trivy-image`. O OWASP ZAP gera relatórios DAST em HTML, JSON e SARIF 2.1.0 em `quality-zap-baseline` ou `quality-zap-full`.

O job `quality-gate` usa `scripts/quality-gate.ts` para agregar os manifestos e relatórios dos produtores. Ele bloqueia evidências ausentes ou incompletas, novos achados Altos/Críticos dos scanners e falhas de segurança não aceitas. Consulte o resumo do job ou baixe o JSON e o Markdown de `quality-gate-summary`. Cada exceção em `security-baseline.json` exige ID exato do achado, origem, responsável, justificativa bilíngue e data `expiresOn`. A exceção vale até o fim dessa data em UTC. Curingas e entradas vencidas reprovam o gate em todos os perfis. Os mantenedores revisam cada exceção individualmente antes de renová-la.

O workflow unificado está em `.github/workflows/quality-security.yml`. Os testes da aplicação apontam somente para `http://localhost:3000`. Uma execução aprovada disponibiliza o artefato `sanitized-allure-site`. A publicação pública é opcional e também exige um push aprovado na `main`. [CI e verificação local](docs/CI.md) · [Política de publicação do Allure](docs/publication-policy.md)

Para habilitar a publicação pública, selecione **GitHub Actions** como origem do Pages, revise o ambiente `github-pages` e defina a variável de repositório do Actions `PUBLISH_ALLURE_PAGES` como `true`.
