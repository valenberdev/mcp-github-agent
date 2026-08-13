import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";

dotenv.config();

const token = process.env.GITHUB_TOKEN;

if (!token) {
  console.error("Falta la variable de entorno GITHUB_TOKEN");
  process.exit(1);
}

export const octokit = new Octokit({ auth: token });
