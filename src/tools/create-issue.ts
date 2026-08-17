import { CreateIssueInputSchema, IssueDTO } from "../schemas/index.js";
import { createIssue } from "../github/operations.js";
import { handleError } from "../errors/index.js";
import { withRetry } from "../utils/retry.js";
import type { ToolDefinition } from "../types.js";

export const createIssueTool: ToolDefinition = {
  name: "create_issue",
  description: "Crea un nuevo issue en un repositorio de GitHub, con un título y una descripción opcional.",
  inputSchema: CreateIssueInputSchema.shape,

  handler: async (args) => {
    const parsed = CreateIssueInputSchema.safeParse(args);

    if (!parsed.success) {
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues[0].message,
        },
      };
    }

    try {
      const rawIssue = await withRetry(() => createIssue(parsed.data));
      const issue = IssueDTO.parse(rawIssue);
      return { ok: true, data: issue };
    } catch (err) {
      const handled = handleError(err, { resource: "repositorio" });
      return {
        ok: false,
        error: { code: handled.code, message: handled.message },
      };
    }
  },
};