# Quality and security CI / CI de qualidade e segurança

## Platform and profiles / Plataforma e perfis

**EN:** GitHub Actions was selected because this repository already used it. The single entry point is [quality-security.yml](../.github/workflows/quality-security.yml), replacing the former Pages-only workflow. Every application test and DAST scan targets exactly `http://localhost:3000`. SAST, secret scanning and SCA inspect this repository; Trivy image scanning inspects the project's Juice Shop image.

**PT-BR:** Foi escolhido o GitHub Actions porque o repositório já o utilizava. A entrada única é [quality-security.yml](../.github/workflows/quality-security.yml), substituindo o workflow anterior dedicado ao Pages. Todo teste da aplicação e scan DAST aponta exatamente para `http://localhost:3000`. SAST, busca de segredos e SCA inspecionam este repositório; o scan de imagem Trivy inspeciona a imagem Juice Shop do projeto.

| Profile / Perfil | Trigger / Gatilho | Required producers / Produtores obrigatórios |
| --- | --- | --- |
| `quick` | Pull request targeting `main`; manual / Solicitação de alteração para `main`; manual | Lint + actionlint, Gitleaks, Semgrep, Trivy SCA, Chromium smoke (4), Playwright `@security` (20), ZAP baseline (7 jobs) / mesmos 7 jobs |
| `full` | Push to `main`; manual default / Push na `main`; padrão manual | Quick checks with all 5 functional Playwright cases; Cypress (17), Trivy image + CycloneDX SBOM (9 jobs) / Verificações rápidas com os 5 casos funcionais completos; Cypress (17), Trivy da imagem + SBOM CycloneDX (9 jobs) |
| `nightly` | Daily `04:00 UTC` (`01:00` São Paulo); manual / Diário `04:00 UTC` (`01:00` São Paulo); manual | Full regression, Chromium + Firefox + WebKit, ZAP full instead of baseline (11 jobs) / Regressão completa, Chromium + Firefox + WebKit, ZAP full no lugar do baseline (11 jobs) |

**EN:** Producers run in parallel after profile selection. Each browser has its own runner and isolated Juice Shop. `quality-gate` always collects the evidence, including after a producer failure. Optional jobs may be skipped only in the quick profile. Configure the **quality-gate** check as required in branch protection to enforce merging restrictions. Scheduled workflows use the default branch; cron starts after this workflow reaches it.

**PT-BR:** Os produtores rodam em paralelo após a seleção do perfil. Cada navegador tem seu próprio runner e Juice Shop isolado. O `quality-gate` sempre coleta as evidências, inclusive após falha de um produtor. Jobs opcionais podem ser omitidos somente no perfil rápido. Configure a verificação **quality-gate** como obrigatória na proteção da branch para impedir merges reprovados. Workflows agendados usam a branch padrão; o cron começa quando este workflow chegar a ela.

## Tools, caches and evidence / Ferramentas, caches e evidências

**EN:** Node 24 executes the locked project dependencies. The shared setup action caches npm downloads, Playwright browsers by OS/browser/lockfile and Cypress binaries by OS/lockfile. Browser system dependencies are installed even on a cache hit. Trivy databases use daily caches. External scanners, actionlint and Java for Allure run in Docker; their immutable digests are recorded in [tool-images.json](../.github/tool-images.json). Local Semgrep rules are in [.semgrep.yml](../.semgrep.yml), with no remote rule dependency. `npm run lint` checks both TypeScript projects, JavaScript syntax and JSON; the CI lint producer additionally validates Actions YAML with actionlint and ShellCheck.

**PT-BR:** O Node 24 executa as dependências fixadas no lockfile. A action compartilhada guarda downloads npm, navegadores Playwright por SO/navegador/lockfile e binários Cypress por SO/lockfile. As dependências de sistema do navegador são instaladas mesmo com cache encontrado. As bases Trivy usam caches diários. Scanners externos, actionlint e Java do Allure rodam em Docker; seus digests imutáveis estão em [tool-images.json](../.github/tool-images.json). As regras Semgrep locais ficam em [.semgrep.yml](../.semgrep.yml), sem dependência de regras remotas. O `npm run lint` verifica ambos os projetos TypeScript, sintaxe JavaScript e JSON; o produtor de lint do CI também valida o YAML das Actions com actionlint e ShellCheck.

