import { addSecurityMetadata, assertSecure, securityStep } from "../../support/security";

interface AuthData {
  token: string;
  bid: number;
  id: number;
}

const PASSWORD = "Qa!Secure12345";

function uniqueEmail(prefix: string): string {
  return `${prefix}.${Date.now()}.${Cypress._.random(1000, 9999)}@example.com`;
}

function register(email: string, password = PASSWORD): Cypress.Chainable<Cypress.Response<unknown>> {
  return cy.request({
    method: "POST",
    url: "/api/Users",
    failOnStatusCode: false,
    body: {
      email,
      password,
      passwordRepeat: password,
      securityQuestion: { id: 1, question: "Your eldest siblings middle name?" },
      securityAnswer: "qa-answer",
    },
  }).then((response) => {
    expect(response.status, "test-user registration status").to.be.oneOf([200, 201]);
  });
}

function login(email: string, password = PASSWORD): Cypress.Chainable<AuthData> {
  return cy.request({
    method: "POST",
    url: "/rest/user/login",
    failOnStatusCode: false,
    body: { email, password },
  }).then((response) => {
    expect(response.status, "test-user login status").to.equal(200);
    return {
      token: response.body.authentication.token,
      bid: response.body.authentication.bid,
      id: response.body.authentication.umail ? response.body.authentication.id : response.body.user?.data?.id,
    } as AuthData;
  });
}

