import { CreateIssueInputSchema, CreateRepositoryInputSchema } from "../src/schemas/index.js";

describe("CreateRepositoryInputSchema", () => {
  it("acepta un input válido", () => {
    const result = CreateRepositoryInputSchema.safeParse({
      name: "mi-repo-valido",
      description: "Un repo de prueba",
      private: false,
    });

    expect(result.success).toBe(true);
  });

  it("rechaza un nombre con espacios", () => {
    const result = CreateRepositoryInputSchema.safeParse({
      name: "nombre con espacios",
    });

    expect(result.success).toBe(false);
  });
});

describe("CreateIssueInputSchema", () => {
    it("acepta un input valido", () => {
        const result = CreateIssueInputSchema.safeParse({
            owner: "usuario",
            repo: "nombre-repo",
            title: "issue-prueba",
        });

        expect(result.success).toBe(true);
    });

    it("rechaza un input invalido", () => {
        const result = CreateIssueInputSchema.safeParse({
            owner: "",
        });

        expect(result.success).toBe(false)
    });
});