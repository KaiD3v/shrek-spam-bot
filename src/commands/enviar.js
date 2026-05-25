import { SlashCommandBuilder } from "discord.js";
import { sendWhatsAppMessage } from "../utils/wpp-client.js";
import { deferEphemeral, editEphemeral } from "../utils/discord-reply.js";

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
        if (!(await deferEphemeral(interaction))) return;

        const message = interaction.options.getString("mensagem");
        const to = interaction.options.getString("numero");

        try {
            await sendWhatsAppMessage({ message, to });
            await editEphemeral(interaction, "Mensagem enviada no WhatsApp.");
        } catch (error) {
            await editEphemeral(interaction, `Falha ao enviar: ${error.message}`);
        }
    },
};

export { enviarCommand };
