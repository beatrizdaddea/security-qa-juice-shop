# Test Cases / Casos de Teste

**Target / Alvo:** OWASP Juice Shop (local Docker, `http://localhost:3000`)  
**Standard / Referência:** OWASP Top 10 (2021)  
**Automation / Automação:** Cypress + Allure  
**Status legend / Legenda:** `Not run / Não executado` · `Pass / Passou` · `Fail / Falhou` · `Blocked / Bloqueado`

> ⚠️ **Ethical notice / Aviso ético:** all tests target a deliberately vulnerable app running locally in a controlled environment. Never run these against systems you don't own or lack written authorization to test.  
> Todos os testes têm como alvo uma aplicação propositalmente vulnerável rodando localmente, em ambiente controlado. Nunca execute contra sistemas que não sejam seus ou sem autorização por escrito.

> **How to read the results / Como ler os resultados:** in security testing, the *expected result* describes the **secure behavior**. If the app does not behave that way, the test **fails** and a bug report is opened (a confirmed vulnerability). / Em teste de segurança, o *resultado esperado* descreve o **comportamento seguro**. Se a aplicação não se comportar assim, o teste **falha** e um bug é aberto (vulnerabilidade confirmada).

---

## Summary / Resumo

| ID | Title (EN / PT-BR) | OWASP | Severity | Type | Automate |
|---|---|---|---|---|---|
| TC-001 | Valid login / Login válido | — | High | Functional | UI |
| TC-002 | User registration / Cadastro de usuário | — | High | Functional | UI |
| TC-003 | Product search / Busca de produto | — | Medium | Functional | UI |
| TC-004 | Add product to basket / Adicionar produto à cesta | — | High | Functional | UI |
| TC-005 | SQL injection on login / Injeção de SQL no login | A03 | Critical | Security | API |
| TC-006 | Search input sanitization (XSS) / Sanitização da busca (XSS) | A03 | High | Security | UI |
| TC-007 | Basket access by another user (IDOR) / Acesso à cesta de outro usuário | A01 | High | Security | API |
| TC-008 | Admin page access by regular user / Acesso à área admin por usuário comum | A01 | High | Security | UI |
| TC-009 | Unauthenticated access to protected API / Acesso sem autenticação à API protegida | A01 | High | Security | API |
| TC-010 | Sensitive data in user API response / Dados sensíveis na resposta da API de usuários | A02 | High | Security | API |
| TC-011 | Password storage exposure / Exposição do armazenamento de senhas | A02 | High | Security | API |
| TC-012 | Security headers present / Cabeçalhos de segurança presentes | A05 | Medium | Security | API |
| TC-013 | Exposed directory listing / Diretório exposto | A05 | Medium | Security | API |
| TC-014 | Error handling leaks internals / Tratamento de erro vaza detalhes internos | A05 | Medium | Security | API |
| TC-015 | Monitoring endpoint exposure / Exposição de endpoint de monitoramento | A05 | Medium | Security | API |
| TC-016 | Weak password policy / Política de senha fraca | A07 | Medium | Security | UI |
| TC-017 | Login brute-force protection / Proteção contra força bruta no login | A07 | High | Security | API |
| TC-018 | Token validity after logout / Validade do token após logout | A07 | Medium | Security | API |

Severity values are *proposed*. Adjust after execution based on real impact. / As severidades são *propostas*; ajuste após a execução conforme o impacto real.

---

## A. Functional baseline / Base funcional

### TC-001 — Valid login / Login válido
- **OWASP:** Not applicable — Functional baseline / Não aplicável — Base funcional
- **Severity / Severidade:** High · **Automate / Automatizar:** UI
- **Precondition / Pré-condição:** a registered user exists (e.g. `qa.user1@example.com`). / Existe um usuário cadastrado.
- **Steps / Passos:**
  1. Open the login page. / Abra a página de login.
  2. Enter valid email and password. / Informe e-mail e senha válidos.
  3. Click *Log in*. / Clique em *Log in*.
- **Expected / Esperado:** user is authenticated and the account menu shows the user's email. / Usuário autenticado e o menu da conta exibe o e-mail.
- **Actual / Obtido:** _
- **Status:** Not run / Não executado

### TC-002 — User registration / Cadastro de usuário
- **OWASP:** Not applicable — Functional baseline / Não aplicável — Base funcional
- **Severity / Severidade:** High · **Automate / Automatizar:** UI
- **Precondition / Pré-condição:** email not yet registered. / E-mail ainda não cadastrado.
- **Steps / Passos:**
  1. Open the registration page. / Abra a página de cadastro.
  2. Fill email, password (repeat) and security question/answer. / Preencha e-mail, senha (repetida) e pergunta/resposta de segurança.
  3. Submit. / Envie.
