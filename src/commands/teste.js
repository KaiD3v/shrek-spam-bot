import { SlashCommandBuilder } from "discord.js";

const testeCommand = {
    data: new SlashCommandBuilder().setName("teste").setDescription("Replies with Teste!"),
    async execute(interaction) {
        await interaction.reply("testado!");
    }
};

export { testeCommand };