# Playwright Proof of Concept / Prova de Conceito com Playwright

Branch: `feat/fase-1-playwright-poc` · Target / Alvo: `http://localhost:3000` only / somente.

---

# English

## Purpose

Adds Playwright (TypeScript) **alongside** the existing Cypress suite (nothing in `cypress/` was changed) and migrates the five most critical flows from [AUDIT.md](AUDIT.md) §4 as a proof of concept. Known-vulnerability tests (`KNOWN_VULNERABILITY`) were intentionally **not** migrated: they fail by design and need the expected-failure registry planned for audit Phase 1.

## Migrated flows

| Test | Flow | Spec | Auth |
| --- | --- | --- | --- |
| `TC-001 valid login` | Login form (UI) | `tests/e2e/functional.spec.ts` | fresh user via API |
| `TC-002 user registration` | Registration form (UI) | `tests/e2e/functional.spec.ts` | anonymous |
| `TC-003 product search` | Search | `tests/e2e/functional.spec.ts` | anonymous |
| `TC-004 add product to basket` | Basket | `tests/e2e/functional.spec.ts` | shared `storageState` |
| `TC-009 protected endpoints require authentication` | Access control (API) | `tests/e2e/access-control.spec.ts` | none |

Every test calls `addMetadata()` (Allure epic, feature, severity, OWASP tag) and its name starts with its TC ID.

## Layout

```text
playwright.config.ts      config (env-driven, localhost guard, reporters, projects)
tests/e2e/                specs
pages/                    Page Object Model (login, registration, products, basket)
fixtures/                 `test` fixtures, global setup that writes storageState
utils/                    data generation, API helpers, Allure metadata helper
tsconfig.playwright.json  typecheck for the Playwright code only
scripts/clean-playwright.cjs  cleans generated Playwright output before each run
```

## Decisions

- **Coexistence**: separate folders (`tests/`, `pages/`, `fixtures/`, `utils/`) and separate output (`allure-results-playwright/`, `allure-report-playwright/`, `playwright-report/`, `test-results/`). Cypress' `precy:run` only cleans `allure-results/`, so the suites do not collide. Root `tests/api` and `tests/ui` (empty, untracked) were left untouched.
- **Locators**: `getByRole` / `getByLabel` (the app exposes `aria-label`s) and scoped `filter()`; no CSS-class selectors, no `force: true`, no fixed waits. Waits are Playwright auto-waiting, `waitForResponse` set up *before* the action, and web-first `expect`.
- **Material select quirk**: the `mat-label` overlays the security-question select and intercepts clicks. Instead of `force: true`, the page object clicks the label inside a retried `expect(...).toPass()` until `aria-expanded="true"`.
- **Authenticated reuse**: `fixtures/global-setup.ts` registers one throwaway user through the API, logs in, and writes `playwright/.auth/user.json` (cookie `token` + localStorage `token`). Juice Shop keeps the basket id in `sessionStorage`, which `storageState` cannot hold, so it is saved in localStorage (`qa-basket-id`) and restored by the `context` fixture with an init script. The file is git-ignored.
- **Test data**: generated per run (`utils/data.ts`); passwords are random, nothing credential-like is committed.
- **Evidence**: `PW_TRACE`, `PW_VIDEO`, `PW_SCREENSHOT` accept `on | off | retain-on-failure`. Defaults: local `on`, CI (`CI` set) `retain-on-failure`. Playwright's screenshot option has no `retain-on-failure`, so it is mapped to `only-on-failure`.
- **Retries/workers**: no retries locally (so flakiness is visible), `retries: 1` and 2 workers in CI.
- **Scope guard**: `playwright.config.ts` throws if `BASE_URL` is not `localhost`/`127.0.0.1`.
- **Browsers**: `chromium` always; `firefox` only with `PW_FIREFOX=1` (and `playwright install firefox`).
- **Windows note**: this repository path contains `&`, which breaks `npx`/`.cmd` shims in `cmd.exe`. Scripts therefore call `node ./node_modules/@playwright/test/cli.js` directly (same approach as the Cypress scripts).
- **CI**: not changed in this phase (the workflow still runs Cypress only). Adding Playwright to CI is a follow-up.

## How to run

```bash
npm ci
npm run pw:install        # downloads Chromium
docker compose up -d      # Juice Shop at http://localhost:3000
npm run pw:test           # runs the suite (cleans previous output first)
npm run pw:ui             # interactive UI mode
npm run pw:report         # open the HTML report
npm run pw:allure:generate && npm run pw:allure:open   # Allure report
npm run pw:typecheck
```

Existing `allure:generate` / `allure:open` keep serving the Cypress results; the `pw:allure:*` pair serves Playwright. Examples: `PW_TRACE=off PW_VIDEO=off npm run pw:test`, `CI=1 npm run pw:test`. Allure needs Java on the PATH (as for the Cypress report).

## Verification evidence

See the final section of the task report: 3 consecutive `npm run pw:test` runs, Allure attachments (video `.webm`, screenshot `.png`, trace `.zip`), and the Cypress suite result.

---

# Português (PT-BR)

## Objetivo

