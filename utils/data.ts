import { randomBytes } from "node:crypto";

export interface TestUser {
  email: string;
  password: string;
}

/** Unique, collision-free e-mail for parallel runs. */
export function uniqueEmail(prefix: string): string {
  return `${prefix}.${Date.now()}.${randomBytes(3).toString("hex")}@example.com`;
}

/** Random password satisfying Juice Shop's policy; never hardcoded in the repo. */
export function randomPassword(): string {
  return `Qa!${randomBytes(9).toString("base64url")}9a`;
}

export function newTestUser(prefix: string): TestUser {
  return { email: uniqueEmail(prefix), password: randomPassword() };
}

export const SECURITY_QUESTION = { id: 1, question: "Your eldest siblings middle name?" };
export const SECURITY_ANSWER = "qa-answer";