**EN:** Each producer writes native reports plus `job.json` under `reports/ci/<job>/`. Artifacts `quality-*` retain these reports, Allure input, screenshots, videos and Playwright traces for 7 days. The image artifact includes `sbom.cdx.json`; ZAP includes HTML, JSON and SARIF. The DAST job feeds smoke traffic through `ZAP_PROXY=http://localhost:8080`, verifies proxy coverage, then scans. Reports are gathered into `.ci-artifacts/` without flattening filenames. No `.env`, authentication state or image archive is uploaded.

**PT-BR:** Cada produtor grava relatórios nativos e `job.json` em `reports/ci/<job>/`. Artefatos `quality-*` preservam esses relatórios, entradas Allure, screenshots, vídeos e traces Playwright por 7 dias. O artefato da imagem inclui `sbom.cdx.json`; o ZAP inclui HTML, JSON e SARIF. O job DAST alimenta tráfego smoke por `ZAP_PROXY=http://localhost:8080`, verifica a cobertura do proxy e então faz o scan. Os relatórios são reunidos em `.ci-artifacts/` preservando os diretórios. Nenhum `.env`, estado de autenticação ou arquivo de imagem é enviado.

**EN:** The gate appends its verdict to the GitHub job summary and uploads `reports/quality-gate.json` and `reports/quality-gate.md` as `quality-gate-summary`, including when the gate rejects the run. Successful runs upload `sanitized-allure-site` after report generation and sanitization pass. Both artifacts are retained for 14 days. SARIF is available in the ZAP artifact for each profile. The workflow token defaults to `contents: read`.

**PT-BR:** O gate adiciona seu resultado ao resumo do job GitHub e envia `reports/quality-gate.json` e `reports/quality-gate.md` no artefato `quality-gate-summary`, inclusive quando o gate reprova a execução. Execuções aprovadas enviam `sanitized-allure-site` depois que a geração e a sanitização do relatório passam. Ambos os artefatos ficam disponíveis por 14 dias. O SARIF fica no artefato do ZAP de cada perfil. O token padrão do workflow tem `contents: read`.

**EN:** To enable public deployment, select **GitHub Actions** in **Settings → Pages**, review the `github-pages` environment, and set `PUBLISH_ALLURE_PAGES=true` in the repository's Actions variables. This enables the Pages job on successful pushes to `main`. Only that job has `pages: write` and `id-token: write`. Follow the [Allure publication policy](publication-policy.md).

**PT-BR:** Para habilitar a publicação pública, selecione **GitHub Actions** em **Settings → Pages**, revise o ambiente `github-pages` e defina `PUBLISH_ALLURE_PAGES=true` nas variáveis do Actions do repositório. Isso habilita o job de Pages em pushes aprovados para `main`. Somente esse job tem `pages: write` e `id-token: write`. Siga a [política de publicação do Allure](publication-policy.md).

## Gate and exception policy / Gate e política de exceções

**EN:** [quality-gate.ts](../scripts/quality-gate.ts) reads native Gitleaks, Semgrep, Trivy, ZAP, Playwright JSON and Cypress Allure results. Scanner exit codes do not silently accept findings: each producer must complete and produce valid evidence before central evaluation. Missing, malformed, duplicate, wrong-profile or incomplete evidence blocks. Unexpected test failures, skipped cases, flaky runs and unexpected Playwright remediation passes block regardless of severity. Known test vulnerabilities require explicit exceptions. New Critical/High scanner findings block; lower findings remain visible in the report. The gate also checks upstream job failure/cancellation from Actions.

**PT-BR:** O [quality-gate.ts](../scripts/quality-gate.ts) lê resultados nativos Gitleaks, Semgrep, Trivy, ZAP, JSON Playwright e Allure Cypress. Códigos de saída dos scanners não aceitam achados silenciosamente: cada produtor deve concluir e gerar evidência válida antes da avaliação central. Evidência ausente, inválida, duplicada, de outro perfil ou incompleta reprova. Falhas inesperadas de testes, casos omitidos, instabilidade e passes inesperados por correção no Playwright reprovam independentemente da severidade. Vulnerabilidades conhecidas de testes exigem exceções explícitas. Novos achados Críticos/Altos dos scanners reprovam; achados menores continuam visíveis no relatório. O gate também verifica falha/cancelamento dos jobs anteriores no Actions.

