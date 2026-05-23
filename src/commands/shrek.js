import { SlashCommandBuilder } from "discord.js";
import { startShrekScript } from "../utils/wpp-client.js";

const shrekCommand = {
    data: new SlashCommandBuilder()
        .setName("shrek")
        .setDescription("Envia o roteiro completo de Shrek via WhatsApp"),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const { total, estimatedMinutes } = await startShrekScript();
            await interaction.editReply(
                `Shrek iniciado: ${total} mensagens (~${estimatedMinutes} min). Aguarde no WhatsApp.`,
            );
        } catch (error) {
            await interaction.editReply(`Falha ao iniciar Shrek: ${error.message}`);
        }
    },
};

export { shrekCommand };
