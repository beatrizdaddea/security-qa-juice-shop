# Security QA Test Plan — OWASP Juice Shop

## English

### 1. Objective and scope

**Objective:** assess functional quality and common security risks in a controlled OWASP Juice Shop instance.

**In scope:** login, registration, search, basket, access control, authentication, API data exposure, input handling, security headers, error handling, exposed resources, and monitoring endpoints. Manual exploratory testing and Cypress UI/API automation are included.

**Out of scope:** denial of service, destructive testing, social engineering, third-party systems, production targets, and any host other than `http://localhost:3000`.

### 2. Application under test

- Application: OWASP Juice Shop
- Runtime version: `20.2.0`
- Container image: `bkimminich/juice-shop:latest` (resolved image digest must be recorded per execution)
- Target: `http://localhost:3000`

### 3. Environment

| Component | Configuration |
| --- | --- |
| Runtime | Docker / Docker Compose |
| Test runtime | Node.js 24.9.0 |
| Automation | Cypress 16.1.1 + TypeScript 7.0.2 |
| Reporting | allure-cypress 3.13.0 + Allure Report 2.46.1 |
| Browser | Electron 146 headless; record alternatives per run |

### 4. Strategy and test types

- **Manual exploratory:** validate behavior, discover edge cases, and collect reproducible evidence.
- **Cypress automation:** repeatable UI journeys and direct API checks, each mapped to a test case ID and Allure metadata.
- **Types:** functional smoke/regression, authentication, authorization, injection/input handling, sensitive-data exposure, security configuration, and session behavior.

### 5. OWASP Top 10 (2021) risk mapping

| Category | Main risk | Covered cases |
| --- | --- | --- |
| Functional | Critical journeys fail | TC-001–TC-004 |
| A01 Broken Access Control | Unauthorized data or function access | TC-007–TC-009 |
| A02 Cryptographic Failures | Sensitive data/password exposure | TC-010–TC-011 |
| A03 Injection | SQL injection and XSS | TC-005–TC-006 |
| A05 Security Misconfiguration | Missing controls or exposed internals | TC-012–TC-015 |
| A07 Identification and Authentication Failures | Weak password, brute force, token reuse | TC-016–TC-018 |

### 6. Entry and exit criteria

**Entry:** Docker is available; the pinned execution target responds on localhost; dependencies are installed; test data is isolated.  
**Exit:** all planned cases have a recorded status and evidence; failures are reproducible and linked to bug reports; automated checks and Allure results are generated; blockers and residual risks are documented.

### 7. Severity and priority matrix

| Level | Severity (impact) | Priority (urgency) |
| --- | --- | --- |
| Critical / P0 | Full compromise or broad sensitive-data exposure | Immediate |
| High / P1 | Major security or core-flow impact | Next fix cycle |
| Medium / P2 | Limited impact or defense-in-depth gap | Planned fix |
| Low / P3 | Minor impact, hardening, or cosmetic issue | Backlog |

### 8. Assumptions, constraints, and ethical notice

The lab is local, disposable, and controlled. Test accounts contain no real data. Juice Shop is intentionally vulnerable, results may vary by version, and browser coverage is limited. Never execute these tests against another host or without explicit written authorization. Do not create reusable exploits or offensive tooling.

### 9. Two-day schedule

| Day | Activities | Deliverables |
| --- | --- | --- |
| 1 | Environment check, functional baseline, A03 and A01 exploration | Evidence and initial findings |
| 2 | A02, A05, A07, automation, reruns, and reporting | Final statuses, bugs, Allure report |

---

## Português (PT-BR)

### 1. Objetivo e escopo

**Objetivo:** avaliar a qualidade funcional e riscos comuns de segurança em uma instância controlada do OWASP Juice Shop.

**Dentro do escopo:** login, cadastro, busca, cesta, controle de acesso, autenticação, exposição de dados via API, tratamento de entradas, cabeçalhos de segurança, erros, recursos expostos e endpoints de monitoramento. Inclui testes exploratórios manuais e automação Cypress de UI/API.

