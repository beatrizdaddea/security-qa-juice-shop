# Local DAST with ZAP / DAST local com ZAP

The only scan target is **http://localhost:3000**, the project's Docker Juice Shop. ZAP runs as a daemon using `ghcr.io/zaproxy/zaproxy:stable`; Playwright functional traffic, passive baseline and the optional nightly active scan share its session. Cypress remains independent.

O único alvo de scan é **http://localhost:3000**, o Juice Shop Docker do projeto. O ZAP executa como daemon usando `ghcr.io/zaproxy/zaproxy:stable`; tráfego funcional do Playwright, baseline passivo e scan ativo noturno opcional compartilham sua sessão. Cypress permanece independente.

## Stack and scope / Stack e escopo

Juice Shop joins the dedicated Compose bridge `dast`. ZAP uses `network_mode: service:juice-shop`, sharing that container's network namespace: `localhost:3000` inside ZAP is the same application reached by the host. Only host loopback ports 3000 (application) and 8080 (proxy) are published. Each service has a healthcheck; ZAP waits for the application and is healthy only after scope/guards are configured. This is a shared bridge, not an outbound firewall.

Juice Shop participa da bridge Compose dedicada `dast`. ZAP usa `network_mode: service:juice-shop`, compartilhando o namespace de rede desse container: `localhost:3000` dentro do ZAP é a mesma aplicação acessada pelo host. Somente portas no loopback do host são publicadas: 3000 (aplicação) e 8080 (proxy). Cada serviço possui healthcheck; ZAP aguarda o aplicativo e fica saudável somente após configurar escopo/travas. É uma bridge compartilhada, não um firewall de saída.

Scope is locked in [.zap/context.json](../.zap/context.json): an anchored include accepts only the exact HTTP origin; an anchored negative exclude rejects every other origin. Redirect endpoints, logout/reset-password and socket paths are excluded from crawling/scanning. No CLI target override is accepted. Startup verifies the target/configuration and sets Protected mode, in-scope-only passive scanning, context-bound spider and in-scope-only active scanning.

O escopo é fixado em [.zap/context.json](../.zap/context.json): uma inclusão ancorada aceita somente a origem HTTP exata; uma exclusão negativa ancorada rejeita todas as outras origens. Endpoints de redirecionamento, logout/reset de senha e sockets são excluídos do crawling/scan. Nenhum alvo alternativo pela CLI é aceito. A inicialização verifica alvo/configuração e ativa modo protegido, scan passivo somente no escopo, spider vinculado ao contexto e scan ativo somente no escopo.

The proxy guard drops other destinations before forwarding. The HTTP Sender guard also covers automated scanner/spider traffic and redirect hops: an out-of-scope message is rewritten before transport to a harmless fixed path on the local application, with credentials/body removed. Healthchecks and scan polling verify both guards remain enabled. ZAP starts with `-silent`, avoiding unsolicited update requests. The bridge itself does not prevent unrelated processes from making network requests.

A trava do proxy descarta outros destinos antes do encaminhamento. A trava HTTP Sender também cobre tráfego automático do scanner/spider e saltos de redirecionamento: uma mensagem fora do escopo é reescrita antes do transporte para caminho fixo inofensivo na aplicação local, removendo credenciais/corpo. Healthchecks e polling do scan verificam que ambas as travas permanecem habilitadas. ZAP inicia com `-silent`, evitando requisições espontâneas de atualização. A bridge em si não impede requisições de rede de processos não relacionados.

## Start / Subir

Use the existing Node dependencies (`npm ci`), configured Playwright Chromium and Docker Desktop. ZAP, Python and Java execute inside Docker; no local scanner/Python/Java installation is required.

Use as dependências Node existentes (`npm ci`), Chromium configurado do Playwright e Docker Desktop. ZAP, Python e Java executam no Docker; não é necessário instalar scanner/Python/Java localmente.

```sh
npm run sec:zap:up
docker compose ps
```

The start command creates a random `ZAP_API_KEY` in the git-ignored `.env` when missing and waits for both services to become healthy. Keep the key local. `.env.example` contains no secret. The API is authenticated and accepts loopback clients inside the shared namespace; control commands use `docker compose exec`, without exposing the key in host command arguments. Do not recreate Juice Shop alone while ZAP shares its namespace: use the complete stack lifecycle.

