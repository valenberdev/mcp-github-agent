export class ValidationError extends Error {
  code = "VALIDATION_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends Error {
    code = "AUTHENTICATION_ERROR";

    constructor(message: string) {
        super(message);
        this.name = "AuthenticationError";
    }
}

export class NetworkError extends Error {
    code = "NETWORK_ERROR";

    constructor(message: string) {
        super(message);
        this.name = "NetworkError";
    }
}

export class GitHubAPIError extends Error {
    code = "GITHUB_API_ERROR";
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "GitHubAPIError";
        this.status = status;
    }
}

export function handleError(err: any, context?: {resource?: string}): GitHubAPIError | AuthenticationError | NetworkError {
  if (err?.name === "ZodError") {
    return new GitHubAPIError("La respuesta de GitHub tuvo un formato inesperado.", 500);
  }
  if (err.status === 404) {
    return new GitHubAPIError( `El ${context?.resource ?? "recurso"} no fue encontrado. Verifica el nombre e intenta de nuevo.`, 404);
  }
  if (err.status === 401 || err.status === 403) {
    return new AuthenticationError("No se pudo autenticar con GitHub. Verifica que el token utilizado sea valido.");
  }
  if (err.status === 429) {
    return new GitHubAPIError("No quedan intentos, espera y se volvera a intentar automaticamente.", 429);
  }
  if (err.status === undefined) {
    return new NetworkError("No hubo respuesta del servidor.");
  }
  return new GitHubAPIError("Se produjo un error inesperado. Reintenta nuevamente.", err.status ?? 500);
}