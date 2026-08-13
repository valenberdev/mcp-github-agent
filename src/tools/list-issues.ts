import { ListIssuesInputSchema } from "../schemas/index.js";
import { listIssues } from "../github/operations.js";
import { handleError } from "../errors/index.js";
import { withRetry } from "../utils/retry.js";
import type { ToolDefinition } from "../types.js";

export const listIssuesTool: ToolDefinition = {
  name: "list_issues",
  description: "Lista los issues de un repositorio específico de GitHub, permitiendo filtrar por estado (abiertos, cerrados o todos).",
  inputSchema: ListIssuesInputSchema.shape,

  handler: async (args) => {
    const parsed = ListIssuesInputSchema.safeParse(args);

    if (!parsed.success) {
      return {
        ok: false,
        error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message },
      };
    }

    try {
      const issues = await withRetry(() => listIssues(parsed.data));
      return { ok: true, data: issues };
    } catch (err) {
      const handled = handleError(err, { resource: "repositorio" });
      return { ok: false, error: { code: handled.code, message: handled.message } };
    }
  },
};