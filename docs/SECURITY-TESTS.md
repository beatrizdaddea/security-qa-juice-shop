# Security tests / Testes de segurança

Automated Playwright security verification of OWASP Juice Shop at **http://localhost:3000 only**. Cypress remains independent. IDs TC-019–TC-038 extend the existing case catalog.
Verificação automatizada de segurança com Playwright no OWASP Juice Shop **somente em http://localhost:3000**. Cypress permanece independente. IDs TC-019–TC-038 estendem o catálogo existente.

## Run / Executar

Use the existing Node dependencies (`npm ci`) and Docker Desktop. No additional local security scanner or Java installation is required. The configured Chromium must be available (`npm run pw:install` if needed).
Use as dependências Node existentes (`npm ci`) e Docker Desktop. Nenhum scanner de segurança ou Java local adicional é necessário. O Chromium configurado deve estar disponível (`npm run pw:install` se necessário).

```sh
docker compose up -d juice-shop
npm run pw:security
npm run pw:security:allure
```

Open `allure-report-security/index.html` through a local static server if needed; Playwright also writes `playwright-report-security/`. Results, attachments and reports are git-ignored. Docker runs the Allure Java CLI from the existing npm dependency. The JWT expiration case also uses Docker Compose to call the application's own signer inside the juice-shop container; signing keys never leave it.
Abra `allure-report-security/index.html` por um servidor estático local se necessário; Playwright também grava `playwright-report-security/`. Resultados, anexos e relatórios são ignorados pelo Git. Docker executa a CLI Java do Allure da dependência npm existente. O caso de expiração JWT também usa Docker Compose para chamar o assinador do aplicativo dentro do container juice-shop; as chaves de assinatura nunca saem dele.

## Interpretation / Interpretação

The assertion always describes secure behavior. Only a documented, reproduced finding is marked `test.fail()` immediately before its final assertion, after setup, response checks and sanitized attachments succeed. A remediation becomes an **unexpected pass** and fails the command. Setup/network/timeout errors and new findings fail normally. No skips or blanket exit-code suppression are used.
A asserção sempre descreve comportamento seguro. Somente um achado documentado e reproduzido recebe `test.fail()` imediatamente antes da asserção final, após preparação, verificações de resposta e anexos sanitizados. Uma correção vira **aprovação inesperada** e reprova o comando. Erros de preparação/rede/timeout e novos achados reprovam normalmente. Não há skips nem supressão genérica de código de saída.

Allure groups Suites and Behaviors by OWASP category. Every case has @security, OWASP and severity annotations, epic/feature/severity labels and an OWASP tag. The installed allure-playwright treats expected failures as passed execution: the `known-vuln` tag, justification, **Security outcome** parameter and **security-finding** JSON attachment identify the vulnerability. Green execution does not mean a secure application.
Allure agrupa Suites e Behaviors pela categoria OWASP. Todo caso tem @security, anotações OWASP e severidade, labels epic/feature/severity e tag OWASP. O allure-playwright instalado trata falhas esperadas como execução aprovada: a tag `known-vuln`, justificativa, parâmetro **Resultado de segurança** e anexo JSON **security-finding** identificam a vulnerabilidade. Execução verde não significa aplicação segura.

HTTP requests use a fixed target and disable redirects; browser requests outside the exact origin are blocked, service workers are disabled and sockets are closed. Origin: null tests CORS without contacting another host. Evidence contains relevant request/response and DOM/flags, with credentials and email addresses redacted. Raw traces/videos/screenshots are disabled for this suite because they can expose session secrets.
Requisições HTTP usam alvo fixo e desabilitam redirecionamentos; requisições do navegador fora da origem exata são bloqueadas, service workers são desabilitados e sockets são fechados. Origin: null testa CORS sem contatar outro host. Evidências contêm request/response e DOM/flags relevantes, com credenciais e e-mails ocultados. Traces/vídeos/screenshots brutos ficam desabilitados nesta suíte porque podem expor segredos de sessão.

HSTS/Secure checks on HTTP localhost measure configuration baselines, not HTTPS transport enforcement. JWT lifetime uses an explicit <= 3600-second suite baseline; this is not a universal OWASP limit. Expiration is separately checked with authentic signatures, a working fresh-token control and a genuinely expired token. The A09 case checks response disclosure (secondary A05), not server-side audit log completeness. Test-created accounts/orders remain in the disposable lab database; use a fresh project container when a clean database is required.
Verificações HSTS/Secure em localhost HTTP medem baseline de configuração, não proteção de transporte HTTPS. A validade JWT usa baseline explícito da suíte de <= 3600 segundos; esse não é um limite universal OWASP. A expiração é verificada separadamente com assinaturas autênticas, controle válido aceito e token realmente expirado. O caso A09 verifica exposição na resposta (A05 secundário), não completude dos logs de auditoria. Contas/pedidos de teste permanecem no banco descartável do laboratório; use um container novo do projeto quando precisar de banco limpo.

