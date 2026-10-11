# Security QA — OWASP Juice Shop

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

With Juice Shop running, execute:

```bash
bash scripts/zap-baseline.sh
```

The script accepts only `http://localhost:3000` and writes `reports/zap-baseline.html`. In the report, review **FAIL** alerts first, then **WARN** alerts. Confirm each alert manually, distinguish application vulnerabilities from scanner noise, map confirmed findings to OWASP/CWE, and create a bug file only after reproduction. ZAP may return a non-zero exit code when alerts are found; this does not mean the HTML report failed to generate.

### Key learnings

- Secure expected behavior must remain the assertion even when a deliberately vulnerable application fails it.
- Test IDs, Allure metadata, evidence, and bug links provide traceability.
- Local-only guards reduce the risk of accidental testing outside the lab.

### Next steps

- Complete a formal run and fill the execution report.
- Review and stabilize selectors across supported browsers.
- Pin the Juice Shop image by immutable digest.
- Consider publishing the generated Allure site with a GitHub Pages workflow after defining retention and disclosure rules; no publishing workflow is included yet.

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

Com o Juice Shop em execução, use:

```bash
bash scripts/zap-baseline.sh
```

O script aceita apenas `http://localhost:3000` e grava `reports/zap-baseline.html`. No relatório, analise primeiro os alertas **FAIL** e depois os **WARN**. Confirme cada alerta manualmente, diferencie vulnerabilidades da aplicação de ruído do scanner, mapeie achados confirmados para OWASP/CWE e crie um bug somente após reproduzi-lo. O ZAP pode retornar código diferente de zero quando encontra alertas; isso não significa que o HTML deixou de ser gerado.

### Principais aprendizados

- O comportamento seguro esperado deve permanecer na asserção mesmo quando uma aplicação propositalmente vulnerável falha.
- IDs, metadados Allure, evidências e links de bugs fornecem rastreabilidade.
- Restrições a localhost reduzem o risco de testes acidentais fora do laboratório.

### Próximos passos

- Concluir uma execução formal e preencher o relatório.
- Revisar e estabilizar seletores nos navegadores suportados.
- Fixar a imagem do Juice Shop por digest imutável.
- Considerar a publicação do site Allure via GitHub Pages após definir regras de retenção e divulgação; nenhum workflow de publicação foi incluído.
