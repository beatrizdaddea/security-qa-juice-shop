import { expect, type APIRequestContext } from "@playwright/test";
import { SECURITY_ANSWER, SECURITY_QUESTION, type TestUser } from "./data";

export interface Session {
  token: string;
  bid: number;
}

export async function registerUser(request: APIRequestContext, user: TestUser): Promise<void> {
  const response = await request.post("/api/Users", {
    data: {
      email: user.email,
      password: user.password,
      passwordRepeat: user.password,
      securityQuestion: SECURITY_QUESTION,
      securityAnswer: SECURITY_ANSWER,
    },
  });
  expect(response.status(), "test-user registration status").toBeLessThan(300);
}

export async function loginUser(request: APIRequestContext, user: TestUser): Promise<Session> {
  const response = await request.post("/rest/user/login", {
    data: { email: user.email, password: user.password },
  });
  expect(response.status(), "test-user login status").toBe(200);
  const { authentication } = await response.json();
  return { token: authentication.token, bid: authentication.bid };
}
