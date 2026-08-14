import { vi } from "vitest";

vi.mock("../src/github/client.js", () => ({
  octokit: {
    rest: {
      repos: {
        listForAuthenticatedUser: vi.fn(),
        createForAuthenticatedUser: vi.fn(),
      },
    },
  },
}));

import { listRepositories, createRepository } from "../src/github/operations.js";
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