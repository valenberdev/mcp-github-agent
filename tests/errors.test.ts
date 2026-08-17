import {
  handleError,
  GitHubAPIError,
  AuthenticationError,
  NetworkError,
} from "../src/errors/index.js";

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

  it("transforma un error 403 en AuthenticationError por falta de permisos", () => {
    const fakeError = { status: 403 };
    const result = handleError(fakeError);

    expect(result).toBeInstanceOf(AuthenticationError);
    expect(result.code).toBe("AUTHENTICATION_ERROR");
    expect(result.message).toContain("permisos");
  });
  it("transforma un error 429 en GitHubAPIError de rate limit", () => {
    const fakeError = { status: 429 };
    const result = handleError(fakeError);

    expect(result).toBeInstanceOf(GitHubAPIError);
    expect(result.code).toBe("GITHUB_API_ERROR");
    expect(result.message).toContain("límite");
  });

  it("transforma un error sin status en NetworkError", () => {
    const fakeError = { status: undefined };
    const result = handleError(fakeError);

    expect(result).toBeInstanceOf(NetworkError);
    expect(result.code).toBe("NETWORK_ERROR");
  });
});