Search reflects the URL fragment into the DOM in this version (DOM-based XSS), rather than sending each search term to the server. Its evidence therefore includes the initial product API request/response, submitted term, browser route and rendered DOM/execution marker. The order case confirms a real persisted order with products and the same database ID, avoiding the tracking endpoint's synthetic orderId-only fallback.
A busca reflete o fragmento da URL no DOM nesta versão (XSS baseado em DOM), em vez de enviar cada termo ao servidor. Sua evidência inclui request/response inicial da API de produtos, termo enviado, rota do navegador e DOM/marcador de execução. O caso de pedido confirma registro persistido real com produtos e o mesmo ID no banco, evitando o fallback sintético do rastreio que contém apenas orderId.

## Latest full execution / Última execução completa

Completed / Concluída: 2026-10-25T20:03:45.761Z. Runner status / Status da execução: **passed**.

This matrix and the detailed cases below are generated from tests/security/catalog.ts and actual Playwright results by scripts/security-reporter.ts. Full runs validate IDs, titles, tags and annotations; filtered runs leave this document unchanged. Generated machine-readable results: test-results/security-results.json.
Esta matriz e os casos detalhados abaixo são gerados a partir de tests/security/catalog.ts e resultados reais do Playwright por scripts/security-reporter.ts. Execuções completas validam IDs, títulos, tags e anotações; execuções filtradas mantêm este documento. Resultados gerados para leitura automatizada: test-results/security-results.json.

The npm post-run hook also verifies actual Allure OWASP groups/labels, HTTP and finding attachments, JWT redaction, execution outcomes and matrix consistency. For targeted debugging use the Playwright CLI directly with this configuration and --grep; npm run pw:security is the full acceptance command.
O hook pós-execução do npm também verifica grupos/labels OWASP reais do Allure, anexos HTTP e de achados, ocultação de JWT, resultados de execução e consistência da matriz. Para depuração direcionada use a CLI Playwright diretamente com esta configuração e --grep; npm run pw:security é o comando completo de aceite.

| Test / Teste | OWASP 2021 | Severity / Severidade | Result / Resultado |
| --- | --- | --- | --- |
| TC-019 anonymous administration access is denied / acesso anônimo à administração negado | A01:2021 | critical / crítica | Secure control passed / Controle seguro aprovado |
| TC-020 customer administration access is denied / acesso de cliente à administração negado | A01:2021 | critical / crítica | Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada) |
| TC-021 another customer's basket is private / cesta de outro cliente é privada | A01:2021 | critical / crítica | Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada) |
| TC-022 another customer's order is private / pedido de outro cliente é privado | A01:2021 | critical / crítica | Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada) |
| TC-023 Content-Security-Policy is configured safely / Content-Security-Policy configurado com segurança | A05:2021 | normal / normal | Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada) |
| TC-024 Strict-Transport-Security is configured safely / Strict-Transport-Security configurado com segurança | A02:2021 | normal / normal | Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada) |
| TC-025 X-Frame-Options is configured safely / X-Frame-Options configurado com segurança | A05:2021 | normal / normal | Secure control passed / Controle seguro aprovado |
| TC-026 X-Content-Type-Options is configured safely / X-Content-Type-Options configurado com segurança | A05:2021 | normal / normal | Secure control passed / Controle seguro aprovado |
| TC-027 Referrer-Policy is configured safely / Referrer-Policy configurado com segurança | A05:2021 | normal / normal | Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada) |
| TC-028 CORS restricts an opaque origin on private data / CORS restringe origem opaca em dados privados | A05:2021 | normal / normal | Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada) |
| TC-029 FTP listing is not public / listagem FTP não é pública | A05:2021 | normal / normal | Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada) |
| TC-030 metrics are not public / métricas não são públicas | A05:2021 | normal / normal | Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada) |
| TC-031 SQL injection cannot authenticate / injeção SQL não autentica | A03:2021 | critical / crítica | Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada) |
| TC-032 search encodes reflected HTML / busca codifica HTML refletido | A03:2021 | critical / crítica | Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada) |
| TC-033 search never executes reflected script / busca nunca executa script refletido | A03:2021 | critical / crítica | Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada) |
| TC-034 server rejects a weak password / servidor rejeita senha fraca | A07:2021 | normal / normal | Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada) |
| TC-035 browser token cookie has protective flags / cookie de token tem flags de proteção | A07:2021 | critical / crítica | Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada) |
| TC-036 JWT has a bounded lifetime / JWT possui validade limitada | A07:2021 | normal / normal | Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada) |
| TC-037 server rejects an authentically signed expired JWT / servidor rejeita JWT expirado com assinatura autêntica | A07:2021 | critical / crítica | Secure control passed / Controle seguro aprovado |
| TC-038 malformed JSON produces no verbose internal error / JSON malformado não gera erro interno verboso | A09:2021 | normal / normal | Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada) |

## Case details / Detalhes dos casos

### TC-019

1. **ID:** TC-019
   **ID:** TC-019