**EN:** [security-baseline.json](../security-baseline.json) contains exact finding IDs, source, English/PT-BR justification, responsible owner and `expiresOn`. Wildcards, missing fields, duplicate IDs and invalid dates are rejected. An exception is valid through its UTC expiry date; **any expired entry blocks**, even when its producer is absent from the selected profile. Remove obsolete entries or review and renew them explicitly. CI never refreshes this baseline automatically. To accept a reviewed finding, copy its exact `id` and `source` from the gate JSON and supply every required field. A new CVE/package/version produces a different ID and requires a new review.

**PT-BR:** O [security-baseline.json](../security-baseline.json) contém IDs exatos dos achados, origem, justificativa em inglês/PT-BR, responsável e `expiresOn`. Curingas, campos ausentes, IDs duplicados e datas inválidas são rejeitados. A exceção é válida até sua data de expiração em UTC; **qualquer item expirado reprova**, mesmo quando seu produtor está ausente do perfil escolhido. Remova itens obsoletos ou revise e renove explicitamente. O CI nunca atualiza esse baseline automaticamente. Para aceitar um achado revisado, copie seu `id` e `source` exatos do JSON do gate e preencha todos os campos obrigatórios. Uma nova combinação CVE/pacote/versão gera outro ID e exige nova revisão.

**EN:** The initial baseline records 96 observed exceptions, owned by `QE / AppSec maintainers`, expiring **2026-12-31**: 12 Cypress known failures, 16 Playwright expected failures and 68 High/Critical image CVEs. Image exceptions are temporary acceptance for this disposable local laboratory, not a claim that operating-system CVEs are intentional Juice Shop challenges. Review the image and upgrade before expiry. The current Juice Shop `latest` tag can change; changed CVEs are deliberately subject to the gate. There are no preaccepted secrets, SAST findings or dependency CVEs from the repository.

**PT-BR:** O baseline inicial registra 96 exceções observadas, sob responsabilidade de `QE / AppSec maintainers`, com vencimento em **2026-12-31**: 12 falhas conhecidas Cypress, 16 falhas esperadas Playwright e 68 CVEs Altos/Críticos da imagem. Exceções da imagem são aceite temporário para este laboratório local descartável; não significam que CVEs do sistema operacional sejam desafios intencionais do Juice Shop. Revise a imagem e atualize antes do vencimento. A tag atual `latest` do Juice Shop pode mudar; CVEs alterados são intencionalmente avaliados pelo gate. Não há segredos, achados SAST ou CVEs das dependências do repositório previamente aceitos.

## Local reproduction / Reprodução local

**EN:** Prerequisites: Docker running, Node 24 and project dependencies (`npm ci`), with the project browser runtimes available. The commands below produce the complete profile. On POSIX shells use `export QG_PROFILE=full` instead of the PowerShell assignment. Scanners access registries/advisory feeds to obtain tooling and vulnerability data; application probes remain fixed to the local target. Jobs may be run separately; locally, keep Cypress and Playwright sequential because they share one application.

**PT-BR:** Pré-requisitos: Docker ativo, Node 24 e dependências do projeto (`npm ci`), com os navegadores do projeto disponíveis. Os comandos abaixo produzem o perfil completo. Em shells POSIX use `export QG_PROFILE=full` no lugar da atribuição PowerShell. Scanners acessam registros/bases de avisos para obter ferramentas e dados de vulnerabilidades; sondagens da aplicação permanecem fixadas no alvo local. Os jobs podem ser executados separadamente; localmente, mantenha Cypress e Playwright sequenciais porque compartilham uma aplicação.

```powershell
$env:QG_PROFILE = 'full'
npm run ci:run -- lint
npm run ci:run -- gitleaks
npm run ci:run -- semgrep
npm run ci:run -- sca
npm run sec:zap:up
$env:ZAP_PROXY = 'http://localhost:8080'
npm run ci:run -- playwright chromium
Remove-Item Env:ZAP_PROXY
npm run sec:zap:verify-proxy
npm run ci:run -- security
npm run ci:run -- cypress
npm run ci:run -- zap-baseline
docker pull bkimminich/juice-shop:latest
npm run ci:run -- trivy-image
npm run quality:gate -- --profile full
npm run quality:gate:verify
npm run ci:allure -- reports/ci
docker compose down
```

