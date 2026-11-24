# Repository Audit / Auditoria do Repositório

Audit date / Data: 2026-10-24 · Branch: `main` @ `8bd44de` · Auditor role / Papel: Staff QA + AppSec reviewer
Scope / Escopo: read-only audit; target only `http://localhost:3000`. / Auditoria somente leitura; alvo apenas `http://localhost:3000`.

---

# English

## 1. Executive summary

The repository is a clean, well-scoped Cypress + Allure portfolio with 17 automated tests (7 UI, 10 API), a three-job GitHub Actions pipeline that sanitizes and publishes the Allure report, and 12 documented bug files. Strengths: localhost guard in `cypress.config.ts`, Page Objects for UI, Allure metadata helper, report sanitization, `npm audit` clean, no secrets in history.

Main concerns:

1. **The suite is red by design.** 12 of 17 tests fail on every run (known Juice Shop vulnerabilities, signalled with `KNOWN_VULNERABILITY`). `npm test` therefore always exits non-zero (exit 12/13 observed) and CI hides this with `scripts/validate-known-vulnerabilities.cjs`, which accepts *any* known-vuln failure. There is no baseline/expected-failure model, so a regression and a fix are both invisible.
2. **One flaky test observed in 2 runs**: `TC-004` (passed in run 1, failed in run 2 with `cy.screenshot() timed out waiting 30000ms`).
3. **Only 1 of 12 documented "security" tests passes** (TC-009); coverage of checkout, admin API, and payments is absent.
4. **Pipeline gaps**: no PR trigger, no lint/typecheck, no dependency/secret/container scanning, actions pinned by tag (not SHA), no Dependabot, ZAP script not wired into CI.
5. **Version drift**: `docker-compose.yml` uses `:latest`, CI uses `v20.2.0`, `cypress.config.ts` hardcodes `app.version: 20.2.0` and `Electron 146`.

## 2. Current stack

| Item | Evidence |
| --- | --- |
| Runtime | Node `v24.9.0`, npm `11.6.0` locally; CI uses Node 20 (`.github/workflows/allure-pages.yml`) |
| Test runner | `cypress ^16.1.1` (installed 16.1.1; 16.2.0 available), Electron 146 headless (Cypress warns it is **deprecated**) |
| Language | `typescript ^7.0.2`, `tsconfig.json` strict, `module: Node16` |
| Reporting | `allure-cypress ^3.13.0`, `allure-js-commons ^3.13.0`, `allure-commandline ^2.46.1` (3.14.0 available) |
| Target app | OWASP Juice Shop 20.2.0 (`GET /rest/admin/application-version` → `{"version":"20.2.0"}`) |
| Docker | `docker-compose.yml`: single service `bkimminich/juice-shop:latest`, port 3000, `restart: unless-stopped`; no Dockerfile |
| CI | One workflow, `allure-pages.yml`: jobs `test` → `sanitize` → `deploy` (GitHub Pages); triggers `workflow_dispatch` and `push` to `main` only |
| Scripts (`package.json`) | `test`, `precy:run` (cleans `allure-results`), `cy:open`, `cy:run`, `test:api`, `test:ui`, `allure:generate`, `allure:open` — **no** `lint`, `typecheck`, `audit`, `clean` |
| Cypress config | `cypress.config.ts`: `baseUrl` localhost guard, `video: true`, `screenshotOnRunFailure: true`, spec pattern `cypress/e2e/**/*.cy.ts`; no `retries`, no `defaultCommandTimeout`/`env` config |
| Allure config | `cypress.config.ts` (`resultsDir: allure-results`, hardcoded `environmentInfo`), `allure/categories.json`, `allure/environment.properties` (duplicates the hardcoded values) |
| Other tooling | `scripts/zap-baseline.sh` (Docker ZAP `ghcr.io/zaproxy/zaproxy:stable`, `--network host`), `scripts/sanitize-allure-report.cjs`, `scripts/allure-cli.cjs` |
| Docs | `docs/` (5 files), `bugs/` (14 files + README/template), `README.md` (165 lines) |
| Git | 23 commits on `main`; 8 of the 14 most recent are `fix(ci): …` (mostly healthcheck retries) |

Repository layout (tracked): `cypress/e2e/{api,ui}`, `cypress/pages/*.page.ts` (5), `cypress/support/{e2e,security}.ts`, `scripts/`, `allure/`, `bugs/`, `docs/`, `evidence/.gitkeep`, `reports/.gitkeep`. Untracked empty folders `tests/api`, `tests/ui` exist locally (unused). `AGENTS.md` is untracked (pre-existing; not created by this audit).

## 3. Baseline metrics

Commands run: `npm ci`, `npm test` (twice), `npm audit`, `npm audit --omit=dev`, `npm outdated`.

