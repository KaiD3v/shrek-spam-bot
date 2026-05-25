import { MessageFlags } from "discord.js";

const EPHEMERAL = MessageFlags.Ephemeral;

export async function deferEphemeral(interaction) {
    if (interaction.deferred || interaction.replied) {
        return true;
    }

    try {
        await interaction.deferReply({ flags: EPHEMERAL });
        return true;
    } catch (error) {
        if (error.code === 40060) {
            console.warn("Interacao ja respondida (outra instancia do bot?)");
            return false;
        }
        throw error;
    }
}

export async function editEphemeral(interaction, content) {
    if (!interaction.deferred && !interaction.replied) {
        await interaction.reply({ content, flags: EPHEMERAL });
        return;
    }

    try {
        await interaction.editReply({ content });
    } catch (error) {
        if (error.code === 40060 || error.code === 10008) {
            return;
        }
        throw error;
    }
}

export async function replyCommandError(interaction, message = "There was an error while executing this command!") {
    try {
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ content: message });
        } else {
            await interaction.reply({ content: message, flags: EPHEMERAL });
        }
    } catch (error) {
        if (error.code === 40060 || error.code === 10008) {
            return;
        }

        try {
            await interaction.followUp({ content: message, flags: EPHEMERAL });
        } catch {
            console.error("Nao foi possivel responder a interacao:", error.message);
        }
    }
}
