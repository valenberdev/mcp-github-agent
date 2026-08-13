import { z } from "zod";

export const CreateRepositoryInputSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9_.-]+$/, {
      message:
        "el nombre solo puede contener letras, numeros, guiones, guiones bajos y puntos",
    }),
  description: z.string().optional(),
  private: z.boolean().default(false),
});

export type CreateRepositoryInput = z.infer<typeof CreateRepositoryInputSchema>;

export const ListRepositoriesInputSchema = z.object({
  type: z.enum(["all", "public", "private"]).default("all"),
  sort: z
    .enum(["created", "updated", "pushed", "full_name"])
    .default("updated"),
  per_page: z.number().min(1).max(100).default(30),
});

export type ListRepositoriesInput = z.infer<typeof ListRepositoriesInputSchema>;

export const CreateIssueInputSchema = z.object({
  owner: z.string().min(1).max(39),
  repo: z.string().min(1).max(100),
  title: z.string().min(3).max(100),
  body: z.string().optional(),
});

export type CreateIssueInput = z.infer<typeof CreateIssueInputSchema>;

export const CreateCommitInputSchema = z.object({
  owner: z.string().min(1).max(39),
  repo: z.string().min(1).max(100),
  message: z.string().min(3).max(100),
  path: z.string().min(1).max(100),
  content: z.string().min(1),
});

export type CreateCommitInput = z.infer<typeof CreateCommitInputSchema>;

export const ListIssuesInputSchema = z.object({
  owner: z.string().min(1).max(39),
  repo: z.string().min(1).max(100),
  state: z.enum(["open", "closed", "all"]).default("open"),
  per_page: z.number().min(1).max(100).default(30),
});

export type ListIssuesInput = z.infer<typeof ListIssuesInputSchema>;

export const RepoDTO = z.object({
  full_name: z.string(),
  html_url: z.string().url(),
  private: z.boolean(),
  description: z.string().nullable(),
  owner: z.object({
    login: z.string(),
  }),
});

export type RepoDTOType = z.infer<typeof RepoDTO>;

export const IssueDTO = z.object({
  number: z.number(),
  title: z.string(),
  html_url: z.string().url(),
  state: z.enum(["open", "closed"]),
});

export type IssueDTOType = z.infer<typeof IssueDTO>;

export const CommitDTO = z.object({
  sha: z.string(),
  html_url: z.string().url(),
});

export type CommitDTOType = z.infer<typeof CommitDTO>;

export const ListIssuesOutputDTO = z.object({
  items: z.array(IssueDTO),
});

export type ListIssuesOutputDTOType = z.infer<typeof ListIssuesOutputDTO>;