describe("OWASP Juice Shop API security cases", () => {
  it("TC-005 SQL injection training input is rejected", () => {
    addSecurityMetadata("Injection", "critical", "A03:2021");
    securityStep("Submit the controlled SQL injection training input");

    cy.request({
      method: "POST",
      url: "/rest/user/login",
      failOnStatusCode: false,
      body: { email: "' OR 1=1--", password: "training-only" },
    }).then((response) => {
      const hasToken = Boolean(response.body?.authentication?.token);
      // Known failure is tracked in bugs/BUG-TC-005.md when reproduced.
      assertSecure(
        [400, 401].includes(response.status) && !hasToken,
        "bugs/BUG-TC-005.md",
        `SQL injection input was accepted (HTTP ${response.status}).`,
      );
    });
  });

  it("TC-007 user cannot access another user's basket", () => {
    addSecurityMetadata("Broken Access Control", "critical", "A01:2021");
    const userA = uniqueEmail("idor-a");
    const userB = uniqueEmail("idor-b");

    securityStep("Create two isolated test users and baskets");
    register(userA).then(() => register(userB));
    login(userA).then((authA) => {
      login(userB).then((authB) => {
        securityStep("Request user B's basket with user A's token");
        cy.request({
          method: "GET",
          url: `/rest/basket/${authB.bid}`,
          headers: { Authorization: `Bearer ${authA.token}` },
          failOnStatusCode: false,
        }).then((response) => {
          // Known failure is tracked in bugs/BUG-TC-007.md when reproduced.
          assertSecure(
            [401, 403, 404].includes(response.status),
            "bugs/BUG-TC-007.md",
            `Another user's basket was accessible (HTTP ${response.status}).`,
          );
        });
      });
    });
  });

  it("TC-009 protected endpoints require authentication", () => {
    addSecurityMetadata("Broken Access Control", "critical", "A01:2021");
    securityStep("Request a protected basket without an authorization header");

    cy.request({ method: "GET", url: "/rest/basket/1", failOnStatusCode: false }).then((response) => {
      assertSecure(
        [401, 403].includes(response.status),
        "bugs/BUG-TC-009.md",
        `Protected basket endpoint returned HTTP ${response.status} without authentication.`,
      );
    });
  });

  it("TC-010 API responses do not expose sensitive user data", () => {
    addSecurityMetadata("Cryptographic Failures", "critical", "A02:2021");
    const email = uniqueEmail("sensitive-data");

    register(email).then(() => login(email)).then((auth) => {
      securityStep("Request the users endpoint with a regular-user token");
      cy.request({
        method: "GET",
        url: "/api/Users",
        headers: { Authorization: `Bearer ${auth.token}` },
        failOnStatusCode: false,
      }).then((response) => {
        const serialized = JSON.stringify(response.body).toLowerCase();
        const exposesSensitiveFields = /"(password|totpsecret|deluxeToken|token)"/i.test(serialized);
        const records = response.body?.data;
        const exposesOtherUsers = Array.isArray(records) && records.length > 1;
        assertSecure(
          [401, 403].includes(response.status) || (!exposesSensitiveFields && !exposesOtherUsers),
          "bugs/BUG-TC-010.md",
          "The users API exposed sensitive fields or data belonging to other users.",
        );
      });
    });
  });

  it("TC-012 recommended security headers are present", () => {
    addSecurityMetadata("Security Misconfiguration", "normal", "A05:2021");
    securityStep("Inspect response headers from the local application");

    cy.request("/").then((response) => {
      const headers = response.headers;
      const hasFrameProtection = Boolean(headers["x-frame-options"] || headers["content-security-policy"]?.includes("frame-ancestors"));
      const required = Boolean(
        headers["content-security-policy"] &&
        headers["x-content-type-options"] === "nosniff" &&
        hasFrameProtection &&
        headers["referrer-policy"],
      );
      assertSecure(required, "bugs/BUG-TC-012.md", "One or more recommended security headers are missing or unsafe.");
    });
  });

  it("TC-013 FTP directory does not expose files", () => {
    addSecurityMetadata("Security Misconfiguration", "normal", "A05:2021");
    securityStep("Request the FTP directory anonymously");

    cy.request({ method: "GET", url: "/ftp", failOnStatusCode: false }).then((response) => {
      assertSecure(
        [401, 403, 404].includes(response.status),
        "bugs/BUG-TC-013.md",
        `The /ftp directory is publicly accessible (HTTP ${response.status}).`,
      );
    });
  });

  it("TC-014 error responses do not leak internal details", () => {
    addSecurityMetadata("Security Misconfiguration", "normal", "A05:2021");
    securityStep("Send malformed JSON and inspect the error response");

    cy.request({
      method: "POST",
      url: "/rest/user/login",
      headers: { "Content-Type": "application/json" },
      body: '{"email":',
      failOnStatusCode: false,
    }).then((response) => {
      const body = typeof response.body === "string" ? response.body : JSON.stringify(response.body);
      const leaksInternals = /(stack|sequelize|node_modules|\.js:\d+|syntaxerror)/i.test(body);
      assertSecure(
        response.status < 500 && !leaksInternals,
        "bugs/BUG-TC-014.md",
        `Malformed input exposed internal error details (HTTP ${response.status}).`,
      );
    });
  });

  it("TC-015 metrics endpoint is not public", () => {
    addSecurityMetadata("Security Misconfiguration", "normal", "A05:2021");
    securityStep("Request the metrics endpoint anonymously");

    cy.request({ method: "GET", url: "/metrics", failOnStatusCode: false }).then((response) => {
      assertSecure(
        [401, 403, 404].includes(response.status),
        "bugs/BUG-TC-015.md",
        `The /metrics endpoint is publicly accessible (HTTP ${response.status}).`,
      );
    });
  });

  it("TC-017 repeated failed logins trigger brute-force protection", () => {
    addSecurityMetadata("Identification and Authentication Failures", "critical", "A07:2021");
    const email = uniqueEmail("brute-force");
    const statuses: number[] = [];

    register(email).then(() => {
      securityStep("Send no more than 20 failed login attempts to localhost");
      Cypress._.times(20, () => {
        cy.request({
          method: "POST",
          url: "/rest/user/login",
          body: { email, password: "wrong-password" },
          failOnStatusCode: false,
        }).then((response) => statuses.push(response.status));
      });
    }).then(() => {
      assertSecure(
        statuses.some((status) => status === 429 || status === 403),
        "bugs/BUG-TC-017.md",
        "Twenty failed login attempts completed without throttling or lockout.",
      );
    });
  });

  it("TC-018 token is invalid after logout", () => {
    addSecurityMetadata("Identification and Authentication Failures", "normal", "A07:2021");
    const email = uniqueEmail("logout-token");

    register(email).then(() => login(email)).then((auth) => {
      securityStep("Log out and reuse the previous token");
      cy.request({
        method: "POST",
        url: "/rest/user/logout",
        headers: { Authorization: `Bearer ${auth.token}` },
        failOnStatusCode: false,
      }).then(() => {
        cy.request({
          method: "GET",
          url: `/rest/basket/${auth.bid}`,
          headers: { Authorization: `Bearer ${auth.token}` },
          failOnStatusCode: false,
        }).then((response) => {
          assertSecure(
            response.status === 401,
            "bugs/BUG-TC-018.md",
            `The pre-logout token remained valid (HTTP ${response.status}).`,
          );
        });
      });
    });
  });
});
