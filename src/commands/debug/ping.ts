import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { ChatCommandMetadata } from "../../types/CommandDTO.js";

const data: ChatCommandMetadata = {
  builder: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Ping to see if the Llama is awake."),
  action: async (interaction: ChatInputCommandInteraction) => {
    await interaction.reply("Pong!🏓");
    return;
  },
};

export default data;
