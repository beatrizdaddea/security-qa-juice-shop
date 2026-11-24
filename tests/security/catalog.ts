import type { Severity } from "../../utils/allure-meta";

export type Bilingual = readonly [string, string];
export const categories = {
  A01: "A01:2021 Broken Access Control",
  A02: "A02:2021 Cryptographic Failures",
  A03: "A03:2021 Injection",
  A05: "A05:2021 Security Misconfiguration",
  A07: "A07:2021 Identification and Authentication Failures",
  A09: "A09:2021 Security Logging and Monitoring Failures",
} as const;
export interface SecurityCase {
  id: string;
  title: Bilingual;
  owasp: keyof typeof categories;
  severity: Severity;
  precondition: Bilingual;
  steps: Bilingual;
  expected: Bilingual;
  known?: Bilingual;
}
const local: Bilingual = ["Juice Shop is available at http://localhost:3000.", "Juice Shop disponível em http://localhost:3000."];
const users: Bilingual = ["Two new, distinct customer accounts with their own baskets.", "Duas contas novas e distintas de clientes, com suas próprias cestas."];
const account: Bilingual = ["A newly registered customer account.", "Uma conta de cliente recém-cadastrada."];
const headerCase = (id: string, header: string, owasp: SecurityCase["owasp"], expected: Bilingual, known?: Bilingual): SecurityCase => ({
  id, title: [`${header} is configured safely`, `${header} configurado com segurança`], owasp, severity: "normal", precondition: local,
  steps: [`GET / and inspect ${header}.`, `Execute GET / e inspecione ${header}.`], expected, known,
});

