import type { ZodRawShape } from "zod";

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

export type ToolDefinition = {
  name: string;
  description: string;
  inputSchema: ZodRawShape;
  handler: (args: any) => Promise<Result<any>>;
};
