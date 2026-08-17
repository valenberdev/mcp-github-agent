import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";
import { logger } from "../utils/logging.js";

dotenv.config();

const token = process.env.GITHUB_TOKEN;

if (!token) {
  logger.error("Falta la variable de entorno GITHUB_TOKEN");
  process.exit(1);
}

export const octokit = new Octokit({
  auth: token,
  request: {
    timeout: 10000,
  },
});