2. **Title:** anonymous administration access is denied
   **Título:** acesso anônimo à administração negado
3. **Precondition:** Juice Shop is available at http://localhost:3000.
   **Pré-condição:** Juice Shop disponível em http://localhost:3000.
4. **Steps:** Open /#/administration without a session; request /api/Users.
   **Passos:** Abra /#/administration sem sessão; consulte /api/Users.
5. **Expected result:** No administration component; users API returns 401/403.
   **Resultado esperado:** Componente administrativo ausente; API de usuários retorna 401/403.
6. **Actual result:** Observed: `{"administrationVisible":false,"usersApiStatus":401,"route":"http://localhost:3000/#/administration"}`.
   **Resultado obtido:** Observado: `{"administrationVisible":false,"usersApiStatus":401,"route":"http://localhost:3000/#/administration"}`.
7. **Status:** Secure control passed / Controle seguro aprovado
   **Status:** Secure control passed / Controle seguro aprovado
8. **Severity:** critical
   **Severidade:** crítica
9. **OWASP Top 10 (2021) reference:** A01:2021 Broken Access Control
   **Referência OWASP Top 10 (2021):** A01:2021 Broken Access Control

### TC-020

1. **ID:** TC-020
   **ID:** TC-020
2. **Title:** customer administration access is denied
   **Título:** acesso de cliente à administração negado
3. **Precondition:** A newly registered customer account.
   **Pré-condição:** Uma conta de cliente recém-cadastrada.
4. **Steps:** Log in as a customer through the UI; open /#/administration and request /api/Users with that token.
   **Passos:** Entre como cliente pela interface; abra /#/administration e consulte /api/Users com esse token.
5. **Expected result:** No administration component; users API returns 401/403.
   **Resultado esperado:** Componente administrativo ausente; API de usuários retorna 401/403.
6. **Actual result:** Observed: `{"administrationVisible":false,"usersApiStatus":200,"route":"http://localhost:3000/#/administration"}`.
   **Resultado obtido:** Observado: `{"administrationVisible":false,"usersApiStatus":200,"route":"http://localhost:3000/#/administration"}`.
7. **Status:** Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada)
   **Status:** Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada)
8. **Severity:** critical
   **Severidade:** crítica
9. **OWASP Top 10 (2021) reference:** A01:2021 Broken Access Control
   **Referência OWASP Top 10 (2021):** A01:2021 Broken Access Control

Known-vuln justification: Users API exposes customer data to a regular customer (BUG-TC-010), independently of the UI route guard.
Justificativa known-vuln: API de usuários expõe dados a cliente comum (BUG-TC-010), independentemente do guard da rota da interface.

### TC-021

1. **ID:** TC-021
   **ID:** TC-021
2. **Title:** another customer's basket is private
   **Título:** cesta de outro cliente é privada
3. **Precondition:** Two new, distinct customer accounts with their own baskets.
   **Pré-condição:** Duas contas novas e distintas de clientes, com suas próprias cestas.
4. **Steps:** Verify B can read B's basket; request that same basket with A's token.
   **Passos:** Confirme que B consulta sua cesta; consulte essa mesma cesta com o token de A.
5. **Expected result:** A receives 401/403/404 and no basket data.
   **Resultado esperado:** A recebe 401/403/404 e nenhum dado da cesta.
6. **Actual result:** Observed: `{"status":200,"ownerBasket":12,"returnedBasket":12}`.
   **Resultado obtido:** Observado: `{"status":200,"ownerBasket":12,"returnedBasket":12}`.
7. **Status:** Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada)
   **Status:** Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada)
8. **Severity:** critical
   **Severidade:** crítica
9. **OWASP Top 10 (2021) reference:** A01:2021 Broken Access Control
   **Referência OWASP Top 10 (2021):** A01:2021 Broken Access Control

Known-vuln justification: Basket API does not verify ownership (BUG-TC-007).
Justificativa known-vuln: API de cestas não verifica propriedade (BUG-TC-007).

### TC-022

1. **ID:** TC-022
   **ID:** TC-022
2. **Title:** another customer's order is private
   **Título:** pedido de outro cliente é privado
3. **Precondition:** Two new, distinct customer accounts with their own baskets.
   **Pré-condição:** Duas contas novas e distintas de clientes, com suas próprias cestas.
4. **Steps:** B checks out one test product; verify B's order exists; request its tracking ID using A's token.
   **Passos:** B finaliza um produto de teste; confirme a existência do pedido de B; consulte seu ID de rastreio com o token de A.
5. **Expected result:** A receives 401/403/404 and no order data.
   **Resultado esperado:** A recebe 401/403/404 e nenhum dado do pedido.
6. **Actual result:** Observed: `{"status":200,"anotherCustomersOrderReturned":true}`.
   **Resultado obtido:** Observado: `{"status":200,"anotherCustomersOrderReturned":true}`.
7. **Status:** Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada)
   **Status:** Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada)
8. **Severity:** critical
   **Severidade:** crítica