- **Expected / Esperado:** success message is shown and the user can log in with the new credentials. / Mensagem de sucesso e login possível com as novas credenciais.
- **Actual / Obtido:** _
- **Status:** Not run / Não executado

### TC-003 — Product search / Busca de produto
- **OWASP:** Not applicable — Functional baseline / Não aplicável — Base funcional
- **Severity / Severidade:** Medium · **Automate / Automatizar:** UI
- **Precondition / Pré-condição:** application is running. / Aplicação em execução.
- **Steps / Passos:**
  1. Open the home page. / Abra a página inicial.
  2. Search for a known product term (e.g. `apple`). / Busque um termo conhecido (ex.: `apple`).
- **Expected / Esperado:** only products matching the term are listed; a non-matching term shows an empty result. / Apenas produtos correspondentes são listados; termo inexistente retorna lista vazia.
- **Actual / Obtido:** _
- **Status:** Not run / Não executado

### TC-004 — Add product to basket / Adicionar produto à cesta
- **OWASP:** Not applicable — Functional baseline / Não aplicável — Base funcional
- **Severity / Severidade:** High · **Automate / Automatizar:** UI
- **Precondition / Pré-condição:** user is logged in (TC-001). / Usuário logado.
- **Steps / Passos:**
  1. Click *Add to Basket* on a product. / Clique em *Add to Basket* em um produto.
  2. Open the basket. / Abra a cesta.
- **Expected / Esperado:** the product appears in the basket with quantity 1 and the correct price; the basket counter updates. / Produto aparece na cesta com quantidade 1 e preço correto; o contador é atualizado.
- **Actual / Obtido:** _
- **Status:** Not run / Não executado

---

## B. A03 — Injection / Injeção

### TC-005 — SQL injection on login / Injeção de SQL no login
- **OWASP:** A03:2021 Injection · **CWE-89** · **Severity / Severidade:** Critical · **Automate / Automatizar:** API
- **Precondition / Pré-condição:** login endpoint reachable. / Endpoint de login acessível.
- **Steps / Passos:**
  1. Send a login request with the classic training input `' OR 1=1--` as the email and any value as the password. / Envie requisição de login com a entrada clássica de treinamento `' OR 1=1--` no e-mail e qualquer senha.
  2. Observe the HTTP status and response body. / Observe o status HTTP e o corpo da resposta.
- **Expected / Esperado:** request is rejected (401/400) and no authentication token is returned. Input is treated as data, not as SQL. / Requisição rejeitada (401/400) e nenhum token retornado. A entrada é tratada como dado, não como SQL.
- **Actual / Obtido:** _
- **Status:** Not run / Não executado

### TC-006 — Search input sanitization (XSS) / Sanitização da busca (XSS)
- **OWASP:** A03:2021 Injection · **CWE-79** · **Severity / Severidade:** High · **Automate / Automatizar:** UI
- **Precondition / Pré-condição:** application is running. / Aplicação em execução.
- **Steps / Passos:**
  1. In the search field, enter a harmless HTML marker such as `<b>test</b>`. / No campo de busca, informe um marcador HTML inofensivo como `<b>test</b>`.
  2. Observe how the page renders the search term. / Observe como a página exibe o termo.
  3. Repeat with the standard training payload `<iframe src="javascript:alert('xss')">`. / Repita com o payload padrão de treinamento.
- **Expected / Esperado:** input is rendered as plain text (HTML-encoded); no HTML is interpreted and no script executes. / Entrada exibida como texto (HTML codificado); nenhum HTML interpretado e nenhum script executado.
- **Actual / Obtido:** _
- **Status:** Not run / Não executado

---

## C. A01 — Broken Access Control / Controle de acesso quebrado

### TC-007 — Basket access by another user (IDOR) / Acesso à cesta de outro usuário
- **OWASP:** A01:2021 · **CWE-639** · **Severity / Severidade:** High · **Automate / Automatizar:** API
- **Precondition / Pré-condição:** two registered users (A and B), each with a basket. / Dois usuários (A e B), cada um com uma cesta.
- **Steps / Passos:**
  1. Log in as user A and capture the token. / Faça login como A e capture o token.
  2. Identify user A's basket ID in the basket request. / Identifique o ID da cesta de A na requisição.
  3. Request the basket with user B's ID using user A's token. / Solicite a cesta de B usando o token de A.
- **Expected / Esperado:** server denies access (401/403/404) and returns no data from user B's basket. / Servidor nega o acesso e não retorna dados da cesta de B.
- **Actual / Obtido:** _
- **Status:** Not run / Não executado

