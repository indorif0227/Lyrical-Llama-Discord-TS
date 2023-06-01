import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { ChatCommandMetadata } from "../../types/CommandDTO.js";

const data: ChatCommandMetadata = {
  builder: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skip past the current track in the queue"),
  execute: async (interaction: ChatInputCommandInteraction) => {
    await interaction.reply(interaction.commandName + "command received.");
    return;
  },
};

export default data;
