import { Collection, Events } from "discord.js";
import { commands } from "../../utils/commands-array.js";
import { replyCommandError } from "../../utils/discord-reply.js";

function setupCommands(client) {
    client.removeAllListeners(Events.InteractionCreate);

    client.once(Events.ClientReady, (readyClient) => {
        console.log(`Logged in as ${readyClient.user.tag}`);
    });

    client.commands = new Collection();

    for (const command of commands) {
        client.commands.set(command.data.name, command);
    }

    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await replyCommandError(interaction);
        }
    });
}

export { setupCommands };