### TC-008 — Admin page access by regular user / Acesso à área admin por usuário comum
- **OWASP:** A01:2021 · **CWE-285** · **Severity / Severidade:** High · **Automate / Automatizar:** UI
- **Precondition / Pré-condição:** logged in as a regular (non-admin) user. / Logado como usuário comum.
- **Steps / Passos:**
  1. Navigate directly to the administration page URL. / Navegue diretamente para a URL da página de administração.
  2. Observe the result. / Observe o resultado.
- **Expected / Esperado:** access is denied (error/redirect) and no administrative data is shown. / Acesso negado (erro/redirecionamento) sem exibir dados administrativos.
- **Actual / Obtido:** _
- **Status:** Not run / Não executado

### TC-009 — Unauthenticated access to protected API / Acesso sem autenticação à API protegida
- **OWASP:** A01:2021 · **CWE-306** · **Severity / Severidade:** High · **Automate / Automatizar:** API
- **Precondition / Pré-condição:** no session/token. / Sem sessão/token.
- **Steps / Passos:**
  1. Call endpoints that should require authentication (e.g. users list, basket) without an `Authorization` header. / Chame endpoints que exigem autenticação sem o header `Authorization`.
  2. Record status and body of each. / Registre status e corpo.
- **Expected / Esperado:** each returns 401/403 and no business data. / Cada um retorna 401/403 sem dados de negócio.
- **Actual / Obtido:** _
- **Status:** Not run / Não executado

---

## D. A02 — Cryptographic Failures / Falhas criptográficas

### TC-010 — Sensitive data in user API response / Dados sensíveis na resposta da API de usuários
- **OWASP:** A02:2021 · **CWE-200** · **Severity / Severidade:** High · **Automate / Automatizar:** API
- **Precondition / Pré-condição:** authenticated regular user. / Usuário comum autenticado.
- **Steps / Passos:**
  1. Request the user list/detail endpoints with a regular user token. / Solicite os endpoints de usuários com token de usuário comum.
  2. Inspect the returned fields. / Inspecione os campos retornados.
- **Expected / Esperado:** responses contain only the data the caller is entitled to; no password hashes, tokens or other users' personal data. / Respostas contêm apenas o que o usuário pode ver; sem hashes de senha, tokens ou dados pessoais de terceiros.
- **Actual / Obtido:** _
- **Status:** Not run / Não executado

### TC-011 — Password storage exposure / Exposição do armazenamento de senhas
- **OWASP:** A02:2021 · **CWE-327 / CWE-916** · **Severity / Severidade:** High · **Automate / Automatizar:** API
- **Precondition / Pré-condição:** TC-010 returned a password field (if not, mark *Not applicable*). / TC-010 retornou campo de senha (senão, marcar *Não aplicável*).
- **Steps / Passos:**
  1. Inspect the format/length of the returned password value. / Inspecione formato/tamanho do valor de senha retornado.
- **Expected / Esperado:** passwords are never returned; if stored, they use a modern salted algorithm (e.g. bcrypt/argon2) and are not exposed. / Senhas nunca retornam; se armazenadas, usam algoritmo moderno com salt (bcrypt/argon2) e não são expostas.
- **Actual / Obtido:** _
- **Status:** Not run / Não executado

---

## E. A05 — Security Misconfiguration / Configuração incorreta de segurança

