import { SlashCommandBuilder } from "discord.js";

const penisCommand = {
    data: new SlashCommandBuilder().setName("penis").setDescription("Replies with xavasca!"),
    async execute(interaction) {
        await interaction.reply("xavasca!");
    }
};

export { penisCommand };