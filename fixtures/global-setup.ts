import { request, type FullConfig } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { loginUser, registerUser } from "../utils/api";
import { newTestUser } from "../utils/data";
import { AUTH_FILE, BID_STORAGE_KEY } from "./constants";

/**
 * Creates one throwaway user through the API and writes a Playwright
 * storageState (token cookie + localStorage) so authenticated tests skip the
 * login form. Juice Shop keeps the basket id in sessionStorage, which
 * storageState does not capture, so it is saved under BID_STORAGE_KEY and
 * restored by the `authenticatedPage` fixture.
 */
export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0].use.baseURL as string;
  const api = await request.newContext({ baseURL });
  const user = newTestUser("pw-shared");

  await registerUser(api, user);
  const { token, bid } = await loginUser(api, user);
  await api.dispose();

  const { hostname } = new URL(baseURL);
  mkdirSync(dirname(AUTH_FILE), { recursive: true });
  writeFileSync(
    AUTH_FILE,
    JSON.stringify({
      cookies: [
        { name: "token", value: token, domain: hostname, path: "/", expires: -1, httpOnly: false, secure: false, sameSite: "Lax" },
      ],
      origins: [
        {
          origin: new URL(baseURL).origin,
          localStorage: [
            { name: "token", value: token },
            { name: BID_STORAGE_KEY, value: String(bid) },
          ],
        },
      ],
    }),
  );
}
