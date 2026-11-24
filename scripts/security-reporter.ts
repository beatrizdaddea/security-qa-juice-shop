import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult } from "@playwright/test/reporter";
import { categories, securityCases, type SecurityCase } from "../tests/security/catalog";

type Execution = { test: TestCase; result: TestResult };
const severityPt = { blocker: "bloqueadora", critical: "crítica", normal: "normal", minor: "menor", trivial: "trivial" };

export default class SecurityReporter implements Reporter {
  private root = "";
  private executions = new Map<string, Execution>();
  private fullRun = false;
  private invalid: string[] = [];

  onBegin(config: FullConfig, suite: Suite): void {
    this.root = config.rootDir;
    const tests = suite.allTests();
    this.fullRun = tests.length === securityCases.length;
    const filtered = config.grep.toString() !== "/.*/" || config.grepInvert !== null || config.shard !== null;
    if (!this.fullRun && !filtered) this.invalid.push("missing catalog tests (use --grep for an intentional partial run)");
    const seen = new Set<string>();
    for (const item of tests) {
      const id = item.title.split(" ")[0];
      const entry = securityCases.find((candidate) => candidate.id === id);
      if (!entry || seen.has(id) || item.title !== `${id} ${entry.title[0]}` || !item.tags.includes("@security")
        || !item.annotations.some((a) => a.type === "OWASP" && a.description === categories[entry.owasp])
        || !item.annotations.some((a) => a.type === "severity" && a.description === entry.severity)) this.invalid.push(id);
      seen.add(id);
    }
    if (this.fullRun && securityCases.some((entry) => !seen.has(entry.id))) this.invalid.push("catalog coverage");
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    this.executions.set(test.title.split(" ")[0], { test, result });
  }

  outcome(entry: SecurityCase): string {
    const execution = this.executions.get(entry.id);
    if (!execution) return "Not run / Não executado";
    const { test, result } = execution;
    if (result.status === "skipped") return "Skipped / Ignorado";
    if (result.status === "failed" && test.expectedStatus === "failed"
      && test.annotations.some((a) => a.type === "security-observation")) return "Known vulnerability (expected failure) / Vulnerabilidade conhecida (falha esperada)";
    if (result.status === "passed" && test.expectedStatus === "failed") return "Unexpected pass: review remediation / Passou inesperadamente: revisar correção";
    if (result.status === "passed") return "Secure control passed / Controle seguro aprovado";
    return "Unexpected failure / Falha inesperada";
  }