| Metric | Value |
| --- | --- |
| `npm ci` | 57 s, 199 packages added, **0 vulnerabilities** |
| Tests | 17 (UI 7 in `juice-shop-ui.cy.ts`, API 10 in `security-api.cy.ts`) |
| Run 1 | Cypress 00:24 (UI 00:18, API 00:06); wall time 220 s (includes Cypress/Electron startup and environment warm-up); **5 pass / 12 fail**; exit code 12 |
| Run 2 | Cypress 00:52 (UI 00:47, API 00:05); wall time 95 s; **4 pass / 13 fail**; exit code 13 |
| Passing both runs | TC-001, TC-002, TC-003, TC-009 |
| Failing both runs (known vulns) | TC-005, 006, 007, 008, 010, 012, 013, 014, 015, 016, 017, 018 (all `KNOWN_VULNERABILITY`, mapped to `bugs/BUG-TC-xxx.md`) |
| **Flaky** | **TC-004** add product to basket: pass in run 1, `cy.screenshot() timed out waiting 30000ms` in run 2 |
| Allure results | Every failure is reported as `broken` (thrown `Error`), not `failed` |
| `npm audit` / `--omit=dev` | 0 vulnerabilities / 0 vulnerabilities |
| `npm outdated` | `cypress` 16.1.1→16.2.0, `allure-cypress` and `allure-js-commons` 3.13.0→3.14.0 |

> Run-to-run timing is not a reliable baseline: only two samples, one inflated by environment startup. Treat the Cypress-reported durations (24 s / 52 s) as indicative.

## 4. Test quality assessment

| Area | Finding | Evidence |
| --- | --- | --- |
| Duplication | `PASSWORD`, `uniqueEmail()`, and user-creation helper (`register`/`createUser`) are copy-pasted in both specs | `security-api.cy.ts:9-30`, `juice-shop-ui.cy.ts:7-28` |
| Hardcoded data | Password `Qa!Secure12345` and security answer `qa-answer` in source; `app.version`/browser string hardcoded | specs, `cypress.config.ts:59-60`, `allure/environment.properties` |
| No custom commands | `cypress/support/` only has `e2e.ts` (1 line) and `security.ts`; API helpers should be `Cypress.Commands` or an `ApiClient` | `cypress/support/e2e.ts` |
| Page Objects | Exist for UI (5 files), but API tests have no equivalent; specs still contain inline `cy.get` (`juice-shop-ui.cy.ts:60,71,83`) | `cypress/pages/` |
| Fragile selectors | `mat-card`, `mat-row, mat-table, .mat-mdc-table`, `.cc-btn`, `mat-select[...]…first()`, `mat-option` `.first()`, `button[aria-label^="Add to Basket"]` `.first()`; no `data-*` attrs available (third-party app) | `products.page.ts:8,19`, `registration.page.ts:12-15`, `base.page.ts:23` |
| `force: true` | Used on 4 clicks/types, masks real overlay/visibility problems | `base.page.ts:17,24`, `registration.page.ts:11,14` |
| Fixed waits | **None** (`cy.wait(<number>)` not used); waits are on aliased intercepts — good | `git grep "cy.wait("` |
| Assertion quality | `TC-004` asserts only that a table contains the text `"1"` (weak); `TC-016` uses conditional `if` inside test (non-deterministic path) | `juice-shop-ui.cy.ts:71,116` |
| Security-test semantics | `assertSecure()` throws a generic `Error`; Allure marks `broken`, not `failed`/`skipped`; no way to express "expected failure" | `cypress/support/security.ts:26-30` |
| Screenshots | `cy.screenshot()` called in passing tests; it is the step that timed out in the flaky TC-004 | `juice-shop-ui.cy.ts:70` |
| Config | No `retries`; `video: true` for all runs (slow, large) | `cypress.config.ts` |
| Metadata | Allure epic/feature/severity/OWASP tag provided through `addSecurityMetadata`; UI functional tests use tag `OWASP Functional` (not an OWASP reference) | `juice-shop-ui.cy.ts:39` |
| Test naming | All 17 start with `TC-xxx`. IDs TC-011 is absent (gap) | specs |

### Critical-flow coverage

| Flow | Coverage | Gap |
| --- | --- | --- |
| Auth (login) | TC-001 UI, TC-005 SQLi, TC-017 brute-force, TC-018 logout token | no negative login UI, no password change, no JWT tampering/expiry, no 2FA |
| Registration | TC-002, TC-016 | no duplicate email, no input validation matrix |
| Search | TC-003, TC-006 | no API-level `/rest/products/search` injection checks |
| Basket | TC-004, TC-007, TC-009 | no quantity/negative-quantity, no basket tampering |
| Checkout / payment | **none** | address, delivery, card, order history, coupon |
| Admin | TC-008 (UI route only) | no admin API authz (`/api/Users`, `/rest/admin/*`), no privilege escalation at registration |
| API | 10 tests in one spec | no schema/contract tests, no negative-method tests, no CORS test |

## 5. Problems by severity