9. **OWASP Top 10 (2021) reference:** A01:2021 Broken Access Control
   **Referência OWASP Top 10 (2021):** A01:2021 Broken Access Control

Known-vuln justification: The tracking API returns B's newly created order to A with HTTP 200.
Justificativa known-vuln: API de rastreio devolve o pedido recém-criado de B para A com HTTP 200.

### TC-023

1. **ID:** TC-023
   **ID:** TC-023
2. **Title:** Content-Security-Policy is configured safely
   **Título:** Content-Security-Policy configurado com segurança
3. **Precondition:** Juice Shop is available at http://localhost:3000.
   **Pré-condição:** Juice Shop disponível em http://localhost:3000.
4. **Steps:** GET / and inspect Content-Security-Policy.
   **Passos:** Execute GET / e inspecione Content-Security-Policy.
5. **Expected result:** Enforced CSP restricts scripts and objects; no unsafe-inline/unsafe-eval or wildcard scripts.
   **Resultado esperado:** CSP obrigatória restringe scripts e objetos; sem unsafe-inline/unsafe-eval ou scripts de qualquer origem.
6. **Actual result:** Observed: `{"header":"content-security-policy","value":"missing / ausente","httpOnlyBaseline":false}`.
   **Resultado obtido:** Observado: `{"header":"content-security-policy","value":"missing / ausente","httpOnlyBaseline":false}`.
7. **Status:** Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada)
   **Status:** Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada)
8. **Severity:** normal
   **Severidade:** normal
9. **OWASP Top 10 (2021) reference:** A05:2021 Security Misconfiguration
   **Referência OWASP Top 10 (2021):** A05:2021 Security Misconfiguration

Known-vuln justification: No enforced CSP header on the local application.
Justificativa known-vuln: Aplicação local sem header de CSP obrigatória.

### TC-024

1. **ID:** TC-024
   **ID:** TC-024
2. **Title:** Strict-Transport-Security is configured safely
   **Título:** Strict-Transport-Security configurado com segurança
3. **Precondition:** Juice Shop is available at http://localhost:3000.
   **Pré-condição:** Juice Shop disponível em http://localhost:3000.
4. **Steps:** GET / and inspect Strict-Transport-Security.
   **Passos:** Execute GET / e inspecione Strict-Transport-Security.
5. **Expected result:** HSTS has max-age >= 31536000 and includeSubDomains (header baseline only on HTTP).
   **Resultado esperado:** HSTS com max-age >= 31536000 e includeSubDomains (somente baseline do header em HTTP).
6. **Actual result:** Observed: `{"header":"strict-transport-security","value":"missing / ausente","httpOnlyBaseline":true}`.
   **Resultado obtido:** Observado: `{"header":"strict-transport-security","value":"missing / ausente","httpOnlyBaseline":true}`.
7. **Status:** Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada)
   **Status:** Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada)
8. **Severity:** normal
   **Severidade:** normal
9. **OWASP Top 10 (2021) reference:** A02:2021 Cryptographic Failures
   **Referência OWASP Top 10 (2021):** A02:2021 Cryptographic Failures

Known-vuln justification: HSTS is absent; HTTP localhost does not exercise transport enforcement.
Justificativa known-vuln: HSTS ausente; localhost HTTP não exercita aplicação da proteção de transporte.

### TC-025

1. **ID:** TC-025
   **ID:** TC-025
2. **Title:** X-Frame-Options is configured safely
   **Título:** X-Frame-Options configurado com segurança
3. **Precondition:** Juice Shop is available at http://localhost:3000.
   **Pré-condição:** Juice Shop disponível em http://localhost:3000.
4. **Steps:** GET / and inspect X-Frame-Options.
   **Passos:** Execute GET / e inspecione X-Frame-Options.
5. **Expected result:** DENY or SAMEORIGIN.
   **Resultado esperado:** DENY ou SAMEORIGIN.
6. **Actual result:** Observed: `{"header":"x-frame-options","value":"SAMEORIGIN","httpOnlyBaseline":false}`.
   **Resultado obtido:** Observado: `{"header":"x-frame-options","value":"SAMEORIGIN","httpOnlyBaseline":false}`.
7. **Status:** Secure control passed / Controle seguro aprovado
   **Status:** Secure control passed / Controle seguro aprovado
8. **Severity:** normal
   **Severidade:** normal
9. **OWASP Top 10 (2021) reference:** A05:2021 Security Misconfiguration
   **Referência OWASP Top 10 (2021):** A05:2021 Security Misconfiguration

### TC-026

1. **ID:** TC-026
   **ID:** TC-026
2. **Title:** X-Content-Type-Options is configured safely
   **Título:** X-Content-Type-Options configurado com segurança
3. **Precondition:** Juice Shop is available at http://localhost:3000.
   **Pré-condição:** Juice Shop disponível em http://localhost:3000.
4. **Steps:** GET / and inspect X-Content-Type-Options.
   **Passos:** Execute GET / e inspecione X-Content-Type-Options.
