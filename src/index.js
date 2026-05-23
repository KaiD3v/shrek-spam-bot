import { Client, GatewayIntentBits } from "discord.js";
import { setupCommands } from "./helpers/commands/setup-commands.js";
import { DISCORD_TOKEN } from "./utils/tokens.js";

export const client = new Client({ intents: [GatewayIntentBits.Guilds] });

setupCommands(client);

client.login(DISCORD_TOKEN);