| ID | Severity | Problem | Evidence |
| --- | --- | --- | --- |
| P-01 | High | Suite is permanently red; `npm test` cannot be used as a quality gate. CI tolerates any `KNOWN_VULNERABILITY` failure so fixes/regressions are invisible | exit 12/13; `scripts/validate-known-vulnerabilities.cjs`; workflow step "Run Cypress and allow confirmed vulnerability findings" |
| P-02 | High | CI runs only on push to `main` / manual; no PR validation, no typecheck/lint, no audit | `allure-pages.yml` `on:` block |
| P-03 | High | Flaky test TC-004 and no `retries` strategy | run 2 failure message |
| P-04 | Medium | CI actions pinned by tag only (`checkout@v4`, `setup-node@v4`, `upload-artifact@v4`, …), no Dependabot/Renovate | `allure-pages.yml` |
| P-05 | Medium | Version drift: compose `:latest` vs CI `v20.2.0` vs hardcoded `20.2.0` | `docker-compose.yml:3`, workflow, `cypress.config.ts:59` |
| P-06 | Medium | `typecheck` never runs; `tsconfig.json` is not validated in CI; `typescript ^7.0.2` is a very new major | no script in `package.json` |
| P-07 | Medium | Cypress Electron browser is deprecated; CI Node 20 vs local Node 24 | run output; workflow |
| P-08 | Medium | Test-data duplication and hardcoded credentials | see §4 |
| P-09 | Medium | `.env`/`.env.example` absent; configuration (base URL, password, version) hardcoded | `git ls-files` |
| P-10 | Low | `docs/execution-report.md` is an empty template (no real results) | file content |
| P-11 | Low | `zap-baseline.sh` uses `--network host` (not supported on Docker Desktop for Windows/macOS) and unpinned `:stable` tag; not run in CI | `scripts/zap-baseline.sh` |
| P-12 | Low | Workflow disclosure step contains PT-BR characters that appear garbled in a Windows terminal (encoding to verify) | `allure-pages.yml` "Add publication disclosure" |
| P-13 | Low | Empty untracked folders `tests/api`, `tests/ui`; `reports/` and `evidence/` only hold `.gitkeep` | `git status`, `git ls-files` |
| P-14 | Low | Dependencies one minor behind | `npm outdated` |

## 6. Security gaps

Evidence collected with read-only requests to `http://localhost:3000` and with the test results.

| Area | Finding | Evidence | OWASP 2021 |
| --- | --- | --- | --- |
| Headers | Present: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`. **Missing**: `Content-Security-Policy`, `Referrer-Policy`, `Strict-Transport-Security`, `Permissions-Policy` (legacy `Feature-Policy` only) | `curl -D - http://localhost:3000/`; TC-012 fails | A05 |
| CORS | `Access-Control-Allow-Origin: *` on `/` | same response | A05 |
| Info disclosure | `X-Recruiting: /#/jobs` header; `/ftp` → HTTP 200; `/metrics` → HTTP 200; malformed JSON → HTTP 500 | curl, TC-013/014/015 | A05 |
| Access control | `/rest/basket/{id}` readable by another user; `/api/Users` returns other users; admin route reachable by regular user | TC-007, TC-010, TC-008 | A01 |
| Auth | No brute-force throttling (20 failed logins, no 403/429); token valid after logout; password `12345` accepted; SQLi login accepted | TC-017, 018, 016, 005 | A07, A03 |
| XSS | HTML marker in search is interpreted | TC-006 | A03 |
| Cookies | Not verified: no cookie was set by `GET /` (no `Set-Cookie`). Login stores JWT in `localStorage` (`cy.window().its("localStorage.token")` in `auth.page.ts`) and cookie flags (`HttpOnly`, `Secure`, `SameSite`) after login have **not** been inspected | `auth.page.ts` | A02/A07 |
| Dependencies | `npm audit` 0 vulnerabilities (dev+prod); no automated audit in CI | commands above | A06 |
| Secrets | `git log -p --all` scan for `AKIA…`, `ghp_…`, private keys, `api_key=`/`secret=` assignments: **no matches**. Only test credentials in the specs. No `.env*` committed; `.gitignore` ignores `.env`, `.env.*` and keeps `!.env.example` | git history scan | A02 |
| CI | `permissions` is set at workflow level with `pages: write`/`id-token: write` granted to **all** jobs (including `test`); no secret scanning, SAST, container/image scan, or SBOM; artifacts retained 14 days | `allure-pages.yml` | A05/A08 |
| Container | `bkimminich/juice-shop:latest` unpinned in compose; no digest pinning anywhere | `docker-compose.yml` | A06/A08 |
| Scope guard | Good: `cypress.config.ts` throws if `baseUrl` is not localhost; `zap-baseline.sh` refuses other targets. But the guard compares only `baseUrl`; `cy.request` with absolute URLs would bypass it | `cypress.config.ts:51` | — |

Note: Juice Shop is intentionally vulnerable; these are findings about the *test project's* verification posture and the baseline of known issues, not defects in a production system.