5. **Expected result:** Exactly nosniff.
   **Resultado esperado:** Exatamente nosniff.
6. **Actual result:** Observed: `{"header":"x-content-type-options","value":"nosniff","httpOnlyBaseline":false}`.
   **Resultado obtido:** Observado: `{"header":"x-content-type-options","value":"nosniff","httpOnlyBaseline":false}`.
7. **Status:** Secure control passed / Controle seguro aprovado
   **Status:** Secure control passed / Controle seguro aprovado
8. **Severity:** normal
   **Severidade:** normal
9. **OWASP Top 10 (2021) reference:** A05:2021 Security Misconfiguration
   **Referência OWASP Top 10 (2021):** A05:2021 Security Misconfiguration

### TC-027

1. **ID:** TC-027
   **ID:** TC-027
2. **Title:** Referrer-Policy is configured safely
   **Título:** Referrer-Policy configurado com segurança
3. **Precondition:** Juice Shop is available at http://localhost:3000.
   **Pré-condição:** Juice Shop disponível em http://localhost:3000.
4. **Steps:** GET / and inspect Referrer-Policy.
   **Passos:** Execute GET / e inspecione Referrer-Policy.
5. **Expected result:** no-referrer, same-origin, strict-origin or strict-origin-when-cross-origin.
   **Resultado esperado:** no-referrer, same-origin, strict-origin ou strict-origin-when-cross-origin.
6. **Actual result:** Observed: `{"header":"referrer-policy","value":"missing / ausente","httpOnlyBaseline":false}`.
   **Resultado obtido:** Observado: `{"header":"referrer-policy","value":"missing / ausente","httpOnlyBaseline":false}`.
7. **Status:** Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada)
   **Status:** Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada)
8. **Severity:** normal
   **Severidade:** normal
9. **OWASP Top 10 (2021) reference:** A05:2021 Security Misconfiguration
   **Referência OWASP Top 10 (2021):** A05:2021 Security Misconfiguration

Known-vuln justification: Referrer-Policy header is absent.
Justificativa known-vuln: Header Referrer-Policy ausente.

### TC-028

1. **ID:** TC-028
   **ID:** TC-028
2. **Title:** CORS restricts an opaque origin on private data
   **Título:** CORS restringe origem opaca em dados privados
3. **Precondition:** A newly registered customer account.
   **Pré-condição:** Uma conta de cliente recém-cadastrada.
4. **Steps:** GET the customer's basket and OPTIONS the same path with Origin: null and requested Authorization header.
   **Passos:** Execute GET na cesta do cliente e OPTIONS no mesmo caminho com Origin: null e header Authorization solicitado.
5. **Expected result:** CORS does not permit the opaque origin to read authenticated data; no wildcard or null allow-origin.
   **Resultado esperado:** CORS não permite que a origem opaca leia dados autenticados; allow-origin sem curinga ou null.
6. **Actual result:** Observed: `{"actualOrigin":"*","preflightOrigin":"*","preflightStatus":204,"allowedHeaders":"authorization","allowedCredentials":"absent","scope":"Header policy test with opaque Origin: null; no request to another host. / Teste de política com origem opaca; sem requisição a outro host."}`.
   **Resultado obtido:** Observado: `{"actualOrigin":"*","preflightOrigin":"*","preflightStatus":204,"allowedHeaders":"authorization","allowedCredentials":"absent","scope":"Header policy test with opaque Origin: null; no request to another host. / Teste de política com origem opaca; sem requisição a outro host."}`.
7. **Status:** Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada)
   **Status:** Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada)
8. **Severity:** normal
   **Severidade:** normal
9. **OWASP Top 10 (2021) reference:** A05:2021 Security Misconfiguration
   **Referência OWASP Top 10 (2021):** A05:2021 Security Misconfiguration

Known-vuln justification: Authenticated basket response and preflight allow wildcard origins and the authorization request header.
Justificativa known-vuln: Resposta autenticada de cesta e preflight permitem origens com curinga e header authorization.

### TC-029

1. **ID:** TC-029
   **ID:** TC-029
2. **Title:** FTP listing is not public
   **Título:** listagem FTP não é pública
3. **Precondition:** Juice Shop is available at http://localhost:3000.
   **Pré-condição:** Juice Shop disponível em http://localhost:3000.
4. **Steps:** GET /ftp/ anonymously; inspect directory content rather than just HTTP 200.
   **Passos:** Execute GET /ftp/ anonimamente; inspecione o conteúdo do diretório além do HTTP 200.
5. **Expected result:** 401/403/404 and no directory listing.
   **Resultado esperado:** 401/403/404 e nenhuma listagem de diretório.
6. **Actual result:** Observed: `{"path":"/ftp/","status":200,"contentExposed":true}`.
   **Resultado obtido:** Observado: `{"path":"/ftp/","status":200,"contentExposed":true}`.
7. **Status:** Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada)
   **Status:** Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada)
8. **Severity:** normal
   **Severidade:** normal
