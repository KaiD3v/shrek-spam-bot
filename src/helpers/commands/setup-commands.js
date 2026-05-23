import { Collection, Events } from "discord.js";
import { commands } from "../../utils/commands-array.js";

function setupCommands(client) {
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
            const content = "There was an error while executing this command!";
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content, ephemeral: true });
            } else {
                await interaction.reply({ content, ephemeral: true });
            }
        }
    });
}

export { setupCommands };