## 7. Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Regressions/fixes unnoticed because the pipeline accepts any known-vuln failure | High | High | Expected-failure baseline (see roadmap Phase 1) |
| Flaky UI tests erode trust in the report | Medium | Medium | Retries, remove `cy.screenshot` from the test flow, stabilize selectors |
| Cypress Electron removal breaks the pipeline on upgrade | Medium | Medium | Switch to Chrome in CI |
| Action supply-chain compromise (tag-pinned actions) | Low | High | Pin by SHA + Dependabot |
| Version drift between local and CI hides environment-specific failures | Medium | Medium | Pin image/digest, single source of truth |
| Playwright introduction duplicating helpers/config | Medium | Low | Shared data/config module |

## 8. Opportunities

- Introduce Playwright alongside Cypress (per project rules; Cypress must stay intact) for API and cross-browser coverage.
- Convert known-vulnerability checks into an *expected-failure registry* (JSON, keyed by TC ID) so CI fails on regression and on unexpected fix.
- Shared test-data/config module + `.env.example`; reuse for Cypress and Playwright.
- `ApiClient` / custom commands for register/login/basket.
- Add ZAP baseline + `npm audit` + secret scanning (gitleaks via Docker) as CI jobs; publish SARIF.
- Add k6 (Docker) smoke/perf checks, a11y checks (axe), and visual baselines.
- Fill `docs/execution-report.md` automatically from Allure results.
- Enrich Allure: history, retries trend, links to `bugs/*.md`.

## 9. Prioritized roadmap

Effort: **P** (≤0.5 day) · **M** (1–3 days) · **G** (>3 days). Impact: H/M/L. One branch per phase (`feat/fase-N-descricao`).

| Phase | Scope | Effort | Impact |
| --- | --- | --- | --- |
| 0 – Hygiene | Add `.env.example`, `typecheck`/`lint` scripts, pin compose image to `v20.2.0`, remove empty `tests/`, bump minor deps, set `retries: { runMode: 1 }` and `video: false` unless failing | P | M |
| 1 – Gate reliability | Expected-failure registry replacing `validate-known-vulnerabilities.cjs`; fix TC-004 flake; mark known vulns as Allure `skipped`/known-issue; add PR trigger + typecheck + `npm audit` to CI; least-privilege `permissions` per job | M | **H** |
| 2 – Test architecture | Shared helpers/custom commands/`ApiClient`, central test-data, remove duplication, strengthen assertions (TC-004), TC-016 deterministic | M | H |
| 3 – Coverage | Checkout, admin API authz, JWT checks, CORS, cookie flags, search API injection, TC-011 gap | G | H |
| 4 – Playwright | Playwright + TypeScript alongside Cypress (API + cross-browser); Allure reporter; shared config | G | M |
| 5 – Security automation | ZAP baseline (fix `--network host` portability), gitleaks, Trivy image scan, SARIF upload, Dependabot, SHA-pinned actions — all via Docker, localhost only | M | H |
| 6 – Quality engineering | k6 smoke, axe a11y, visual regression, quality dashboard (execution report generated from results), docs in `docs/` | G | M |

## 10. Open questions

1. Should known vulnerabilities be reported as **expected failures** (green pipeline, fail only on change) or remain failures?
2. Which Juice Shop version should be canonical: `latest` or pinned `20.2.0`?
3. Should Playwright reuse the existing TC-ID/Allure metadata convention (same test names)?
4. Is the GitHub Pages deployment required to stay on `main` push only, or should PR previews be allowed?
5. Is the Cypress Electron (deprecated) browser acceptable, or should Chrome be mandatory?
6. Do you want cookie flags and JWT checks included in scope (requires authenticated probing)?
7. Is the `docs/execution-report.md` template to be auto-generated or maintained manually?
8. Which tools are acceptable in Docker (ZAP, gitleaks, Trivy, k6)?

## 11. Audit verification

- `git status --short` after the audit shows only `?? AGENTS.md` (pre-existing untracked) and `?? docs/AUDIT.md` (this file). No tracked file was modified.
- Generated artifacts (`allure-results/`, `cypress/screenshots/`, `cypress/videos/`, `node_modules/`) are in `.gitignore`.
- Not verified: cookie flags after login, JWT contents, CI execution on GitHub (no access), Windows/Docker Desktop runtime of `zap-baseline.sh`.

---

# Português (PT-BR)

## 1. Resumo executivo

O repositório é um portfólio Cypress + Allure limpo e bem delimitado, com 17 testes automatizados (7 UI, 10 API), um pipeline GitHub Actions de três jobs que higieniza e publica o relatório Allure, e 12 arquivos de bug documentados. Pontos fortes: trava de localhost em `cypress.config.ts`, Page Objects de UI, helper de metadados Allure, sanitização do relatório, `npm audit` limpo, nenhum segredo no histórico.

Principais preocupações:

1. **A suíte é vermelha por design.** 12 dos 17 testes falham em toda execução (vulnerabilidades conhecidas do Juice Shop, sinalizadas com `KNOWN_VULNERABILITY`). Logo `npm test` sempre termina com código ≠ 0 (12/13 observados) e o CI esconde isso com `scripts/validate-known-vulnerabilities.cjs`, que aceita *qualquer* falha de vuln. conhecida. Não há baseline de falhas esperadas, então regressão e correção ficam invisíveis.
2. **Um teste instável em 2 execuções**: `TC-004` (passou na execução 1, falhou na 2 com `cy.screenshot() timed out waiting 30000ms`).
3. **Apenas 1 dos 12 testes de segurança passa** (TC-009); não há cobertura de checkout, API de admin e pagamentos.
4. **Lacunas no pipeline**: sem gatilho de PR, sem lint/typecheck, sem scan de dependências/segredos/containers, actions fixadas por tag (não SHA), sem Dependabot, script ZAP fora do CI.
5. **Deriva de versão**: `docker-compose.yml` usa `:latest`, o CI usa `v20.2.0`, `cypress.config.ts` fixa `app.version: 20.2.0` e `Electron 146`.

## 2. Stack atual

| Item | Evidência |
| --- | --- |
| Runtime | Node `v24.9.0`, npm `11.6.0` local; CI usa Node 20 (`.github/workflows/allure-pages.yml`) |
| Runner | `cypress ^16.1.1` (instalado 16.1.1; 16.2.0 disponível), Electron 146 headless (Cypress avisa que está **depreciado**) |
| Linguagem | `typescript ^7.0.2`, `tsconfig.json` strict, `module: Node16` |
| Relatórios | `allure-cypress ^3.13.0`, `allure-js-commons ^3.13.0`, `allure-commandline ^2.46.1` (3.14.0 disponível) |
| Alvo | OWASP Juice Shop 20.2.0 (`GET /rest/admin/application-version` → `{"version":"20.2.0"}`) |
| Docker | `docker-compose.yml`: um serviço `bkimminich/juice-shop:latest`, porta 3000, `restart: unless-stopped`; sem Dockerfile |
| CI | Um workflow, `allure-pages.yml`: jobs `test` → `sanitize` → `deploy` (GitHub Pages); gatilhos `workflow_dispatch` e `push` na `main` apenas |
| Scripts (`package.json`) | `test`, `precy:run` (limpa `allure-results`), `cy:open`, `cy:run`, `test:api`, `test:ui`, `allure:generate`, `allure:open` — **sem** `lint`, `typecheck`, `audit`, `clean` |
| Config Cypress | `cypress.config.ts`: trava de `baseUrl` localhost, `video: true`, `screenshotOnRunFailure: true`, spec `cypress/e2e/**/*.cy.ts`; sem `retries`, sem timeouts/`env` |
| Config Allure | `cypress.config.ts` (`resultsDir: allure-results`, `environmentInfo` fixo), `allure/categories.json`, `allure/environment.properties` (duplica valores fixos) |
| Outras ferramentas | `scripts/zap-baseline.sh` (ZAP via Docker `ghcr.io/zaproxy/zaproxy:stable`, `--network host`), `scripts/sanitize-allure-report.cjs`, `scripts/allure-cli.cjs` |
| Docs | `docs/` (5 arquivos), `bugs/` (14 arquivos + README/template), `README.md` (165 linhas) |
| Git | 23 commits na `main`; 8 dos 14 mais recentes são `fix(ci): …` (maioria de healthcheck) |

Estrutura rastreada: `cypress/e2e/{api,ui}`, `cypress/pages/*.page.ts` (5), `cypress/support/{e2e,security}.ts`, `scripts/`, `allure/`, `bugs/`, `docs/`, `evidence/.gitkeep`, `reports/.gitkeep`. Existem pastas vazias não rastreadas `tests/api`, `tests/ui` (sem uso). `AGENTS.md` não está rastreado (já existia; não foi criado por esta auditoria).

## 3. Métricas base

Comandos executados: `npm ci`, `npm test` (2x), `npm audit`, `npm audit --omit=dev`, `npm outdated`.

| Métrica | Valor |
| --- | --- |
| `npm ci` | 57 s, 199 pacotes, **0 vulnerabilidades** |
| Testes | 17 (UI 7 em `juice-shop-ui.cy.ts`, API 10 em `security-api.cy.ts`) |
| Execução 1 | Cypress 00:24 (UI 00:18, API 00:06); tempo total 220 s (inclui inicialização do Cypress/Electron e aquecimento do ambiente); **5 passam / 12 falham**; código de saída 12 |
| Execução 2 | Cypress 00:52 (UI 00:47, API 00:05); tempo total 95 s; **4 passam / 13 falham**; código de saída 13 |
| Passam nas duas | TC-001, TC-002, TC-003, TC-009 |
| Falham nas duas (vulns conhecidas) | TC-005, 006, 007, 008, 010, 012, 013, 014, 015, 016, 017, 018 (todas `KNOWN_VULNERABILITY`, mapeadas para `bugs/BUG-TC-xxx.md`) |
| **Instável** | **TC-004** adicionar produto à cesta: passou na execução 1, `cy.screenshot() timed out waiting 30000ms` na 2 |
| Resultados Allure | Toda falha é `broken` (Error lançado), não `failed` |
| `npm audit` / `--omit=dev` | 0 vulnerabilidades / 0 vulnerabilidades |
| `npm outdated` | `cypress` 16.1.1→16.2.0, `allure-cypress` e `allure-js-commons` 3.13.0→3.14.0 |

