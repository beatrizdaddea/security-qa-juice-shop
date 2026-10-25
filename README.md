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
- Review [docs/publication-policy.md](docs/publication-policy.md) before using the GitHub Pages workflow. The workflow publishes only a sanitized report after the test and sanitization jobs pass.

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
- Revisar a [política de publicação](docs/publication-policy.md) antes de usar o workflow do GitHub Pages. A publicação ocorre somente após os testes e a sanitização passarem.

## Allure on GitHub Pages / Allure no GitHub Pages

### English

Published report: **[View the live Allure report](https://beatrizdaddea.github.io/security-qa-juice-shop/)**

The publication workflow is `.github/workflows/allure-pages.yml`. It runs on pushes to `main` or by manual dispatch, tests only the pinned Juice Shop image against `http://localhost:3000`, sanitizes the generated report, and deploys only when both jobs pass. Read [docs/publication-policy.md](docs/publication-policy.md) before publishing.

To enable Pages manually: open **Settings → Pages**, choose **Source: GitHub Actions**, review the `github-pages` environment, then run the workflow manually or push to `main`. To unpublish, disable or remove the Pages deployment and cancel any running workflow.

### Português (PT-BR)

Relatório publicado: **[Acessar o relatório Allure](https://beatrizdaddea.github.io/security-qa-juice-shop/)**

O workflow está em `.github/workflows/allure-pages.yml`. Ele testa somente a imagem fixada do Juice Shop contra `http://localhost:3000`, sanitiza o relatório e publica apenas quando os jobs passam. Para habilitar: abra **Settings → Pages**, escolha **Source: GitHub Actions**, revise o ambiente `github-pages` e execute o workflow. Para despublicar, desabilite ou remova o deployment do Pages e cancele workflows em execução.

Consulte [docs/publication-policy.md](docs/publication-policy.md); nunca publique segredos, tokens, cookies, e-mails reais, logs brutos ou mídias proibidas.
