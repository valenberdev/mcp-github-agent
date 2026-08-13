import { CreateCommitInputSchema } from "../schemas/index.js";
import { createCommit } from "../github/operations.js";
import { handleError } from "../errors/index.js";
import { withRetry } from "../utils/retry.js";
import type { ToolDefinition } from "../types.js";

export const createCommitTool: ToolDefinition = {
  name: "create_commit",
  description: "Crea o actualiza un archivo en un repositorio de GitHub mediante un commit, especificando la ruta del archivo, su contenido y un mensaje descriptivo del cambio.",
  inputSchema: CreateCommitInputSchema.shape,

  handler: async (args) => {
    const parsed = CreateCommitInputSchema.safeParse(args);

    if (!parsed.success) {
      return {
        ok: false,
        error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message },
      };
    }

    try {
      const commit = await withRetry(() => createCommit(parsed.data));
      return { ok: true, data: commit };
    } catch (err) {
      const handled = handleError(err, { resource: "repositorio" });
      return { ok: false, error: { code: handled.code, message: handled.message } };
    }
  },
};