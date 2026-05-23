import { config } from "dotenv";

config();

export const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
export const GUILD_ID = process.env.GUILD_ID;
export const WPP_API_URL = process.env.WPP_API_URL ?? "http://localhost:3001";
export const WPP_API_SECRET = process.env.WPP_API_SECRET;
export const WHATSAPP_TARGET = process.env.WHATSAPP_TARGET;
export const SHREK_DELAY_MS = Number(process.env.SHREK_DELAY_MS ?? 250);