> O tempo entre execuções não é baseline confiável: apenas duas amostras, uma inflada pela inicialização do ambiente. Considere as durações do Cypress (24 s / 52 s) como indicativas.

## 4. Qualidade dos testes

| Área | Achado | Evidência |
| --- | --- | --- |
| Duplicação | `PASSWORD`, `uniqueEmail()` e helper de criação de usuário (`register`/`createUser`) copiados nos dois specs | `security-api.cy.ts:9-30`, `juice-shop-ui.cy.ts:7-28` |
| Dados fixos | Senha `Qa!Secure12345` e resposta `qa-answer` no código; `app.version`/browser fixos | specs, `cypress.config.ts:59-60`, `allure/environment.properties` |
| Sem custom commands | `cypress/support/` só tem `e2e.ts` (1 linha) e `security.ts`; helpers de API deveriam ser `Cypress.Commands` ou um `ApiClient` | `cypress/support/e2e.ts` |
| Page Objects | Existem para UI (5 arquivos), não para API; specs ainda têm `cy.get` inline (`juice-shop-ui.cy.ts:60,71,83`) | `cypress/pages/` |
| Seletores frágeis | `mat-card`, `mat-row, mat-table, .mat-mdc-table`, `.cc-btn`, `mat-select[...]…first()`, `mat-option` `.first()`, `button[aria-label^="Add to Basket"]` `.first()`; sem atributos `data-*` (app de terceiros) | `products.page.ts:8,19`, `registration.page.ts:12-15`, `base.page.ts:23` |
| `force: true` | Usado em 4 cliques/digitações; mascara problemas reais de overlay/visibilidade | `base.page.ts:17,24`, `registration.page.ts:11,14` |
| Waits fixos | **Nenhum** (`cy.wait(<número>)` não usado); esperas por intercepts com alias — bom | `git grep "cy.wait("` |
| Qualidade das asserções | `TC-004` só verifica que uma tabela contém `"1"` (fraco); `TC-016` usa `if` condicional no teste (caminho não determinístico) | `juice-shop-ui.cy.ts:71,116` |
| Semântica de teste de segurança | `assertSecure()` lança `Error` genérico; Allure marca `broken`, não `failed`/`skipped`; não há como expressar "falha esperada" | `cypress/support/security.ts:26-30` |
| Screenshots | `cy.screenshot()` em testes que passam; foi o passo que estourou o tempo no TC-004 instável | `juice-shop-ui.cy.ts:70` |
| Config | Sem `retries`; `video: true` em todas as execuções (lento, pesado) | `cypress.config.ts` |
| Metadados | epic/feature/severity/tag OWASP via `addSecurityMetadata`; testes funcionais usam tag `OWASP Functional` (não é referência OWASP) | `juice-shop-ui.cy.ts:39` |
| Nomes | Os 17 começam com `TC-xxx`. O ID TC-011 não existe (lacuna) | specs |

### Cobertura de fluxos críticos

| Fluxo | Cobertura | Lacuna |
| --- | --- | --- |
| Auth (login) | TC-001 UI, TC-005 SQLi, TC-017 força bruta, TC-018 token pós-logout | sem login negativo na UI, troca de senha, adulteração/expiração de JWT, 2FA |
| Cadastro | TC-002, TC-016 | sem e-mail duplicado, sem matriz de validação |
| Busca | TC-003, TC-006 | sem injeção em `/rest/products/search` via API |
| Cesta | TC-004, TC-007, TC-009 | sem quantidade/quantidade negativa, sem adulteração da cesta |
| Checkout / pagamento | **nenhuma** | endereço, entrega, cartão, histórico de pedidos, cupom |
| Admin | TC-008 (somente rota UI) | sem autorização na API admin (`/api/Users`, `/rest/admin/*`), sem escalada de privilégio no cadastro |
| API | 10 testes em um spec | sem testes de schema/contrato, métodos negativos, CORS |

## 5. Problemas por severidade