Adiciona o Playwright (TypeScript) **ao lado** da suíte Cypress existente (nada em `cypress/` foi alterado) e migra os cinco fluxos mais críticos da [AUDIT.md](AUDIT.md) §4 como prova de conceito. Os testes de vulnerabilidade conhecida (`KNOWN_VULNERABILITY`) **não** foram migrados de propósito: falham por design e dependem do registro de falhas esperadas previsto na Fase 1 da auditoria.

## Fluxos migrados

| Teste | Fluxo | Spec | Autenticação |
| --- | --- | --- | --- |
| `TC-001 valid login` | Formulário de login (UI) | `tests/e2e/functional.spec.ts` | usuário novo via API |
| `TC-002 user registration` | Formulário de cadastro (UI) | `tests/e2e/functional.spec.ts` | anônimo |
| `TC-003 product search` | Busca | `tests/e2e/functional.spec.ts` | anônimo |
| `TC-004 add product to basket` | Cesta | `tests/e2e/functional.spec.ts` | `storageState` compartilhado |
| `TC-009 protected endpoints require authentication` | Controle de acesso (API) | `tests/e2e/access-control.spec.ts` | nenhuma |

Todo teste chama `addMetadata()` (epic, feature, severity e tag OWASP do Allure) e o nome começa com o ID do TC.

## Estrutura

```text
playwright.config.ts      config (via env, trava de localhost, reporters, projetos)
tests/e2e/                specs
pages/                    Page Object Model (login, cadastro, produtos, cesta)
fixtures/                 fixtures `test`, global setup que grava o storageState
utils/                    geração de dados, helpers de API, helper de metadados Allure
tsconfig.playwright.json  typecheck somente do código Playwright
scripts/clean-playwright.cjs  limpa a saída gerada do Playwright antes de cada execução
```

## Decisões

- **Convivência**: pastas separadas (`tests/`, `pages/`, `fixtures/`, `utils/`) e saídas separadas (`allure-results-playwright/`, `allure-report-playwright/`, `playwright-report/`, `test-results/`). O `precy:run` do Cypress só limpa `allure-results/`, então as suítes não colidem. As pastas vazias não rastreadas `tests/api` e `tests/ui` foram mantidas.
- **Locators**: `getByRole` / `getByLabel` (o app expõe `aria-label`) e `filter()` com escopo; sem seletores de classe CSS, sem `force: true`, sem esperas fixas. As esperas são o auto-wait do Playwright, `waitForResponse` criado *antes* da ação e `expect` web-first.
- **Particularidade do select Material**: o `mat-label` cobre o select da pergunta de segurança e intercepta cliques. Em vez de `force: true`, o page object clica no label dentro de um `expect(...).toPass()` com retentativa até `aria-expanded="true"`.
- **Reuso de autenticação**: `fixtures/global-setup.ts` registra um usuário descartável pela API, faz login e grava `playwright/.auth/user.json` (cookie `token` + localStorage `token`). O Juice Shop guarda o id da cesta em `sessionStorage`, que o `storageState` não persiste; por isso ele é salvo no localStorage (`qa-basket-id`) e restaurado pela fixture `context` com um init script. O arquivo está no `.gitignore`.
- **Dados de teste**: gerados a cada execução (`utils/data.ts`); senhas aleatórias, nada parecido com credencial é versionado.
- **Evidências**: `PW_TRACE`, `PW_VIDEO`, `PW_SCREENSHOT` aceitam `on | off | retain-on-failure`. Padrões: local `on`, CI (`CI` definido) `retain-on-failure`. A opção de screenshot do Playwright não tem `retain-on-failure`, então é mapeada para `only-on-failure`.
- **Retries/workers**: sem retries localmente (para expor instabilidade), `retries: 1` e 2 workers no CI.
- **Trava de escopo**: `playwright.config.ts` lança erro se `BASE_URL` não for `localhost`/`127.0.0.1`.
- **Navegadores**: `chromium` sempre; `firefox` só com `PW_FIREFOX=1` (e `playwright install firefox`).
- **Nota Windows**: o caminho deste repositório contém `&`, o que quebra `npx`/shims `.cmd` no `cmd.exe`. Por isso os scripts chamam `node ./node_modules/@playwright/test/cli.js` diretamente (mesma abordagem dos scripts do Cypress).
- **CI**: não alterado nesta fase (o workflow ainda roda só Cypress). Incluir o Playwright no CI é um próximo passo.

## Como executar

```bash
npm ci
npm run pw:install        # baixa o Chromium
docker compose up -d      # Juice Shop em http://localhost:3000
npm run pw:test           # executa a suíte (limpa a saída anterior antes)
npm run pw:ui             # modo UI interativo
npm run pw:report         # abre o relatório HTML
npm run pw:allure:generate && npm run pw:allure:open   # relatório Allure
npm run pw:typecheck
```

Os `allure:generate` / `allure:open` existentes continuam servindo os resultados do Cypress; o par `pw:allure:*` serve o Playwright. Exemplos: `PW_TRACE=off PW_VIDEO=off npm run pw:test`, `CI=1 npm run pw:test`. O Allure precisa de Java no PATH (como no relatório do Cypress).

## Evidências de verificação

Veja a seção final do relatório da tarefa: 3 execuções consecutivas de `npm run pw:test`, anexos do Allure (vídeo `.webm`, screenshot `.png`, trace `.zip`) e o resultado da suíte Cypress.
