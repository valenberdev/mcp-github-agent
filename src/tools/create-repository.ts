import { CreateRepositoryInputSchema, RepoDTO } from "../schemas/index.js";
import { createRepository } from "../github/operations.js";
import { handleError, ValidationError } from "../errors/index.js";
import { withRetry } from "../utils/retry.js";
import type { ToolDefinition } from "../types.js";

export const createRepositoryTool: ToolDefinition = {
  name: "create_repository",
  description: "Crea un nuevo repositorio en GitHub para el usuario autenticado, con un nombre y una descripción opcional.",
  inputSchema: CreateRepositoryInputSchema.shape,

  handler: async (args) => {
    const parsed = CreateRepositoryInputSchema.safeParse(args);

    if (!parsed.success) {
      const validationError = new ValidationError(parsed.error.issues[0].message);
      return {
        ok: false,
        error: { code: validationError.code, message: validationError.message },
      };
    }

    try {
      const rawRepo = await withRetry(() => createRepository(parsed.data));
      const repo = RepoDTO.parse(rawRepo);
      return { ok: true, data: repo };
    } catch (err) {
      const handled = handleError(err, { resource: "repositorio" });
      return { ok: false, error: { code: handled.code, message: handled.message } };
    }
  },
};