9. **OWASP Top 10 (2021) reference:** A05:2021 Security Misconfiguration
   **Referência OWASP Top 10 (2021):** A05:2021 Security Misconfiguration

Known-vuln justification: Public /ftp/ directory listing (BUG-TC-013).
Justificativa known-vuln: Listagem pública de /ftp/ (BUG-TC-013).

### TC-030

1. **ID:** TC-030
   **ID:** TC-030
2. **Title:** metrics are not public
   **Título:** métricas não são públicas
3. **Precondition:** Juice Shop is available at http://localhost:3000.
   **Pré-condição:** Juice Shop disponível em http://localhost:3000.
4. **Steps:** GET /metrics anonymously; inspect Prometheus HELP/TYPE markers.
   **Passos:** Execute GET /metrics anonimamente; inspecione marcadores HELP/TYPE do Prometheus.
5. **Expected result:** 401/403/404 and no metrics data.
   **Resultado esperado:** 401/403/404 e nenhum dado de métricas.
6. **Actual result:** Observed: `{"path":"/metrics","status":200,"contentExposed":true}`.
   **Resultado obtido:** Observado: `{"path":"/metrics","status":200,"contentExposed":true}`.
7. **Status:** Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada)
   **Status:** Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada)
8. **Severity:** normal
   **Severidade:** normal
9. **OWASP Top 10 (2021) reference:** A05:2021 Security Misconfiguration
   **Referência OWASP Top 10 (2021):** A05:2021 Security Misconfiguration

Known-vuln justification: Public Prometheus metrics (BUG-TC-015).
Justificativa known-vuln: Métricas Prometheus públicas (BUG-TC-015).

### TC-031

1. **ID:** TC-031
   **ID:** TC-031
2. **Title:** SQL injection cannot authenticate
   **Título:** injeção SQL não autentica
3. **Precondition:** Juice Shop is available at http://localhost:3000.
   **Pré-condição:** Juice Shop disponível em http://localhost:3000.
4. **Steps:** Confirm ordinary invalid credentials are rejected; submit the bounded training input to POST /rest/user/login.
   **Passos:** Confirme rejeição de credenciais inválidas comuns; envie a entrada limitada de treinamento a POST /rest/user/login.
5. **Expected result:** 400/401/403 without an authentication token.
   **Resultado esperado:** 400/401/403 sem token de autenticação.
6. **Actual result:** Observed: `{"status":200,"tokenIssued":true}`.
   **Resultado obtido:** Observado: `{"status":200,"tokenIssued":true}`.
7. **Status:** Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada)
   **Status:** Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada)
8. **Severity:** critical
   **Severidade:** crítica
9. **OWASP Top 10 (2021) reference:** A03:2021 Injection
   **Referência OWASP Top 10 (2021):** A03:2021 Injection

Known-vuln justification: Login accepts the training SQL input (BUG-TC-005).
Justificativa known-vuln: Login aceita entrada SQL de treinamento (BUG-TC-005).

### TC-032

1. **ID:** TC-032
   **ID:** TC-032
2. **Title:** search encodes reflected HTML
   **Título:** busca codifica HTML refletido
3. **Precondition:** Juice Shop is available at http://localhost:3000.
   **Pré-condição:** Juice Shop disponível em http://localhost:3000.
4. **Steps:** Search for a harmless bold marker; inspect the rendered search-value element and HTML encoding.
   **Passos:** Busque um marcador inofensivo em negrito; inspecione o elemento que exibe a busca e a codificação HTML.
5. **Expected result:** Marker is displayed as literal text without a bold DOM element.
   **Resultado esperado:** Marcador exibido como texto literal, sem elemento em negrito no DOM.
6. **Actual result:** Observed: `{"text":"qa-security-encoding","html":"<b data-security-marker=\"encoding\">qa-security-encoding</b>","interpreted":true}`.
   **Resultado obtido:** Observado: `{"text":"qa-security-encoding","html":"<b data-security-marker=\"encoding\">qa-security-encoding</b>","interpreted":true}`.
7. **Status:** Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada)
   **Status:** Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada)
8. **Severity:** critical
   **Severidade:** crítica
9. **OWASP Top 10 (2021) reference:** A03:2021 Injection
   **Referência OWASP Top 10 (2021):** A03:2021 Injection

Known-vuln justification: Search interprets reflected HTML (BUG-TC-006).
Justificativa known-vuln: Busca interpreta HTML refletido (BUG-TC-006).

### TC-033

1. **ID:** TC-033
   **ID:** TC-033
2. **Title:** search never executes reflected script
   **Título:** busca nunca executa script refletido
3. **Precondition:** Juice Shop is available at http://localhost:3000.
   **Pré-condição:** Juice Shop disponível em http://localhost:3000.
4. **Steps:** Search using a local-only iframe/javascript alert marker; wait for the render boundary and observe dialogs and iframe execution.
   **Passos:** Busque um marcador local de iframe/javascript com alert; aguarde a renderização e observe diálogos e execução do iframe.