O comando de inicialização cria uma `ZAP_API_KEY` aleatória no `.env` ignorado pelo Git quando ausente e aguarda os dois serviços saudáveis. Mantenha a chave local. `.env.example` não contém segredo. A API é autenticada e aceita clientes loopback dentro do namespace compartilhado; comandos de controle usam `docker compose exec`, sem expor a chave nos argumentos de comandos do host. Não recrie somente Juice Shop enquanto ZAP compartilha seu namespace: use o ciclo completo da stack.

Direct `docker compose up -d --wait` also works: without a configured API key, the daemon generates an ephemeral container-local key, readable only by its user. The npm start flow is preferred when keeping the key in `.env`.

`docker compose up -d --wait` direto também funciona: sem chave de API configurada, o daemon gera chave efêmera local ao container, legível somente pelo seu usuário. Prefira o fluxo npm quando quiser manter a chave no `.env`.

## Feed ZAP with functional tests / Alimentar ZAP com testes funcionais

PowerShell, with the stack healthy:

PowerShell, com a stack saudável:

```powershell
$env:ZAP_PROXY = 'http://localhost:8080'
npm run pw:test
npm run sec:zap:verify-proxy
Remove-Item Env:ZAP_PROXY
```

POSIX equivalent:

Equivalente POSIX:

```sh
ZAP_PROXY=http://localhost:8080 npm run pw:test
npm run sec:zap:verify-proxy
```

`ZAP_PROXY` is optional and accepts only the exact local proxy URL. Browser contexts, Playwright's API fixture, global registration/login setup and security API fixtures all use it. `ignoreHTTPSErrors` is enabled only when that variable is set; direct execution keeps normal certificate verification. Chromium's Playwright proxy launcher handles the implicit localhost bypass. Service workers are blocked so requests reach the proxy. Do not add localhost to a proxy bypass list.

`ZAP_PROXY` é opcional e aceita somente a URL exata do proxy local. Contextos do navegador, fixture de API do Playwright, setup global de cadastro/login e fixtures de API de segurança usam essa opção. `ignoreHTTPSErrors` é habilitado somente quando a variável está definida; a execução direta mantém a verificação normal de certificados. O inicializador Chromium do Playwright trata o bypass implícito de localhost. Service workers são bloqueados para que requisições cheguem ao proxy. Não adicione localhost a uma lista de bypass.

`sec:zap:verify-proxy` requires actual captured browser **and** Playwright API/setup requests, verifies registration/login/search/basket routes and checks that the session contains only the local site. It writes a credential-free `proxy-coverage.json`. A successful browser test alone is insufficient proof of proxy usage. Run this immediately after the functional suite on a fresh stack to avoid stale session evidence.

`sec:zap:verify-proxy` exige requisições reais capturadas do navegador **e** de API/setup Playwright, verifica rotas de cadastro/login/busca/cesta e confirma que a sessão contém somente o site local. Grava `proxy-coverage.json` sem credenciais. Um teste de navegador aprovado sozinho não comprova uso do proxy. Execute imediatamente após a suíte funcional em uma stack nova para evitar evidência de sessão antiga.

## Baseline and reports / Baseline e relatórios

```sh
npm run sec:zap:baseline
npm run sec:zap:report
```

Baseline uses the running daemon, adds a context-bound traditional spider (one-minute crawl budget, depth 3, two threads, at most 20 children per node) and waits for the passive queue to drain. It starts no active scan and retains the SPA/API routes discovered through Playwright. The baseline command already generates all three reports; `sec:zap:report` refreshes exports from the same session without starting another crawl/attack. A traditional spider alone does not exhaust an Angular SPA.

Baseline usa o daemon em execução, adiciona spider tradicional vinculado ao contexto (orçamento de crawling de um minuto, profundidade 3, duas threads, no máximo 20 filhos por nó) e aguarda a fila passiva esvaziar. Não inicia scan ativo e preserva rotas SPA/API descobertas pelo Playwright. O comando baseline já gera os três relatórios; `sec:zap:report` atualiza exportações da mesma sessão sem iniciar novo crawling/ataque. Um spider tradicional sozinho não cobre integralmente uma SPA Angular.

| File / Arquivo | Content / Conteúdo |
| --- | --- |
| `reports/security/zap/zap.html` | Native HTML report / Relatório HTML nativo |
| `reports/security/zap/zap.json` | Native traditional JSON / JSON tradicional nativo |
| `reports/security/zap/zap.sarif` | Native SARIF 2.1.0 / SARIF 2.1.0 nativo |
| `reports/security/zap/policy.json` | FAIL/WARN/IGNORE gate and justifications / Gate FAIL/WARN/IGNORE e justificativas |
| `reports/security/zap/scan.json` | Scan mode, completion and active-scan indicator / Modo, conclusão e indicador de scan ativo |
| `reports/security/zap/proxy-coverage.json` | Captured functional routes and traffic counts / Rotas funcionais capturadas e contagens de tráfego |