| ID | Severidade | Problema | Evidência |
| --- | --- | --- | --- |
| P-01 | Alta | Suíte permanentemente vermelha; `npm test` não serve como quality gate. O CI tolera qualquer falha `KNOWN_VULNERABILITY`, então correções/regressões ficam invisíveis | saída 12/13; `scripts/validate-known-vulnerabilities.cjs`; etapa "Run Cypress and allow confirmed vulnerability findings" |
| P-02 | Alta | CI roda só em push na `main`/manual; sem validação de PR, typecheck/lint, audit | bloco `on:` de `allure-pages.yml` |
| P-03 | Alta | Teste instável TC-004 e nenhuma estratégia de `retries` | mensagem de falha da execução 2 |
| P-04 | Média | Actions fixadas só por tag (`checkout@v4`, `setup-node@v4`, `upload-artifact@v4`, …), sem Dependabot/Renovate | `allure-pages.yml` |
| P-05 | Média | Deriva de versão: compose `:latest` vs CI `v20.2.0` vs `20.2.0` fixo | `docker-compose.yml:3`, workflow, `cypress.config.ts:59` |
| P-06 | Média | `typecheck` nunca roda; `tsconfig.json` não é validado no CI; `typescript ^7.0.2` é major muito recente | sem script no `package.json` |
| P-07 | Média | Navegador Electron do Cypress depreciado; CI Node 20 vs local Node 24 | saída da execução; workflow |
| P-08 | Média | Duplicação de dados de teste e credenciais fixas | ver §4 |
| P-09 | Média | Sem `.env`/`.env.example`; configuração (URL, senha, versão) fixa | `git ls-files` |
| P-10 | Baixa | `docs/execution-report.md` é um template vazio (sem resultados reais) | conteúdo do arquivo |
| P-11 | Baixa | `zap-baseline.sh` usa `--network host` (não suportado no Docker Desktop Windows/macOS) e tag `:stable` sem pin; não roda no CI | `scripts/zap-baseline.sh` |
| P-12 | Baixa | Etapa de aviso do workflow tem caracteres PT-BR que aparecem corrompidos no terminal Windows (verificar encoding) | `allure-pages.yml` "Add publication disclosure" |
| P-13 | Baixa | Pastas vazias não rastreadas `tests/api`, `tests/ui`; `reports/` e `evidence/` só com `.gitkeep` | `git status`, `git ls-files` |
| P-14 | Baixa | Dependências uma minor atrás | `npm outdated` |

## 6. Lacunas de segurança

Evidências coletadas com requisições somente leitura a `http://localhost:3000` e com os resultados dos testes.

| Área | Achado | Evidência | OWASP 2021 |
| --- | --- | --- | --- |
| Headers | Presentes: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`. **Ausentes**: `Content-Security-Policy`, `Referrer-Policy`, `Strict-Transport-Security`, `Permissions-Policy` (apenas `Feature-Policy` legado) | `curl -D - http://localhost:3000/`; TC-012 falha | A05 |
| CORS | `Access-Control-Allow-Origin: *` em `/` | mesma resposta | A05 |
| Exposição de info | Header `X-Recruiting: /#/jobs`; `/ftp` → HTTP 200; `/metrics` → HTTP 200; JSON malformado → HTTP 500 | curl, TC-013/014/015 | A05 |
| Controle de acesso | `/rest/basket/{id}` legível por outro usuário; `/api/Users` retorna outros usuários; rota admin acessível por usuário comum | TC-007, TC-010, TC-008 | A01 |
| Autenticação | Sem limitação de força bruta (20 logins falhos, sem 403/429); token válido após logout; senha `12345` aceita; login com SQLi aceito | TC-017, 018, 016, 005 | A07, A03 |
| XSS | Marcador HTML na busca é interpretado | TC-006 | A03 |
| Cookies | Não verificado: nenhum cookie definido por `GET /` (sem `Set-Cookie`). O login guarda o JWT em `localStorage` (`cy.window().its("localStorage.token")` em `auth.page.ts`) e as flags (`HttpOnly`, `Secure`, `SameSite`) após login **não** foram inspecionadas | `auth.page.ts` | A02/A07 |
| Dependências | `npm audit` 0 vulnerabilidades (dev+prod); sem audit automatizado no CI | comandos acima | A06 |
| Segredos | Varredura de `git log -p --all` por `AKIA…`, `ghp_…`, chaves privadas, atribuições `api_key=`/`secret=`: **sem ocorrências**. Apenas credenciais de teste nos specs. Nenhum `.env*` versionado; `.gitignore` ignora `.env`, `.env.*` e mantém `!.env.example` | varredura do histórico | A02 |
| CI | `permissions` definido no nível do workflow com `pages: write`/`id-token: write` para **todos** os jobs (inclusive `test`); sem secret scanning, SAST, scan de imagem/container ou SBOM; artefatos retidos 14 dias | `allure-pages.yml` | A05/A08 |
| Container | `bkimminich/juice-shop:latest` sem pin no compose; sem pin por digest | `docker-compose.yml` | A06/A08 |
| Trava de escopo | Boa: `cypress.config.ts` lança erro se `baseUrl` não for localhost; `zap-baseline.sh` recusa outros alvos. Porém a trava compara só `baseUrl`; `cy.request` com URL absoluta a contornaria | `cypress.config.ts:51` | — |

Nota: o Juice Shop é vulnerável de propósito; estes são achados sobre a postura de verificação do *projeto de testes* e o baseline de falhas conhecidas, não defeitos em sistema de produção.

