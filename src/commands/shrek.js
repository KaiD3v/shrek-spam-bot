import { SlashCommandBuilder } from "discord.js";
import { startShrekScript } from "../utils/wpp-client.js";
import { deferEphemeral, editEphemeral } from "../utils/discord-reply.js";

const shrekCommand = {
    data: new SlashCommandBuilder()
        .setName("shrek")
        .setDescription("Envia o roteiro completo de Shrek via WhatsApp"),
    async execute(interaction) {
        if (!(await deferEphemeral(interaction))) return;

        try {
            const { total, estimatedMinutes } = await startShrekScript();
            await editEphemeral(
                interaction,
                `Shrek iniciado: ${total} mensagens (~${estimatedMinutes} min). Aguarde no WhatsApp.`,
            );
        } catch (error) {
            await editEphemeral(interaction, `Falha ao iniciar Shrek: ${error.message}`);
        }
    },
};

export { shrekCommand };
