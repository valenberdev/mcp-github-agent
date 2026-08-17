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

import { listRepositoriesTool } from "../src/tools/list-repositories.js";
import { createCommitTool } from "../src/tools/create-commit.js";
import { listIssuesTool } from "../src/tools/list-issues.js";
import { createRepositoryTool } from "../src/tools/create-repository.js";
import { createIssueTool } from "../src/tools/create-issue.js";
import { octokit } from "../src/github/client.js";

describe("createRepositoryTool (integración)", () => {
  it("con input válido, crea el repo y devuelve ok:true", async () => {
    const fakeRepo = {
      full_name: "usuario/nuevo-repo",
      html_url: "https://github.com/usuario/nuevo-repo",
      private: false,
      description: null,
      owner: { login: "usuario" },
    };

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

describe("listRepositoriesTool (integración)", () => {
  it("con input válido, lista los repos y devuelve ok:true", async () => {
    const fakeRepos = [
  {
    full_name: "usuario/repo1",
    html_url: "https://github.com/usuario/nuevo-repo",
    private: false,
    description: null,
    owner: { login: "usuario" },
  },
];

    (octokit.rest.repos.listForAuthenticatedUser as any).mockResolvedValue({
      data: fakeRepos,
    });

    const result = await listRepositoriesTool.handler({
      type: "all",
      sort: "updated",
      per_page: 30,
    });

    expect(result.ok).toBe(true);
  });

  it("con input inválido, devuelve ok:false sin llamar a Octokit", async () => {
    const result = await listRepositoriesTool.handler({
      type: "resume",
    });

    expect(result.ok).toBe(false);
    expect(octokit.rest.repos.listForAuthenticatedUser).not.toHaveBeenCalled();
  });
});

describe("createCommitTool (integración)", () => {
  it("con input válido, crea el commit y devuelve ok:true", async () => {
    const fakeCommitResponse = {
      commit: { sha: "abc123", html_url: "https://github.com/..." },
    };

    (octokit.rest.repos.createOrUpdateFileContents as any).mockResolvedValue({
      data: fakeCommitResponse,
    });

    const result = await createCommitTool.handler({
      owner: "usuario",
      repo: "mi-repo",
      path: "README.md",
      content: "contenido",
      message: "mensaje",
    });

    expect(result.ok).toBe(true);
  });

  it("con input inválido, devuelve ok:false sin llamar a Octokit", async () => {
    const result = await createCommitTool.handler({
      message: "jh",
    });

    expect(result.ok).toBe(false);
    expect(
      octokit.rest.repos.createOrUpdateFileContents,
    ).not.toHaveBeenCalled();
  });
});

describe("listIssuesTool (integración)", () => {
  it("con input válido, lista los issues y devuelve ok:true", async () => {
    const fakeIssues = [
      {
        number: 1,
        title: "Bug 1",
        html_url: "https://github.com/...",
        state: "open",
      },
    ];

    (octokit.rest.issues.listForRepo as any).mockResolvedValue({
      data: fakeIssues,
    });

    const result = await listIssuesTool.handler({
      owner: "usuario",
      repo: "mi-repo",
      state: "open",
      per_page: 30,
    });

    expect(result.ok).toBe(true);
  });

  it("con input inválido, devuelve ok:false sin llamar a Octokit", async () => {
    const result = await listIssuesTool.handler({
      state: "resume",
    });

    expect(result.ok).toBe(false);
    expect(octokit.rest.issues.listForRepo).not.toHaveBeenCalled();
  });
});
