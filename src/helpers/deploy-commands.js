import { config } from "dotenv";
import { REST, Routes } from "discord.js";
import { DISCORD_TOKEN, GUILD_ID } from "../utils/tokens.js";
import { commands } from "../utils/commands-array.js";

config();

if (!DISCORD_TOKEN) {
    console.error("DISCORD_TOKEN is missing in .env");
    process.exit(1);
}

const commandsToJson = commands.map(command => command.data.toJSON());
const rest = new REST().setToken(DISCORD_TOKEN);

try {
    const { id: clientId } = await rest.get(Routes.oauth2CurrentApplication());

    if (GUILD_ID) {
        if (GUILD_ID === clientId) {
            console.error(
                "GUILD_ID is the same as your bot's Application ID.\n" +
                "Use your Discord server ID instead (right-click the server icon with Developer Mode on → Copy Server ID).\n" +
                "Also make sure the bot has been invited to that server.",
            );
            process.exit(1);
        }

        console.log(`Registering ${commandsToJson.length} guild command(s) for guild ${GUILD_ID}...`);
        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, GUILD_ID),
            { body: commandsToJson },
        );
        console.log(`Registered ${data.length} guild command(s).`);
    } else {
        console.log(`Registering ${commandsToJson.length} global command(s)...`);
        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commandsToJson },
        );
        console.log(`Registered ${data.length} global command(s).`);
    }
} catch (error) {
    console.error(error);
    process.exit(1);
}