  async onEnd(result: FullResult): Promise<{ status: "failed" } | void> {
    if (this.invalid.length) {
      console.error(`Security catalog/metadata mismatch: ${this.invalid.join(", ")}`);
      return { status: "failed" };
    }
    // Filtered runs must not replace evidence from the complete suite.
    // Execuções filtradas não devem substituir evidências da suíte completa.
    if (!this.fullRun) return;
    const lines = [
      "# Security tests / Testes de segurança", "",
      "Automated Playwright security verification of OWASP Juice Shop at **http://localhost:3000 only**. Cypress remains independent. IDs TC-019–TC-038 extend the existing case catalog.",
      "Verificação automatizada de segurança com Playwright no OWASP Juice Shop **somente em http://localhost:3000**. Cypress permanece independente. IDs TC-019–TC-038 estendem o catálogo existente.", "",
      "## Run / Executar", "",
      "Use the existing Node dependencies (`npm ci`) and Docker Desktop. No additional local security scanner or Java installation is required. The configured Chromium must be available (`npm run pw:install` if needed).",
      "Use as dependências Node existentes (`npm ci`) e Docker Desktop. Nenhum scanner de segurança ou Java local adicional é necessário. O Chromium configurado deve estar disponível (`npm run pw:install` se necessário).", "",
      "```sh", "docker compose up -d juice-shop", "npm run pw:security", "npm run pw:security:allure", "```", "",
      "Open `allure-report-security/index.html` through a local static server if needed; Playwright also writes `playwright-report-security/`. Results, attachments and reports are git-ignored. Docker runs the Allure Java CLI from the existing npm dependency. The JWT expiration case also uses Docker Compose to call the application's own signer inside the juice-shop container; signing keys never leave it.",
      "Abra `allure-report-security/index.html` por um servidor estático local se necessário; Playwright também grava `playwright-report-security/`. Resultados, anexos e relatórios são ignorados pelo Git. Docker executa a CLI Java do Allure da dependência npm existente. O caso de expiração JWT também usa Docker Compose para chamar o assinador do aplicativo dentro do container juice-shop; as chaves de assinatura nunca saem dele.", "",
      "## Interpretation / Interpretação", "",
      "The assertion always describes secure behavior. Only a documented, reproduced finding is marked `test.fail()` immediately before its final assertion, after setup, response checks and sanitized attachments succeed. A remediation becomes an **unexpected pass** and fails the command. Setup/network/timeout errors and new findings fail normally. No skips or blanket exit-code suppression are used.",
      "A asserção sempre descreve comportamento seguro. Somente um achado documentado e reproduzido recebe `test.fail()` imediatamente antes da asserção final, após preparação, verificações de resposta e anexos sanitizados. Uma correção vira **aprovação inesperada** e reprova o comando. Erros de preparação/rede/timeout e novos achados reprovam normalmente. Não há skips nem supressão genérica de código de saída.", "",
      "Allure groups Suites and Behaviors by OWASP category. Every case has @security, OWASP and severity annotations, epic/feature/severity labels and an OWASP tag. The installed allure-playwright treats expected failures as passed execution: the `known-vuln` tag, justification, **Security outcome** parameter and **security-finding** JSON attachment identify the vulnerability. Green execution does not mean a secure application.",
      "Allure agrupa Suites e Behaviors pela categoria OWASP. Todo caso tem @security, anotações OWASP e severidade, labels epic/feature/severity e tag OWASP. O allure-playwright instalado trata falhas esperadas como execução aprovada: a tag `known-vuln`, justificativa, parâmetro **Resultado de segurança** e anexo JSON **security-finding** identificam a vulnerabilidade. Execução verde não significa aplicação segura.", "",
      "HTTP requests use a fixed target and disable redirects; browser requests outside the exact origin are blocked, service workers are disabled and sockets are closed. Origin: null tests CORS without contacting another host. Evidence contains relevant request/response and DOM/flags, with credentials and email addresses redacted. Raw traces/videos/screenshots are disabled for this suite because they can expose session secrets.",
      "Requisições HTTP usam alvo fixo e desabilitam redirecionamentos; requisições do navegador fora da origem exata são bloqueadas, service workers são desabilitados e sockets são fechados. Origin: null testa CORS sem contatar outro host. Evidências contêm request/response e DOM/flags relevantes, com credenciais e e-mails ocultados. Traces/vídeos/screenshots brutos ficam desabilitados nesta suíte porque podem expor segredos de sessão.", "",
      "HSTS/Secure checks on HTTP localhost measure configuration baselines, not HTTPS transport enforcement. JWT lifetime uses an explicit <= 3600-second suite baseline; this is not a universal OWASP limit. Expiration is separately checked with authentic signatures, a working fresh-token control and a genuinely expired token. The A09 case checks response disclosure (secondary A05), not server-side audit log completeness. Test-created accounts/orders remain in the disposable lab database; use a fresh project container when a clean database is required.",
      "Verificações HSTS/Secure em localhost HTTP medem baseline de configuração, não proteção de transporte HTTPS. A validade JWT usa baseline explícito da suíte de <= 3600 segundos; esse não é um limite universal OWASP. A expiração é verificada separadamente com assinaturas autênticas, controle válido aceito e token realmente expirado. O caso A09 verifica exposição na resposta (A05 secundário), não completude dos logs de auditoria. Contas/pedidos de teste permanecem no banco descartável do laboratório; use um container novo do projeto quando precisar de banco limpo.", "",
      "Search reflects the URL fragment into the DOM in this version (DOM-based XSS), rather than sending each search term to the server. Its evidence therefore includes the initial product API request/response, submitted term, browser route and rendered DOM/execution marker. The order case confirms a real persisted order with products and the same database ID, avoiding the tracking endpoint's synthetic orderId-only fallback.",
      "A busca reflete o fragmento da URL no DOM nesta versão (XSS baseado em DOM), em vez de enviar cada termo ao servidor. Sua evidência inclui request/response inicial da API de produtos, termo enviado, rota do navegador e DOM/marcador de execução. O caso de pedido confirma registro persistido real com produtos e o mesmo ID no banco, evitando o fallback sintético do rastreio que contém apenas orderId.", "",
      "## Latest full execution / Última execução completa", "",
      `Completed / Concluída: ${new Date().toISOString()}. Runner status / Status da execução: **${result.status}**.`, "",
      "This matrix and the detailed cases below are generated from tests/security/catalog.ts and actual Playwright results by scripts/security-reporter.ts. Full runs validate IDs, titles, tags and annotations; filtered runs leave this document unchanged. Generated machine-readable results: test-results/security-results.json.",
      "Esta matriz e os casos detalhados abaixo são gerados a partir de tests/security/catalog.ts e resultados reais do Playwright por scripts/security-reporter.ts. Execuções completas validam IDs, títulos, tags e anotações; execuções filtradas mantêm este documento. Resultados gerados para leitura automatizada: test-results/security-results.json.", "",
      "The npm post-run hook also verifies actual Allure OWASP groups/labels, HTTP and finding attachments, JWT redaction, execution outcomes and matrix consistency. For targeted debugging use the Playwright CLI directly with this configuration and --grep; npm run pw:security is the full acceptance command.",
      "O hook pós-execução do npm também verifica grupos/labels OWASP reais do Allure, anexos HTTP e de achados, ocultação de JWT, resultados de execução e consistência da matriz. Para depuração direcionada use a CLI Playwright diretamente com esta configuração e --grep; npm run pw:security é o comando completo de aceite.", "",
      "| Test / Teste | OWASP 2021 | Severity / Severidade | Result / Resultado |",
      "| --- | --- | --- | --- |",
      ...securityCases.map((entry) => `| ${entry.id} ${entry.title.join(" / ")} | ${entry.owasp}:2021 | ${entry.severity} / ${severityPt[entry.severity]} | ${this.outcome(entry)} |`), "",
      "## Case details / Detalhes dos casos", "",
    ];
    for (const entry of securityCases) {
      const execution = this.executions.get(entry.id);
      const actual = execution?.test.annotations.find((a) => a.type === "security-observation")?.description;
      lines.push(`### ${entry.id}`, "",
        `1. **ID:** ${entry.id}`, `   **ID:** ${entry.id}`,
        `2. **Title:** ${entry.title[0]}`, `   **Título:** ${entry.title[1]}`,
        `3. **Precondition:** ${entry.precondition[0]}`, `   **Pré-condição:** ${entry.precondition[1]}`,
        `4. **Steps:** ${entry.steps[0]}`, `   **Passos:** ${entry.steps[1]}`,
        `5. **Expected result:** ${entry.expected[0]}`, `   **Resultado esperado:** ${entry.expected[1]}`,
        `6. **Actual result:** ${actual ? `Observed: \`${actual}\`.` : "No security verdict; inspect execution artifacts."}`, `   **Resultado obtido:** ${actual ? `Observado: \`${actual}\`.` : "Sem veredito de segurança; consulte artefatos da execução."}`,
        `7. **Status:** ${this.outcome(entry)}`, `   **Status:** ${this.outcome(entry)}`,
        `8. **Severity:** ${entry.severity}`, `   **Severidade:** ${severityPt[entry.severity]}`,
        `9. **OWASP Top 10 (2021) reference:** ${categories[entry.owasp]}`, `   **Referência OWASP Top 10 (2021):** ${categories[entry.owasp]}`, "");
      if (entry.known) lines.push(`Known-vuln justification: ${entry.known[0]}`, `Justificativa known-vuln: ${entry.known[1]}`, "");
    }
    lines.push("## References / Referências", "",
      "Expected-failure behavior: [Playwright test.fail](https://playwright.dev/docs/api/class-test#test-fail). Reporting API: [Allure Playwright reference](https://allurereport.org/docs/playwright-reference/).",
      "Comportamento de falha esperada: [Playwright test.fail](https://playwright.dev/docs/api/class-test#test-fail). API de relatórios: [Referência Allure Playwright](https://allurereport.org/docs/playwright-reference/).", "");
    const directory = resolve(this.root, "..", "..", "docs");
    mkdirSync(directory, { recursive: true });
    writeFileSync(resolve(directory, "SECURITY-TESTS.md"), lines.join("\n"));
  }
}