## 7. Riscos

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| Regressões/correções passam despercebidas porque o pipeline aceita qualquer falha conhecida | Alta | Alto | Baseline de falhas esperadas (Fase 1) |
| Testes de UI instáveis corroem a confiança no relatório | Média | Médio | Retries, remover `cy.screenshot` do fluxo, estabilizar seletores |
| Remoção do Electron no Cypress quebra o pipeline ao atualizar | Média | Médio | Migrar para Chrome no CI |
| Comprometimento de action (supply chain, pin por tag) | Baixa | Alto | Pin por SHA + Dependabot |
| Deriva de versão local vs CI esconde falhas específicas do ambiente | Média | Médio | Pin de imagem/digest, fonte única de verdade |
| Introdução do Playwright duplicando helpers/config | Média | Baixo | Módulo compartilhado de dados/config |

## 8. Oportunidades

- Introduzir Playwright junto ao Cypress (regra do projeto; Cypress deve permanecer intacto) para API e multi-browser.
- Converter checagens de vuln. conhecidas em um *registro de falhas esperadas* (JSON por ID de TC) para o CI falhar em regressão e em correção inesperada.
- Módulo compartilhado de dados/config + `.env.example`, reutilizado por Cypress e Playwright.
- `ApiClient` / custom commands para registro/login/cesta.
- ZAP baseline + `npm audit` + secret scanning (gitleaks via Docker) como jobs de CI; publicar SARIF.
- k6 (Docker) para smoke/performance, acessibilidade (axe) e baselines visuais.
- Preencher `docs/execution-report.md` automaticamente a partir dos resultados Allure.
- Enriquecer o Allure: histórico, tendência de retries, links para `bugs/*.md`.

## 9. Roadmap priorizado

Esforço: **P** (≤0,5 dia) · **M** (1–3 dias) · **G** (>3 dias). Impacto: A/M/B. Uma branch por fase (`feat/fase-N-descricao`).

| Fase | Escopo | Esforço | Impacto |
| --- | --- | --- | --- |
| 0 – Higiene | `.env.example`, scripts `typecheck`/`lint`, fixar compose em `v20.2.0`, remover `tests/` vazio, atualizar deps minor, `retries: { runMode: 1 }` e `video: false` exceto em falha | P | M |
| 1 – Confiabilidade do gate | Registro de falhas esperadas substituindo `validate-known-vulnerabilities.cjs`; corrigir flake do TC-004; marcar vulns conhecidas como `skipped`/known-issue no Allure; gatilho de PR + typecheck + `npm audit` no CI; `permissions` mínimas por job | M | **A** |
| 2 – Arquitetura de testes | Helpers/custom commands/`ApiClient` compartilhados, dados centrais, remover duplicação, reforçar asserções (TC-004), TC-016 determinístico | M | A |
| 3 – Cobertura | Checkout, autorização na API admin, JWT, CORS, flags de cookie, injeção na busca via API, lacuna TC-011 | G | A |
| 4 – Playwright | Playwright + TypeScript junto ao Cypress (API + multi-browser); reporter Allure; config compartilhada | G | M |
| 5 – Automação de segurança | ZAP baseline (corrigir portabilidade do `--network host`), gitleaks, scan de imagem Trivy, upload SARIF, Dependabot, actions por SHA — tudo via Docker, apenas localhost | M | A |
| 6 – Quality engineering | k6 smoke, a11y axe, regressão visual, dashboard de qualidade (relatório gerado dos resultados), docs em `docs/` | G | M |

## 10. Perguntas em aberto

1. Vulnerabilidades conhecidas devem ser reportadas como **falhas esperadas** (pipeline verde, falha só em mudança) ou continuar como falhas?
2. Qual versão do Juice Shop é a canônica: `latest` ou `20.2.0` fixa?
3. O Playwright deve reutilizar a convenção de ID de TC/metadados Allure (mesmos nomes de teste)?
4. A publicação no GitHub Pages deve ficar só no push da `main` ou aceitar previews de PR?
5. O navegador Electron do Cypress (depreciado) é aceitável ou o Chrome deve ser obrigatório?
6. Flags de cookie e checagens de JWT entram no escopo (exige sondagem autenticada)?
7. O template `docs/execution-report.md` será gerado automaticamente ou mantido à mão?
8. Quais ferramentas são aceitáveis via Docker (ZAP, gitleaks, Trivy, k6)?

## 11. Verificação da auditoria

- `git status --short` após a auditoria mostra apenas `?? AGENTS.md` (já existente, não rastreado) e `?? docs/AUDIT.md` (este arquivo). Nenhum arquivo rastreado foi modificado.
- Artefatos gerados (`allure-results/`, `cypress/screenshots/`, `cypress/videos/`, `node_modules/`) estão no `.gitignore`.
- Não verificado: flags de cookie após login, conteúdo do JWT, execução do CI no GitHub (sem acesso), execução de `zap-baseline.sh` no Docker Desktop Windows.