**Fora do escopo:** negação de serviço, testes destrutivos, engenharia social, sistemas de terceiros, ambientes produtivos e qualquer host diferente de `http://localhost:3000`.

### 2. Aplicação sob teste

- Aplicação: OWASP Juice Shop
- Versão em execução: `20.2.0`
- Imagem do contêiner: `bkimminich/juice-shop:latest` (o digest resolvido deve ser registrado a cada execução)
- Alvo: `http://localhost:3000`

### 3. Ambiente

| Componente | Configuração |
| --- | --- |
| Execução | Docker / Docker Compose |
| Runtime de testes | Node.js 24.9.0 |
| Automação | Cypress 16.1.1 + TypeScript 7.0.2 |
| Relatórios | allure-cypress 3.13.0 + Allure Report 2.46.1 |
| Navegador | Electron 146 headless; registrar alternativas por execução |

### 4. Estratégia e tipos de teste

- **Exploratório manual:** validar comportamentos, descobrir casos extremos e coletar evidências reproduzíveis.
- **Automação Cypress:** jornadas de UI e verificações diretas de API, cada uma ligada ao ID do caso e aos metadados Allure.
- **Tipos:** fumaça/regressão funcional, autenticação, autorização, injeção/tratamento de entradas, exposição de dados sensíveis, configuração de segurança e comportamento de sessão.

### 5. Mapeamento de riscos — OWASP Top 10 (2021)

| Categoria | Risco principal | Casos cobertos |
| --- | --- | --- |
| Funcional | Falha em jornadas críticas | TC-001–TC-004 |
| A01 Controle de Acesso Quebrado | Acesso indevido a dados ou funções | TC-007–TC-009 |
| A02 Falhas Criptográficas | Exposição de dados sensíveis/senhas | TC-010–TC-011 |
| A03 Injeção | Injeção de SQL e XSS | TC-005–TC-006 |
| A05 Configuração Incorreta de Segurança | Controles ausentes ou detalhes internos expostos | TC-012–TC-015 |
| A07 Falhas de Identificação e Autenticação | Senha fraca, força bruta e reutilização de token | TC-016–TC-018 |

### 6. Critérios de entrada e saída

**Entrada:** Docker disponível; alvo definido respondendo em localhost; dependências instaladas; dados de teste isolados.  
**Saída:** todos os casos planejados com status e evidência; falhas reproduzíveis e ligadas a bugs; verificações automatizadas e resultados Allure gerados; bloqueios e riscos residuais documentados.

### 7. Matriz de severidade e prioridade

| Nível | Severidade (impacto) | Prioridade (urgência) |
| --- | --- | --- |
| Crítica / P0 | Comprometimento total ou exposição ampla de dados sensíveis | Imediata |
| Alta / P1 | Grande impacto de segurança ou em fluxo essencial | Próximo ciclo de correção |
| Média / P2 | Impacto limitado ou lacuna de defesa em profundidade | Correção planejada |
| Baixa / P3 | Impacto menor, hardening ou problema cosmético | Backlog |

### 8. Premissas, restrições e aviso ético

O laboratório é local, descartável e controlado. As contas de teste não contêm dados reais. O Juice Shop é propositalmente vulnerável, os resultados podem variar por versão e a cobertura de navegadores é limitada. Nunca execute estes testes contra outro host ou sem autorização explícita por escrito. Não crie exploits reutilizáveis nem ferramentas ofensivas.

### 9. Cronograma de dois dias

| Dia | Atividades | Entregáveis |
| --- | --- | --- |
| 1 | Verificação do ambiente, base funcional e exploração de A03 e A01 | Evidências e achados iniciais |
| 2 | A02, A05, A07, automação, reexecuções e relatório | Status finais, bugs e relatório Allure |
