import { vi } from "vitest";

vi.mock("../src/github/client.js", () => ({
  octokit: {
    rest: {
      repos: {
        listForAuthenticatedUser: vi.fn(),
      },
    },
  },
}));

import { listRepositories } from "../src/github/operations.js";
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