5. **Expected result:** No JavaScript execution or executable iframe.
   **Resultado esperado:** Nenhuma execução JavaScript ou iframe executável.
6. **Actual result:** Observed: `{"executed":true,"dialogs":["qa-security-xss"],"executableFrames":1,"html":"<iframe src=\"javascript:alert('qa-security-xss')\"></iframe>"}`.
   **Resultado obtido:** Observado: `{"executed":true,"dialogs":["qa-security-xss"],"executableFrames":1,"html":"<iframe src=\"javascript:alert('qa-security-xss')\"></iframe>"}`.
7. **Status:** Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada)
   **Status:** Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada)
8. **Severity:** critical
   **Severidade:** crítica
9. **OWASP Top 10 (2021) reference:** A03:2021 Injection
   **Referência OWASP Top 10 (2021):** A03:2021 Injection

Known-vuln justification: The search renders the javascript iframe and executes the local alert marker (DOM-based XSS).
Justificativa known-vuln: Busca renderiza o iframe javascript e executa o alert local de teste (XSS baseado em DOM).

### TC-034

1. **ID:** TC-034
   **ID:** TC-034
2. **Title:** server rejects a weak password
   **Título:** servidor rejeita senha fraca
3. **Precondition:** Juice Shop is available at http://localhost:3000.
   **Pré-condição:** Juice Shop disponível em http://localhost:3000.
4. **Steps:** Register a unique test user via API with password 12345; if accepted, verify login with that password.
   **Passos:** Cadastre usuário único pela API com senha 12345; se aceito, confirme login com essa senha.
5. **Expected result:** Registration returns 400/422; client-side validation alone is insufficient.
   **Resultado esperado:** Cadastro retorna 400/422; validação somente no cliente é insuficiente.
6. **Actual result:** Observed: `{"registrationStatus":201,"weakLoginAccepted":true}`.
   **Resultado obtido:** Observado: `{"registrationStatus":201,"weakLoginAccepted":true}`.
7. **Status:** Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada)
   **Status:** Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada)
8. **Severity:** normal
   **Severidade:** normal
9. **OWASP Top 10 (2021) reference:** A07:2021 Identification and Authentication Failures
   **Referência OWASP Top 10 (2021):** A07:2021 Identification and Authentication Failures

Known-vuln justification: API accepts 12345 with HTTP 201 and the account can log in using it.
Justificativa known-vuln: API aceita 12345 com HTTP 201 e a conta consegue entrar com essa senha.

### TC-035

1. **ID:** TC-035
   **ID:** TC-035
2. **Title:** browser token cookie has protective flags
   **Título:** cookie de token tem flags de proteção
3. **Precondition:** A newly registered customer account.
   **Pré-condição:** Uma conta de cliente recém-cadastrada.
4. **Steps:** Log in through the UI without injecting authentication state; inspect the actual token cookie flags and script-readable storage.
   **Passos:** Entre pela interface sem injetar estado de autenticação; inspecione flags reais do cookie de token e armazenamento acessível por script.
5. **Expected result:** Session cookie is HttpOnly, Secure, SameSite=Lax/Strict; token is not in localStorage. Secure is a header/storage baseline on HTTP localhost.
   **Resultado esperado:** Cookie de sessão com HttpOnly, Secure, SameSite=Lax/Strict; token fora do localStorage. Secure é baseline de header/armazenamento em localhost HTTP.
6. **Actual result:** Observed: `{"httpOnly":false,"secure":false,"sameSite":"Lax","expires":1792987423,"scriptReadableToken":true}`.
   **Resultado obtido:** Observado: `{"httpOnly":false,"secure":false,"sameSite":"Lax","expires":1792987423,"scriptReadableToken":true}`.
7. **Status:** Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada)
   **Status:** Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada)
8. **Severity:** critical
   **Severidade:** crítica
9. **OWASP Top 10 (2021) reference:** A07:2021 Identification and Authentication Failures
   **Referência OWASP Top 10 (2021):** A07:2021 Identification and Authentication Failures

Known-vuln justification: Real UI login creates a token cookie without HttpOnly/Secure and stores the JWT in localStorage; SameSite is Lax.
Justificativa known-vuln: Login real pela interface cria cookie de token sem HttpOnly/Secure e grava JWT no localStorage; SameSite é Lax.

### TC-036

1. **ID:** TC-036
   **ID:** TC-036
2. **Title:** JWT has a bounded lifetime
   **Título:** JWT possui validade limitada
3. **Precondition:** A newly registered customer account.
   **Pré-condição:** Uma conta de cliente recém-cadastrada.
4. **Steps:** Log in; decode only JWT timing claims and compare exp/iat to the one-hour suite baseline.
   **Passos:** Entre; decodifique somente claims de tempo do JWT e compare exp/iat ao baseline de uma hora da suíte.
5. **Expected result:** Numeric iat/exp, token currently valid, lifetime > 0 and <= 3600 seconds.
   **Resultado esperado:** iat/exp numéricos, token válido no momento, validade > 0 e <= 3600 segundos.