**EN:** `quality:gate:verify` uses these real full-profile reports. It temporarily injects one fictitious High SCA finding, a critical functional failure and an expired baseline entry, checks rejection, and restores original report/baseline bytes in `finally`. It also verifies missing evidence fails and restored evidence passes. Evidence is saved in `reports/quality-gate-checks/verification.json` plus each case's JSON/Markdown. A reported demonstration failure is an expected gate verdict; the verification command itself exits zero only when all controls behave correctly. Use `--reports <artifact-directory>` to evaluate downloaded CI artifacts with the main gate. Fresh output is required for each profile; do not mix old full/nightly evidence into a quick run.

**PT-BR:** O `quality:gate:verify` usa esses relatórios reais do perfil completo. Ele injeta temporariamente um achado Alto SCA fictício, uma falha funcional crítica e uma exceção expirada, verifica a reprovação e restaura os bytes originais dos relatórios/baseline em `finally`. Também verifica que evidência ausente reprova e que a evidência restaurada aprova. A evidência fica em `reports/quality-gate-checks/verification.json`, além do JSON/Markdown de cada caso. Uma reprovação demonstrada é um resultado esperado do gate; o comando de verificação só termina com zero quando todos os controles funcionam corretamente. Use `--reports <diretório-dos-artefatos>` para avaliar artefatos de CI baixados com o gate principal. Cada perfil exige saída nova; não misture evidências antigas de full/nightly em uma execução quick.

## Recorded acceptance / Aceite registrado

**EN:** Local execution on 2026-10-25, branch `feat/fase-4-quality-security-pipeline`. These are actual reports, not synthesized clean scanner fixtures. GitHub-hosted execution, the nightly active scan and the three-browser regression have not been executed in this phase; their YAML and required-job routing were validated locally.

**PT-BR:** Execução local em 2026-10-25, branch `feat/fase-4-quality-security-pipeline`. São relatórios reais, não fixtures artificiais de scanners sem achados. A execução hospedada no GitHub, o scan ativo noturno e a regressão nos três navegadores não foram executados nesta fase; seu YAML e o roteamento de jobs obrigatórios foram validados localmente.

| Verification / Verificação | Observed result / Resultado observado |
| --- | --- |
| TypeScript, syntax, JSON; actionlint 1.7.12 + ShellCheck | Passed / Aprovados |
| Gitleaks; Semgrep; Trivy lockfile SCA | No findings / Sem achados |
| Functional Playwright through ZAP / Playwright funcional pelo ZAP | 5 passed; proxy traffic verified / 5 aprovados; tráfego no proxy confirmado |
| PR smoke through ZAP / Smoke de PR pelo ZAP | 4 selected, 4 passed / 4 selecionados, 4 aprovados |
| Playwright security | 4 passed + 16 expected failures / 4 aprovados + 16 falhas esperadas |
| Cypress | 5 passed + 12 `KNOWN_VULNERABILITY`; gate recognized all 17 / 5 aprovados + 12 `KNOWN_VULNERABILITY`; gate reconheceu todos os 17 |
| ZAP baseline | Passive scan completed; HTML, JSON, SARIF / Scan passivo concluído; HTML, JSON, SARIF |
| Trivy image; SBOM | 181 CVEs, 68 High/Critical; nonempty CycloneDX / 181 CVEs, 68 Altos/Críticos; CycloneDX preenchido |
| Real full gate / Gate full real | Exit 0; 9 producers, 242 unique findings, 96 accepted, 0 new blocking findings / Saída 0; 9 produtores, 242 achados únicos, 96 aceitos, 0 novos bloqueantes |
| Fictitious High / Alto fictício | Exit 1: `CVE-2099-QE-FICTITIOUS`; restored / Saída 1; restaurado |
| Critical test, expiry, missing/empty evidence, wrong profile / Teste crítico, vencimento, evidência ausente/vazia, perfil errado | Each rejected / Todos reprovados |
| Restored reports / Relatórios restaurados | Exit 0; byte restoration verified / Saída 0; restauração dos bytes verificada |
| Aggregate Allure / Allure agregado | 42 results; sanitization passed / 42 resultados; sanitização aprovada |

