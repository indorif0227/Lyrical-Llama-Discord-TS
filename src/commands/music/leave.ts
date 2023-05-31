import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { ChatCommandMetadata } from "../../types/CommandDTO.js";

const data: ChatCommandMetadata = {
  builder: new SlashCommandBuilder()
    .setName("leave")
    .setDescription("Shoos the Llama from any channels he is currently in."),
  execute: async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply();
    if (!interaction.guild) {
      await interaction.editReply(
        "🛑This command can only be used in a guild."
      );
      return;
    }

    // const client = interaction.client;

    await interaction.editReply("The Llama has left the venue.🦙💨");
    return;
  },
};

export default data;