### TC-012 — Security headers present / Cabeçalhos de segurança presentes
- **OWASP:** A05:2021 · **CWE-693** · **Severity / Severidade:** Medium · **Automate / Automatizar:** API
- **Precondition / Pré-condição:** application is running. / Aplicação em execução.
- **Steps / Passos:**
  1. Request the home page and an API endpoint. / Solicite a página inicial e um endpoint da API.
  2. Check headers: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`. / Verifique os cabeçalhos listados.
- **Expected / Esperado:** recommended security headers are present with safe values. (HSTS may be N/A on plain HTTP localhost; document it.) / Cabeçalhos recomendados presentes com valores seguros. (HSTS pode não se aplicar a HTTP em localhost; documente.)
- **Actual / Obtido:** _
- **Status:** Not run / Não executado

### TC-013 — Exposed directory listing / Diretório exposto
- **OWASP:** A05:2021 · **CWE-548** · **Severity / Severidade:** Medium · **Automate / Automatizar:** API
- **Precondition / Pré-condição:** application is running. / Aplicação em execução.
- **Steps / Passos:**
  1. Request the `/ftp` path. / Solicite o caminho `/ftp`.
  2. Note whether files/directories are listed or downloadable. / Verifique se arquivos/diretórios são listados ou baixáveis.
- **Expected / Esperado:** internal or confidential files are not listed or downloadable by anonymous users. / Arquivos internos/confidenciais não são listados nem baixáveis por anônimos.
- **Actual / Obtido:** _
- **Status:** Not run / Não executado

### TC-014 — Error handling leaks internals / Tratamento de erro vaza detalhes internos
- **OWASP:** A05:2021 · **CWE-209** · **Severity / Severidade:** Medium · **Automate / Automatizar:** API
- **Precondition / Pré-condição:** application is running. / Aplicação em execução.
- **Steps / Passos:**
  1. Trigger an error with a malformed request (e.g. invalid JSON body or unexpected characters in a parameter). / Provoque um erro com requisição malformada.
  2. Inspect the error response. / Inspecione a resposta de erro.
- **Expected / Esperado:** a generic error message; no stack traces, file paths, framework or database details. / Mensagem genérica; sem stack trace, caminhos de arquivo, framework ou detalhes de banco.
- **Actual / Obtido:** _
- **Status:** Not run / Não executado

### TC-015 — Monitoring endpoint exposure / Exposição de endpoint de monitoramento
- **OWASP:** A05:2021 · **CWE-200** · **Severity / Severidade:** Medium · **Automate / Automatizar:** API
- **Precondition / Pré-condição:** application is running. / Aplicação em execução.
- **Steps / Passos:**
  1. Request the `/metrics` path without authentication. / Solicite `/metrics` sem autenticação.
- **Expected / Esperado:** operational/monitoring data is not accessible to anonymous users. / Dados operacionais não acessíveis a usuários anônimos.
- **Actual / Obtido:** _
- **Status:** Not run / Não executado

---

## F. A07 — Identification and Authentication Failures / Falhas de identificação e autenticação

### TC-016 — Weak password policy / Política de senha fraca
- **OWASP:** A07:2021 · **CWE-521** · **Severity / Severidade:** Medium · **Automate / Automatizar:** UI
- **Precondition / Pré-condição:** registration page available. / Página de cadastro disponível.
- **Steps / Passos:**
  1. Try registering with very weak passwords (e.g. 5 characters; `12345`). / Tente cadastrar com senhas muito fracas.
  2. Observe whether registration is accepted. / Observe se o cadastro é aceito.
- **Expected / Esperado:** weak passwords are rejected with a clear message (minimum length/complexity). / Senhas fracas são rejeitadas com mensagem clara.
- **Actual / Obtido:** _
- **Status:** Not run / Não executado

### TC-017 — Login brute-force protection / Proteção contra força bruta no login
- **OWASP:** A07:2021 · **CWE-307** · **Severity / Severidade:** High · **Automate / Automatizar:** API
- **Precondition / Pré-condição:** an existing test user. **Only against your own local instance.** / Usuário de teste existente. **Apenas na sua instância local.**
- **Steps / Passos:**
  1. Send a limited number (e.g. 20) of failed login attempts for the same account in a short period. / Envie um número limitado (ex.: 20) de tentativas falhas para a mesma conta em curto período.
  2. Observe responses for throttling (429), lockout or CAPTCHA. / Observe throttling (429), bloqueio ou CAPTCHA.
- **Expected / Esperado:** the app throttles, delays or locks the account after repeated failures. / A aplicação limita, atrasa ou bloqueia após falhas repetidas.
- **Actual / Obtido:** _
- **Status:** Not run / Não executado

### TC-018 — Token validity after logout / Validade do token após logout
- **OWASP:** A07:2021 · **CWE-613** · **Severity / Severidade:** Medium · **Automate / Automatizar:** API
- **Precondition / Pré-condição:** logged-in user with a captured token. / Usuário logado com token capturado.
- **Steps / Passos:**
  1. Log out through the UI. / Faça logout pela interface.
  2. Reuse the previous token on an authenticated endpoint. / Reutilize o token anterior em um endpoint autenticado.
- **Expected / Esperado:** the old token is rejected (401). If the design is stateless and tokens stay valid until expiry, document the token lifetime and mark as a finding. / O token antigo é rejeitado (401). Se o design for stateless e o token seguir válido até expirar, documente o tempo de vida e registre como achado.
- **Actual / Obtido:** _
- **Status:** Not run / Não executado

---

## Notes for execution / Notas para execução

- **Test data / Dados de teste:** create dedicated users (`qa.user1@example.com`, `qa.user2@example.com`); never reuse real passwords. / Crie usuários dedicados; nunca reutilize senhas reais.
- **Evidence / Evidências:** save screenshots and HTTP request/response in `evidence/TC-0XX/`. / Salve prints e requisição/resposta em `evidence/TC-0XX/`.
- **Version drift / Variação de versão:** Juice Shop behavior changes between versions; record the version tag used. Some cases may already behave securely, which is a valid *Pass*. / O comportamento muda entre versões; registre a tag usada. Alguns casos podem já estar seguros, o que é um *Passou* válido.
- **Bugs:** open `bugs/BUG-XXX.md` only for failures you reproduced yourself. / Abra `bugs/BUG-XXX.md` apenas para falhas que você reproduziu.
