/** Optional local ZAP proxy, shared by browser, API and setup contexts.
 * Proxy ZAP local opcional, compartilhado entre navegador, API e setup. */
export function zapProxyOptions() {
  const server = process.env.ZAP_PROXY;
  if (!server) return {};
  if (server !== "http://localhost:8080") throw new Error("ZAP_PROXY must be exactly http://localhost:8080.");
  return { proxy: { server }, ignoreHTTPSErrors: true };
}