export const securityCases: SecurityCase[] = [
  { id: "TC-019", title: ["anonymous administration access is denied", "acesso anônimo à administração negado"], owasp: "A01", severity: "critical", precondition: local,
    steps: ["Open /#/administration without a session; request /api/Users.", "Abra /#/administration sem sessão; consulte /api/Users."],
    expected: ["No administration component; users API returns 401/403.", "Componente administrativo ausente; API de usuários retorna 401/403."] },
  { id: "TC-020", title: ["customer administration access is denied", "acesso de cliente à administração negado"], owasp: "A01", severity: "critical", precondition: account,
    steps: ["Log in as a customer through the UI; open /#/administration and request /api/Users with that token.", "Entre como cliente pela interface; abra /#/administration e consulte /api/Users com esse token."],
    expected: ["No administration component; users API returns 401/403.", "Componente administrativo ausente; API de usuários retorna 401/403."],
    known: ["Users API exposes customer data to a regular customer (BUG-TC-010), independently of the UI route guard.", "API de usuários expõe dados a cliente comum (BUG-TC-010), independentemente do guard da rota da interface."] },
  { id: "TC-021", title: ["another customer's basket is private", "cesta de outro cliente é privada"], owasp: "A01", severity: "critical", precondition: users,
    steps: ["Verify B can read B's basket; request that same basket with A's token.", "Confirme que B consulta sua cesta; consulte essa mesma cesta com o token de A."],
    expected: ["A receives 401/403/404 and no basket data.", "A recebe 401/403/404 e nenhum dado da cesta."],
    known: ["Basket API does not verify ownership (BUG-TC-007).", "API de cestas não verifica propriedade (BUG-TC-007)."] },
  { id: "TC-022", title: ["another customer's order is private", "pedido de outro cliente é privado"], owasp: "A01", severity: "critical", precondition: users,
    steps: ["B checks out one test product; verify B's order exists; request its tracking ID using A's token.", "B finaliza um produto de teste; confirme a existência do pedido de B; consulte seu ID de rastreio com o token de A."],
    expected: ["A receives 401/403/404 and no order data.", "A recebe 401/403/404 e nenhum dado do pedido."],
    known: ["The tracking API returns B's newly created order to A with HTTP 200.", "API de rastreio devolve o pedido recém-criado de B para A com HTTP 200."] },
  headerCase("TC-023", "Content-Security-Policy", "A05", ["Enforced CSP restricts scripts and objects; no unsafe-inline/unsafe-eval or wildcard scripts.", "CSP obrigatória restringe scripts e objetos; sem unsafe-inline/unsafe-eval ou scripts de qualquer origem."], ["No enforced CSP header on the local application.", "Aplicação local sem header de CSP obrigatória."]),
  headerCase("TC-024", "Strict-Transport-Security", "A02", ["HSTS has max-age >= 31536000 and includeSubDomains (header baseline only on HTTP).", "HSTS com max-age >= 31536000 e includeSubDomains (somente baseline do header em HTTP)."], ["HSTS is absent; HTTP localhost does not exercise transport enforcement.", "HSTS ausente; localhost HTTP não exercita aplicação da proteção de transporte."]),
  headerCase("TC-025", "X-Frame-Options", "A05", ["DENY or SAMEORIGIN.", "DENY ou SAMEORIGIN."]),
  headerCase("TC-026", "X-Content-Type-Options", "A05", ["Exactly nosniff.", "Exatamente nosniff."]),
  headerCase("TC-027", "Referrer-Policy", "A05", ["no-referrer, same-origin, strict-origin or strict-origin-when-cross-origin.", "no-referrer, same-origin, strict-origin ou strict-origin-when-cross-origin."], ["Referrer-Policy header is absent.", "Header Referrer-Policy ausente."]),
  { id: "TC-028", title: ["CORS restricts an opaque origin on private data", "CORS restringe origem opaca em dados privados"], owasp: "A05", severity: "normal", precondition: account,
    steps: ["GET the customer's basket and OPTIONS the same path with Origin: null and requested Authorization header.", "Execute GET na cesta do cliente e OPTIONS no mesmo caminho com Origin: null e header Authorization solicitado."],
    expected: ["CORS does not permit the opaque origin to read authenticated data; no wildcard or null allow-origin.", "CORS não permite que a origem opaca leia dados autenticados; allow-origin sem curinga ou null."],
    known: ["Authenticated basket response and preflight allow wildcard origins and the authorization request header.", "Resposta autenticada de cesta e preflight permitem origens com curinga e header authorization."] },
  { id: "TC-029", title: ["FTP listing is not public", "listagem FTP não é pública"], owasp: "A05", severity: "normal", precondition: local,
    steps: ["GET /ftp/ anonymously; inspect directory content rather than just HTTP 200.", "Execute GET /ftp/ anonimamente; inspecione o conteúdo do diretório além do HTTP 200."],
    expected: ["401/403/404 and no directory listing.", "401/403/404 e nenhuma listagem de diretório."], known: ["Public /ftp/ directory listing (BUG-TC-013).", "Listagem pública de /ftp/ (BUG-TC-013)."] },
  { id: "TC-030", title: ["metrics are not public", "métricas não são públicas"], owasp: "A05", severity: "normal", precondition: local,
    steps: ["GET /metrics anonymously; inspect Prometheus HELP/TYPE markers.", "Execute GET /metrics anonimamente; inspecione marcadores HELP/TYPE do Prometheus."],
    expected: ["401/403/404 and no metrics data.", "401/403/404 e nenhum dado de métricas."], known: ["Public Prometheus metrics (BUG-TC-015).", "Métricas Prometheus públicas (BUG-TC-015)."] },
  { id: "TC-031", title: ["SQL injection cannot authenticate", "injeção SQL não autentica"], owasp: "A03", severity: "critical", precondition: local,
    steps: ["Confirm ordinary invalid credentials are rejected; submit the bounded training input to POST /rest/user/login.", "Confirme rejeição de credenciais inválidas comuns; envie a entrada limitada de treinamento a POST /rest/user/login."],
    expected: ["400/401/403 without an authentication token.", "400/401/403 sem token de autenticação."], known: ["Login accepts the training SQL input (BUG-TC-005).", "Login aceita entrada SQL de treinamento (BUG-TC-005)."] },
  { id: "TC-032", title: ["search encodes reflected HTML", "busca codifica HTML refletido"], owasp: "A03", severity: "critical", precondition: local,
    steps: ["Search for a harmless bold marker; inspect the rendered search-value element and HTML encoding.", "Busque um marcador inofensivo em negrito; inspecione o elemento que exibe a busca e a codificação HTML."],
    expected: ["Marker is displayed as literal text without a bold DOM element.", "Marcador exibido como texto literal, sem elemento em negrito no DOM."], known: ["Search interprets reflected HTML (BUG-TC-006).", "Busca interpreta HTML refletido (BUG-TC-006)."] },
  { id: "TC-033", title: ["search never executes reflected script", "busca nunca executa script refletido"], owasp: "A03", severity: "critical", precondition: local,
    steps: ["Search using a local-only iframe/javascript alert marker; wait for the render boundary and observe dialogs and iframe execution.", "Busque um marcador local de iframe/javascript com alert; aguarde a renderização e observe diálogos e execução do iframe."],
    expected: ["No JavaScript execution or executable iframe.", "Nenhuma execução JavaScript ou iframe executável."],
    known: ["The search renders the javascript iframe and executes the local alert marker (DOM-based XSS).", "Busca renderiza o iframe javascript e executa o alert local de teste (XSS baseado em DOM)."] },
  { id: "TC-034", title: ["server rejects a weak password", "servidor rejeita senha fraca"], owasp: "A07", severity: "normal", precondition: local,
    steps: ["Register a unique test user via API with password 12345; if accepted, verify login with that password.", "Cadastre usuário único pela API com senha 12345; se aceito, confirme login com essa senha."],
    expected: ["Registration returns 400/422; client-side validation alone is insufficient.", "Cadastro retorna 400/422; validação somente no cliente é insuficiente."],
    known: ["API accepts 12345 with HTTP 201 and the account can log in using it.", "API aceita 12345 com HTTP 201 e a conta consegue entrar com essa senha."] },
  { id: "TC-035", title: ["browser token cookie has protective flags", "cookie de token tem flags de proteção"], owasp: "A07", severity: "critical", precondition: account,
    steps: ["Log in through the UI without injecting authentication state; inspect the actual token cookie flags and script-readable storage.", "Entre pela interface sem injetar estado de autenticação; inspecione flags reais do cookie de token e armazenamento acessível por script."],
    expected: ["Session cookie is HttpOnly, Secure, SameSite=Lax/Strict; token is not in localStorage. Secure is a header/storage baseline on HTTP localhost.", "Cookie de sessão com HttpOnly, Secure, SameSite=Lax/Strict; token fora do localStorage. Secure é baseline de header/armazenamento em localhost HTTP."],
    known: ["Real UI login creates a token cookie without HttpOnly/Secure and stores the JWT in localStorage; SameSite is Lax.", "Login real pela interface cria cookie de token sem HttpOnly/Secure e grava JWT no localStorage; SameSite é Lax."] },
  { id: "TC-036", title: ["JWT has a bounded lifetime", "JWT possui validade limitada"], owasp: "A07", severity: "normal", precondition: account,
    steps: ["Log in; decode only JWT timing claims and compare exp/iat to the one-hour suite baseline.", "Entre; decodifique somente claims de tempo do JWT e compare exp/iat ao baseline de uma hora da suíte."],
    expected: ["Numeric iat/exp, token currently valid, lifetime > 0 and <= 3600 seconds.", "iat/exp numéricos, token válido no momento, validade > 0 e <= 3600 segundos."],
    known: ["Login JWT lacks exp in this Juice Shop 20.2.0 container (legacy jsonwebtoken 0.4.0); lifetime is unbounded.", "JWT de login não possui exp neste container Juice Shop 20.2.0 (jsonwebtoken legado 0.4.0); validade ilimitada."] },
  { id: "TC-037", title: ["server rejects an authentically signed expired JWT", "servidor rejeita JWT expirado com assinatura autêntica"], owasp: "A07", severity: "critical", precondition: ["New customer and the project's running Docker Compose juice-shop service.", "Novo cliente e serviço juice-shop do Docker Compose do projeto em execução."],
    steps: ["Inside the container use the application's authorize function to sign a fresh control and an expired token for this customer; verify both signatures, accept the control on the customer's basket, then replay the expired token.", "Dentro do container use authorize do aplicativo para assinar controle válido e token expirado deste cliente; verifique ambas as assinaturas, aceite o controle na cesta do cliente e envie o token expirado."],
    expected: ["Fresh signed control returns 200; expired signed token returns 401/403.", "Controle assinado válido retorna 200; token assinado expirado retorna 401/403."] },
  { id: "TC-038", title: ["malformed JSON produces no verbose internal error", "JSON malformado não gera erro interno verboso"], owasp: "A09", severity: "normal", precondition: local,
    steps: ["POST malformed JSON to /rest/user/login; inspect status and stack/SQL/path indicators in the response.", "Envie JSON malformado a /rest/user/login; inspecione status e indicadores de stack/SQL/caminhos na resposta."],
    expected: ["400 response without stack traces, database details or internal paths. Response-only check; does not prove server-side audit logging.", "Resposta 400 sem stack traces, detalhes de banco ou caminhos internos. Verificação da resposta; não comprova logs de auditoria do servidor."], known: ["Malformed JSON leaks internal error details (BUG-TC-014); secondary A05 mapping.", "JSON malformado vaza detalhes internos (BUG-TC-014); mapeamento secundário A05."] },
];

export function securityCase(id: string): SecurityCase {
  const entry = securityCases.find((item) => item.id === id);
  if (!entry) throw new Error(`Unregistered security case: ${id}`);
  return entry;
}
export const title = (id: string): string => `${id} ${securityCase(id).title[0]}`;
export function details(id: string) {
  const entry = securityCase(id);
  return {
    tag: ["@security", `@owasp-${entry.owasp}`],
    annotation: [
      { type: "OWASP", description: categories[entry.owasp] },
      { type: "severity", description: entry.severity },
      ...(entry.known ? [{ type: "known-vuln", description: entry.known.join(" / ") }] : []),
    ],
  };
}
