import { ListRepositoriesInputSchema, RepoDTO } from "../schemas/index.js";
import { listRepositories } from "../github/operations.js";
import { handleError, ValidationError } from "../errors/index.js";
import { withRetry } from "../utils/retry.js";
import type { ToolDefinition } from "../types.js";

export const listRepositoriesTool: ToolDefinition = {
  name: "list_repositories",
  description:
    "Lista los repositorios del usuario autenticado en GitHub. Permite filtrar por tipo (todos, públicos o privados) y ordenar por fecha de creación, actualización, último push o nombre.",
  inputSchema: ListRepositoriesInputSchema.shape,

  handler: async (args) => {
    const parsed = ListRepositoriesInputSchema.safeParse(args);

    if (!parsed.success) {
      const validationError = new ValidationError(
        parsed.error.issues[0].message,
      );
      return {
        ok: false,
        error: { code: validationError.code, message: validationError.message },
      };
    }

    try {
      const rawRepos = await withRetry(() => listRepositories(parsed.data));
      const repos = rawRepos.map((repo) => RepoDTO.parse(repo));
      return { ok: true, data: repos };
    } catch (err) {
      const handled = handleError(err);
      return {
        ok: false,
        error: { code: handled.code, message: handled.message },
      };
    }
  },
};