The Report Generation add-on exports all formats using the same local context/site. JSON/SARIF structure and local finding locations are validated. API keys, JWTs and bearer credentials are redacted from exports. Generated reports remain git-ignored and should be reviewed before external publication; sanitized exports are not a complete privacy audit of application data.

O add-on Report Generation exporta todos os formatos usando o mesmo contexto/site local. Estrutura JSON/SARIF e localizações dos achados são validadas. Chaves de API, JWTs e credenciais bearer são ocultados nas exportações. Relatórios gerados ficam ignorados pelo Git e devem ser revisados antes de publicação externa; exportações sanitizadas não constituem auditoria completa de privacidade dos dados da aplicação.

## Rule policy / Política de regras

[.zap/rules.tsv](../.zap/rules.tsv) has four tab-separated fields: rule ID, policy, English justification and PT-BR justification. Default policy is FAIL for medium/high findings and WARN for low/informational findings. Documented exceptions can downgrade intentional lab weaknesses. IGNORE changes only the gate: native reports retain the finding, and policy.json records the exception. No global success override is used.

[.zap/rules.tsv](../.zap/rules.tsv) contém quatro campos separados por tabulação: ID da regra, política, justificativa em inglês e justificativa PT-BR. A política padrão é FAIL para achados médios/altos e WARN para baixos/informativos. Exceções documentadas podem reclassificar fraquezas intencionais do laboratório. IGNORE altera somente o gate: relatórios nativos preservam o achado, e policy.json registra a exceção. Não há sobrescrita global de sucesso.

Exit codes: **0** completed with WARN/IGNORE only; **1** completed with FAIL findings; **3** infrastructure/scope/report/incomplete-scan error; **64** invalid wrapper arguments. Findings do not prevent report generation. A failed/incomplete scan must not be presented as a clean application.

Códigos de saída: **0** concluído somente com WARN/IGNORE; **1** concluído com achados FAIL; **3** erro de infraestrutura/escopo/relatório/scan incompleto; **64** argumentos inválidos do wrapper. Achados não impedem geração de relatórios. Um scan com erro/incompleto não deve ser apresentado como aplicação segura.

## Nightly active scan / Scan ativo noturno

```sh
npm run sec:zap:full
```

Run on a fresh disposable local stack after feeding functional traffic. This starts active scanning explicitly, with the same guards/context, two threads per host, 50 ms delay, up to two minutes per rule and a 15-minute active-scan budget; crawl budget increases to three minutes/depth 6. OAST/out-of-band, SSRF, Log4Shell and denial-of-service rules are excluded to avoid external callbacks or resource-exhaustion tests. This is a bounded active scan, not exhaustive coverage. Active requests can modify the intentionally vulnerable database. This command is suitable for a nightly job; no scheduler is created by this phase.

Execute em stack local nova e descartável após alimentar tráfego funcional. Isso inicia scan ativo explicitamente, com as mesmas travas/contexto, duas threads por host, atraso de 50 ms, até dois minutos por regra e orçamento ativo de 15 minutos; crawling aumenta para três minutos/profundidade 6. Regras OAST/fora de banda, SSRF, Log4Shell e negação de serviço são excluídas para evitar callbacks externos ou testes de esgotamento de recursos. É um scan ativo limitado, não cobertura exaustiva. Requisições ativas podem modificar o banco propositalmente vulnerável. O comando é adequado para job noturno; esta fase não cria agendamento.

## Cleanup / Limpeza

```sh
docker compose down
```

This removes both containers and their shared network. ZAP's session/database and Juice Shop's test data live in container writable layers; no named state volume is created. Reports and the ignored local `.env` intentionally remain on disk. Export before shutdown: a new stack starts an empty ZAP session. The legacy shell baseline entry point now delegates to the same scoped daemon flow.

Isso remove os dois containers e sua rede compartilhada. Sessão/banco do ZAP e dados de teste do Juice Shop ficam nas camadas graváveis dos containers; nenhum volume nomeado de estado é criado. Relatórios e o `.env` local ignorado permanecem no disco intencionalmente. Exporte antes de desligar: uma stack nova inicia sessão ZAP vazia. A entrada shell legada de baseline agora delega ao mesmo fluxo com daemon e escopo.

## Verification / Verificação

