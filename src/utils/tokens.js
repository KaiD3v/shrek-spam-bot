import { config } from "dotenv";

config();

export const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
export const GUILD_ID = process.env.GUILD_ID;