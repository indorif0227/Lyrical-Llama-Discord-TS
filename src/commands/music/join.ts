import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { ChatCommandMetadata } from "../../types/CommandDTO.js";

const data: ChatCommandMetadata = {
  builder: new SlashCommandBuilder()
    .setName("join")
    .setDescription("Make the bot join the user's voice channel."),
  action: async (interaction: ChatInputCommandInteraction) => {
    await interaction.reply("join command received!");
    return;
  },
};

export default data;
