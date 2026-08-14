import { handleError, GitHubAPIError, AuthenticationError } from "../src/errors/index.js";

describe("handleError", () => {
  it("transforma un error 404 en GitHubAPIError con mensaje comprensible", () => {
    const fakeError = { status: 404 };
    const result = handleError(fakeError, { resource: "repositorio" });

    expect(result).toBeInstanceOf(GitHubAPIError);
    expect(result.code).toBe("GITHUB_API_ERROR");
    expect(result.message).toContain("repositorio");
  });

  it("transforma un error 401 en AuthenticationError con mensaje accionable", () => {
    const fakeError = { status: 401 };
    const result = handleError(fakeError);

    expect(result).toBeInstanceOf(AuthenticationError);
    expect(result.code).toBe("AUTHENTICATION_ERROR");
    expect(result.message).toContain("token");
  });
});