Executed on 2026-10-25 against Juice Shop 20.2.0 with ZAP 2.17.0 (the requested stable Docker image). The baseline completed with an empty passive queue and `activeScanStarted: false`. Its 652 alert instances represent 9 rule types; the policy produced WARN only, preserving findings in all native reports.

Executado em 25/10/2026 contra Juice Shop 20.2.0 com ZAP 2.17.0 (imagem Docker stable solicitada). O baseline concluiu com fila passiva vazia e `activeScanStarted: false`. As 652 instâncias de alertas representam 9 tipos de regra; a política produziu somente WARN, preservando achados nos relatórios nativos.

| Verification / Verificação | Observed result / Resultado observado |
| --- | --- |
| `npm run sec:zap:up` | Both services healthy / Ambos os serviços saudáveis |
| `ZAP_PROXY` + `npm run pw:test` | 5/5 passed through the proxy / 5/5 aprovados pelo proxy |
| `npm run sec:zap:verify-proxy` | 348 local requests, including 151 browser and 6 Playwright API/setup requests; one local site / 348 requisições locais, incluindo 151 do navegador e 6 de API/setup Playwright; um site local |
| `npm run sec:zap:baseline` | Completed, passive queue 0, no active scan, exit 0 / Concluído, fila passiva 0, sem scan ativo, saída 0 |
| `npm run sec:zap:report` | HTML, native JSON and SARIF 2.1.0 generated/validated; 0 FAIL / HTML, JSON nativo e SARIF 2.1.0 gerados/validados; 0 FAIL |
| Direct `npm run pw:test` / `npm run pw:test` direto | 5/5 passed without proxy / 5/5 aprovados sem proxy |
| `npm run pw:security` | 20 executed: 4 secure controls and 16 expected vulnerability failures; exit 0 / 20 executados: 4 controles seguros e 16 falhas esperadas de vulnerabilidade; saída 0 |
| `npm run cy:run` | 17 executed: 5 passed, 12 existing KNOWN_VULNERABILITY failures; existing validator confirmed no unexpected failures / 17 executados: 5 aprovados, 12 falhas KNOWN_VULNERABILITY existentes; validador confirmou ausência de falhas inesperadas |
| TypeScript checks / Verificações TypeScript | Playwright and Cypress passed / Playwright e Cypress aprovados |
| Scope guards / Travas de escopo | Proxy allow/deny and HTTP Sender rewrite verified in Graal.js with in-memory messages; no off-target network request / Permissão/bloqueio do proxy e reescrita HTTP Sender verificados no Graal.js com mensagens em memória; nenhuma requisição de rede fora do alvo |
| Proxy/TLS options / Opções proxy/TLS | Strict proxy URL verified; ignoreHTTPSErrors absent in direct mode and true only in proxy mode / URL exata do proxy verificada; ignoreHTTPSErrors ausente no modo direto e true somente com proxy |
| Nightly full scan / Scan completo noturno | API settings validated; active scan was not executed as part of this passive acceptance run / Opções da API validadas; scan ativo não executado neste aceite passivo |
| `docker compose down` | Both containers and the dedicated network removed; no remaining project containers/networks / Ambos os containers e rede dedicada removidos; nenhum container/rede do projeto restante |

The unused default network from the earlier Compose layout was inspected for project ownership and zero attached containers, then removed during migration. Subsequent stacks use only the declared dedicated network, which normal `docker compose down` removes. Reports and `.env` remained on disk as intended.

A rede default sem uso do Compose anterior foi verificada quanto à propriedade do projeto e ausência de containers conectados e removida durante a migração. Stacks seguintes usam somente a rede dedicada declarada, removida pelo `docker compose down` normal. Relatórios e `.env` permaneceram no disco conforme previsto.

## References / Referências

[ZAP API](https://www.zaproxy.org/docs/api/), [Protected mode](https://www.zaproxy.org/docs/desktop/start/features/modes/), [report generation](https://www.zaproxy.org/docs/desktop/addons/report-generation/api/), [native report templates](https://www.zaproxy.org/docs/desktop/addons/report-generation/templates/), [Playwright proxy configuration](https://playwright.dev/docs/network#http-proxy).

[API ZAP](https://www.zaproxy.org/docs/api/), [modo protegido](https://www.zaproxy.org/docs/desktop/start/features/modes/), [geração de relatórios](https://www.zaproxy.org/docs/desktop/addons/report-generation/api/), [modelos nativos de relatório](https://www.zaproxy.org/docs/desktop/addons/report-generation/templates/), [configuração de proxy Playwright](https://playwright.dev/docs/network#http-proxy).