6. **Actual result:** Observed: `{"iat":1792958624,"exp":"missing / ausente","lifetimeSeconds":"unbounded / ilimitada","maximumLifetimeSeconds":3600}`.
   **Resultado obtido:** Observado: `{"iat":1792958624,"exp":"missing / ausente","lifetimeSeconds":"unbounded / ilimitada","maximumLifetimeSeconds":3600}`.
7. **Status:** Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada)
   **Status:** Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada)
8. **Severity:** normal
   **Severidade:** normal
9. **OWASP Top 10 (2021) reference:** A07:2021 Identification and Authentication Failures
   **Referência OWASP Top 10 (2021):** A07:2021 Identification and Authentication Failures

Known-vuln justification: Login JWT lacks exp in this Juice Shop 20.2.0 container (legacy jsonwebtoken 0.4.0); lifetime is unbounded.
Justificativa known-vuln: JWT de login não possui exp neste container Juice Shop 20.2.0 (jsonwebtoken legado 0.4.0); validade ilimitada.

### TC-037

1. **ID:** TC-037
   **ID:** TC-037
2. **Title:** server rejects an authentically signed expired JWT
   **Título:** servidor rejeita JWT expirado com assinatura autêntica
3. **Precondition:** New customer and the project's running Docker Compose juice-shop service.
   **Pré-condição:** Novo cliente e serviço juice-shop do Docker Compose do projeto em execução.
4. **Steps:** Inside the container use the application's authorize function to sign a fresh control and an expired token for this customer; verify both signatures, accept the control on the customer's basket, then replay the expired token.
   **Passos:** Dentro do container use authorize do aplicativo para assinar controle válido e token expirado deste cliente; verifique ambas as assinaturas, aceite o controle na cesta do cliente e envie o token expirado.
5. **Expected result:** Fresh signed control returns 200; expired signed token returns 401/403.
   **Resultado esperado:** Controle assinado válido retorna 200; token assinado expirado retorna 401/403.
6. **Actual result:** Observed: `{"controlStatus":200,"expiredStatus":401,"expiredAt":1792958564,"signatureVerified":true}`.
   **Resultado obtido:** Observado: `{"controlStatus":200,"expiredStatus":401,"expiredAt":1792958564,"signatureVerified":true}`.
7. **Status:** Secure control passed / Controle seguro aprovado
   **Status:** Secure control passed / Controle seguro aprovado
8. **Severity:** critical
   **Severidade:** crítica
9. **OWASP Top 10 (2021) reference:** A07:2021 Identification and Authentication Failures
   **Referência OWASP Top 10 (2021):** A07:2021 Identification and Authentication Failures

### TC-038

1. **ID:** TC-038
   **ID:** TC-038
2. **Title:** malformed JSON produces no verbose internal error
   **Título:** JSON malformado não gera erro interno verboso
3. **Precondition:** Juice Shop is available at http://localhost:3000.
   **Pré-condição:** Juice Shop disponível em http://localhost:3000.
4. **Steps:** POST malformed JSON to /rest/user/login; inspect status and stack/SQL/path indicators in the response.
   **Passos:** Envie JSON malformado a /rest/user/login; inspecione status e indicadores de stack/SQL/caminhos na resposta.
5. **Expected result:** 400 response without stack traces, database details or internal paths. Response-only check; does not prove server-side audit logging.
   **Resultado esperado:** Resposta 400 sem stack traces, detalhes de banco ou caminhos internos. Verificação da resposta; não comprova logs de auditoria do servidor.
6. **Actual result:** Observed: `{"status":500,"leakedInternals":true,"scope":"Response disclosure only; server audit logging is not measured. / Somente exposição na resposta; logs de auditoria do servidor não são medidos."}`.
   **Resultado obtido:** Observado: `{"status":500,"leakedInternals":true,"scope":"Response disclosure only; server audit logging is not measured. / Somente exposição na resposta; logs de auditoria do servidor não são medidos."}`.
7. **Status:** Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada)
   **Status:** Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada)
8. **Severity:** normal
   **Severidade:** normal
9. **OWASP Top 10 (2021) reference:** A09:2021 Security Logging and Monitoring Failures
   **Referência OWASP Top 10 (2021):** A09:2021 Security Logging and Monitoring Failures

Known-vuln justification: Malformed JSON leaks internal error details (BUG-TC-014); secondary A05 mapping.
Justificativa known-vuln: JSON malformado vaza detalhes internos (BUG-TC-014); mapeamento secundário A05.

## References / Referências

Expected-failure behavior: [Playwright test.fail](https://playwright.dev/docs/api/class-test#test-fail). Reporting API: [Allure Playwright reference](https://allurereport.org/docs/playwright-reference/).
Comportamento de falha esperada: [Playwright test.fail](https://playwright.dev/docs/api/class-test#test-fail). API de relatórios: [Referência Allure Playwright](https://allurereport.org/docs/playwright-reference/).
