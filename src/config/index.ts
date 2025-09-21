import dotenv from "dotenv";
import { isGithubActionsEnv } from "../utils";

dotenv.config();

export const config = {
  walletAddress: process.env["WALLET_ADDRESS"] || "",
  positionId: process.env["POSITION_ID"],
  scheduleTime: process.env["SCHEDULE_TIME"] || "09:00",
  dataFilePath: process.env["DATA_FILE_PATH"] || "./data/positions.json",
  graphApiKey: process.env["GRAPH_API_KEY"] || "",
  discordWebhookUrl: process.env["DISCORD_WEBHOOK_URL"] || ""
};

export function validateConfig(): void {
  // Skip validation in GitHub Actions since it only needs Supabase credentials
  if (isGithubActionsEnv) return;

  if (!config.walletAddress && !config.positionId) {
    throw new Error("Either WALLET_ADDRESS or POSITION_ID must be provided in .env file");
  }
}
