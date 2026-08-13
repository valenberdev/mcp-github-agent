import { ListIssuesInput } from "../schemas/index.js";
import { octokit } from "./client.js";

export async function listRepositories(params: {
  type: "all" | "public" | "private";
  sort: "created" | "updated" | "pushed" | "full_name";
  per_page: number;
}) {
  const response = await octokit.rest.repos.listForAuthenticatedUser({
    type: params.type,
    sort: params.sort,
    per_page: params.per_page,
  });
  return response.data;
}

export async function createRepository(params: {
  name: string;
  description?: string;
  private: boolean;
}) {
  const response = await octokit.rest.repos.createForAuthenticatedUser({
    name: params.name,
    description: params.description,
    private: params.private,
  });
  return response.data;
}

export async function createIssue(params: {
    owner: string;
    repo: string;
    title: string;
    body?: string;
}) {
    const response = await octokit.rest.issues.create({
        owner: params.owner,
        repo: params.repo,
        title: params.title,
        body: params.body,
    });
    return response.data;
}

export async function createCommit(params: {
    owner: string;
    repo: string;
    message: string;
    path: string;
    content: string;
}) {
    const response = await octokit.rest.repos.createOrUpdateFileContents({
        owner: params.owner,
        repo: params.repo,
        message: params.message,
        path: params.path,
        content: Buffer.from(params.content, "utf-8").toString("base64"),
    })
    return response.data;
}

export async function listIssues(params:{
    owner: string;
    repo: string;
    state: ListIssuesInput["state"];
    per_page: number;
}) {
    const response = await octokit.rest.issues.listForRepo({
        owner: params.owner,
        repo: params.repo,
        state: params.state,
        per_page: params.per_page,
    })
    return response.data;
}