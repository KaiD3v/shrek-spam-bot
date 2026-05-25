import { Client, GatewayIntentBits } from "discord.js";
import { setupCommands } from "./helpers/commands/setup-commands.js";
import { DISCORD_TOKEN } from "./utils/tokens.js";

export const client = new Client({ intents: [GatewayIntentBits.Guilds] });

setupCommands(client);

client.on("error", (error) => {
    console.error("Discord client error:", error);
});

client.login(DISCORD_TOKEN);