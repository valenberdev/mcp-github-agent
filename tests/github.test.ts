import { vi } from "vitest";

vi.mock("../src/github/client.js", () => ({
  octokit: {
    rest: {
      repos: {
        listForAuthenticatedUser: vi.fn(),
        createForAuthenticatedUser: vi.fn(),
        createOrUpdateFileContents: vi.fn(),
      },
      issues: {
        create: vi.fn(),
        listForRepo: vi.fn(),
      },
    },
  },
}));

import { listRepositories, createRepository, createIssue, createCommit, listIssues } from "../src/github/operations.js";
import { octokit } from "../src/github/client.js";

describe("listRepositories", () => {
  it("devuelve la lista de repos del usuario autenticado", async () => {
    const fakeRepos = [{ full_name: "usuario/repo1" }, { full_name: "usuario/repo2" }];

    (octokit.rest.repos.listForAuthenticatedUser as any).mockResolvedValue({
      data: fakeRepos,
    });

    const result = await listRepositories({ type: "all", sort: "updated", per_page: 30 });

    expect(result).toEqual(fakeRepos);
  });
});

describe("createRepository", () => {
  it("crea un repositorio y devuelve sus datos", async () => {
    const fakeRepo = { full_name: "usuario/nuevo-repo" };

    (octokit.rest.repos.createForAuthenticatedUser as any).mockResolvedValue({
      data: fakeRepo,
    });

    const result = await createRepository({
      name: "nuevo-repo",
      description: "un repo de prueba",
      private: false,
    });

    expect(result).toEqual(fakeRepo);
  });
});

describe ("createIssue", () => {
  it("crea un issue y devuelve sus datos", async () => {
    const fakeIssue = { number: 1, title: "Bug encontrado", html_url: "https://github.com/...", state: "open" };

    (octokit.rest.issues.create as any).mockResolvedValue({
      data: fakeIssue,
    });

    const result = await createIssue({
      owner: "usuario",
      repo: "mi-repo",
      title: "Bug encontrado",
    });

    expect(result).toEqual(fakeIssue);
  });
});

describe ("createCommit", () => {
  it("crea un commit y devuelve sus datos", async () => {
    const fakeCommitResponse = { commit: { sha: "abc123", html_url: "https://github.com/..." } };

    (octokit.rest.repos.createOrUpdateFileContents as any).mockResolvedValue({
      data: fakeCommitResponse,
    });

    const result = await createCommit({
      owner: "usuario",
      repo: "mi-repo",
      message: "mensaje",
      path: "main",
      content: "contenido"
    });

    expect(result).toEqual(fakeCommitResponse);
  });
});

describe('listIssues', () => { 
  it("hace un listado de los issues", async () => {
    const fakeIssues = [
  { number: 1, title: "Bug 1", html_url: "https://github.com/...", state: "open" },
  { number: 2, title: "Bug 2", html_url: "https://github.com/...", state: "open" },
];

    (octokit.rest.issues.listForRepo as any).mockResolvedValue({
      data: fakeIssues,
    });

    const result = await listIssues({
      owner: "usuario",
      repo: "repo",
      state: "open",
      per_page: 5
    });

    expect(result).toEqual(fakeIssues);
  });
 });