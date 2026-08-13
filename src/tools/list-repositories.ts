import { ListRepositoriesInputSchema } from "../schemas/index.js";
import { listRepositories } from "../github/operations.js";
import { handleError } from "../errors/index.js";
import { withRetry } from "../utils/retry.js";
import type { ToolDefinition } from "../types.js";

export const listRepositoriesTool: ToolDefinition = {
  name: "list_repositories",
  description: "Lista los repositorios del usuario autenticado en GitHub. Permite filtrar por tipo (todos, públicos o privados) y ordenar por fecha de creación, actualización, último push o nombre.",
  inputSchema: ListRepositoriesInputSchema.shape,

  handler: async (args) => {
    const parsed = ListRepositoriesInputSchema.safeParse(args);

    if (!parsed.success) {
      return {
        ok: false,
        error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message },
      };
    }

    try {
      const repos = await withRetry(() => listRepositories(parsed.data));
      return { ok: true, data: repos };
    } catch (err) {
      const handled = handleError(err);
      return { ok: false, error: { code: handled.code, message: handled.message } };
    }
  },
};