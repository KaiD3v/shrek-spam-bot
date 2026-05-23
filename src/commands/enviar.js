import { SlashCommandBuilder } from "discord.js";
import { sendWhatsAppMessage } from "../utils/wpp-client.js";

const enviarCommand = {
    data: new SlashCommandBuilder()
        .setName("enviar")
        .setDescription("Envia uma mensagem via WhatsApp")
        .addStringOption((option) =>
            option
                .setName("mensagem")
                .setDescription("Texto a enviar")
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName("numero")
                .setDescription("Número com DDI, ex: 5511999999999 (opcional)")
                .setRequired(false),
        ),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const message = interaction.options.getString("mensagem");
        const to = interaction.options.getString("numero");

        try {
            await sendWhatsAppMessage({ message, to });
            await interaction.editReply("Mensagem enviada no WhatsApp.");
        } catch (error) {
            await interaction.editReply(`Falha ao enviar: ${error.message}`);
        }
    },
};

export { enviarCommand };