## Pre-merge review / Revisão pré-merge (2026-11-24)

**EN:** The 96 exact exceptions expire on 2026-12-31, 37 days after this review. The review used a 30-day window for imminent expiry. The gate was checked at the UTC date boundary and rejects all 96 entries from 2027-01-01.

**PT-BR:** As 96 exceções exatas vencem em 31/12/2026, 37 dias após esta revisão. A revisão usou uma janela de 30 dias para identificar vencimentos próximos. O gate foi verificado na virada da data em UTC e reprova as 96 entradas a partir de 01/01/2027.

| Check / Verificação | Result / Resultado |
| --- | --- |
| `npm run lint` | Passed / Aprovado |
| `npm run pw:typecheck` | Passed / Aprovado |
| `npm run quality:gate:verify` | Passed using existing local reports; original bytes restored / Aprovado com relatórios locais existentes; bytes originais restaurados |
| YAML and workflow checks / Verificações de YAML e do workflow | Workflow, composite action, Semgrep configuration and Compose passed. Triggers, permissions and artifact guards verified / Workflow, action composta, configuração Semgrep e Compose aprovados. Gatilhos, permissões e condições de upload verificados |
| Docker-dependent checks / Verificações dependentes de Docker | Docker daemon unavailable for actionlint and fresh scans / Daemon Docker indisponível para actionlint e novas varreduras |

**EN:** For the first rollout, publish the feature branch commits and open or update a PR targeting `main`. Check the `quick` run under the PR's **Checks** tab and review `quality-gate-summary` and the ZAP SARIF. GitHub enables **Run workflow** once the workflow file is on the default branch. After merging, check the `full` run triggered by the push to `main` and verify the CycloneDX SBOM in `quality-trivy-image`. The local checks used existing scan evidence.

**PT-BR:** Na primeira publicação, envie os commits da branch e abra ou atualize um PR para `main`. Confira a execução `quick` na aba **Checks** do PR e revise `quality-gate-summary` e o SARIF do ZAP. O GitHub disponibiliza **Run workflow** quando o arquivo do workflow está na branch padrão. Depois do merge, confira a execução `full` disparada pelo push na `main` e verifique o SBOM CycloneDX em `quality-trivy-image`. As verificações locais usaram as evidências de scan existentes.

## First PR run fixes / Correções da primeira execução do PR

**EN:** The project declares `@types/node` for Node 24 so `npm ci` installs the declarations used by both TypeScript projects. The lockfile resolves Cypress's `systeminformation` dependency to `5.33.25`, which includes the fix for CVE-2026-116576. The passive ZAP job assigns ownership of its report directory to the container's `zap` user and checks write access before it collects evidence. [Dependency advisory](https://github.com/advisories/GHSA-3f7j-7jwc-fxfj)

**PT-BR:** O projeto declara `@types/node` para Node 24, de modo que `npm ci` instale as declarações usadas pelos dois projetos TypeScript. O lockfile resolve a dependência `systeminformation` do Cypress para `5.33.25`, que inclui a correção de CVE-2026-116576. O job passivo do ZAP atribui a pasta de relatórios ao usuário `zap` do contêiner e verifica a permissão de escrita antes de coletar evidências. [Aviso da dependência](https://github.com/advisories/GHSA-3f7j-7jwc-fxfj)

**EN:** A clean `npm ci` checkout on Windows passed `npm run lint` and `npm run pw:typecheck`. The npm lockfile audit reported one Moderate and zero High/Critical findings. The gate verification passed with the stored reports. Workflow YAML and Compose configuration passed local checks. The ZAP write check still requires the GitHub runner or a running Docker daemon.

**PT-BR:** Em uma cópia limpa no Windows, `npm ci`, `npm run lint` e `npm run pw:typecheck` passaram. A auditoria npm do lockfile reportou um achado Moderado e zero Altos/Críticos. A verificação do gate passou com os relatórios existentes. O YAML do workflow e a configuração do Compose passaram nas verificações locais. A verificação de escrita do ZAP ainda depende do runner do GitHub ou de um daemon Docker ativo.
