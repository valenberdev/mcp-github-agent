import { CreateCommitInputSchema, CommitDTO } from "../schemas/index.js";
import { createCommit } from "../github/operations.js";
import { handleError, ValidationError } from "../errors/index.js";
import { withRetry } from "../utils/retry.js";
import type { ToolDefinition } from "../types.js";

export const createCommitTool: ToolDefinition = {
  name: "create_commit",
  description:
    "Crea o actualiza un archivo en un repositorio de GitHub mediante un commit, especificando la ruta del archivo, su contenido y un mensaje descriptivo del cambio.",
  inputSchema: CreateCommitInputSchema.shape,

  handler: async (args) => {
    const parsed = CreateCommitInputSchema.safeParse(args);

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
      const rawResult = await withRetry(() => createCommit(parsed.data));
      const commit = CommitDTO.parse({
        sha: rawResult.commit.sha,
        html_url: rawResult.commit.html_url,
      });
      return { ok: true, data: commit };
    } catch (err) {
      const handled = handleError(err, { resource: "repositorio" });
      return {
        ok: false,
        error: { code: handled.code, message: handled.message },
      };
    }
  },
};
