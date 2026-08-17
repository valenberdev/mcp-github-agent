import { CreateIssueInputSchema, CreateRepositoryInputSchema, ListRepositoriesInputSchema, CreateCommitInputSchema, ListIssuesInputSchema } from "../src/schemas/index.js";

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

describe("ListRepositoriesInputSchema", () => {
  it("acepta un input válido", () => {
    const result = ListRepositoriesInputSchema.safeParse({
      type: "public",
      sort: "updated",
      per_page: 10,
    });

    expect(result.success).toBe(true);
  });

  it("rechaza un tipo fuera del enum permitido", () => {
    const result = ListRepositoriesInputSchema.safeParse({
      type: "archived",
    });

    expect(result.success).toBe(false);
  });
});

describe("CreateCommitInputSchema", () => {
  it("acepta un input válido", () => {
    const result = CreateCommitInputSchema.safeParse({
      owner: "usuario",
      repo: "mi-repo",
      path: "main",
      content: "texto",
      message: "texto",
    });

    expect(result.success).toBe(true);
  });


  it("rechaza un mensaje de commit con menos de 3 caracteres", () => {
  const result = CreateCommitInputSchema.safeParse({
    owner: "usuario",
    repo: "mi-repo",
    path: "main",
    content: "texto",
    message: "jh",
  });

  expect(result.success).toBe(false);
});
});

describe("ListIssuesInputSchema", () => {
  it("acepta un input válido", () => {
    const result = ListIssuesInputSchema.safeParse({
      owner: "usuario",
      repo: "repo",
      state: "open",
      per_page: 10,
    });

    expect(result.success).toBe(true);
  });

  it("enum rechaza por valor inválido", () => {
    const result = ListIssuesInputSchema.safeParse({
      state: "resume",
    });

    expect(result.success).toBe(false);
  });
});