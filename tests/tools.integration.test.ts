import { vi } from "vitest";

vi.mock("../src/github/client.js", () => ({
  octokit: {
    rest: {
      repos: {
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

import { createRepositoryTool } from "../src/tools/create-repository.js";
import { createIssueTool } from "../src/tools/create-issue.js";
import { octokit } from "../src/github/client.js";

describe("createRepositoryTool (integración)", () => {
  it("con input válido, crea el repo y devuelve ok:true", async () => {
    const fakeRepo = { full_name: "usuario/nuevo-repo" };

    (octokit.rest.repos.createForAuthenticatedUser as any).mockResolvedValue({
      data: fakeRepo,
    });

    const result = await createRepositoryTool.handler({
      name: "nuevo-repo",
      description: "un repo de prueba",
      private: false,
    });

    expect(result.ok).toBe(true);
  });

  it("con input inválido, devuelve ok:false sin llamar a Octokit", async () => {
    const result = await createRepositoryTool.handler({
      name: "nombre con espacios",
    });

    expect(result.ok).toBe(false);
    expect(
      octokit.rest.repos.createForAuthenticatedUser,
    ).not.toHaveBeenCalled();
  });
});

describe("createIssueTool (integración)", () => {
  it("con input válido, crea el issue y devuelve ok:true", async () => {
    const fakeIssue = {
      number: 1,
      title: "Bug encontrado",
      html_url: "https://github.com/...",
      state: "open",
    };

    (octokit.rest.issues.create as any).mockResolvedValue({
      data: fakeIssue,
    });

    const result = await createIssueTool.handler({
      owner: "usuario",
      repo: "mi-repo",
      title: "issue",
    });

    expect(result.ok).toBe(true);
  });

  it("con input inválido, devuelve ok:false sin llamar a Octokit", async () => {
    const result = await createIssueTool.handler({
      title: "rep",
    });

    expect(result.ok).toBe(false);
    expect(octokit.rest.issues.create).not.toHaveBeenCalled();
  });
});
