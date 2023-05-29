import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { ChatCommandMetadata } from "../../types/CommandDTO.js";
import { getVoiceConnection } from "@discordjs/voice";

const data: ChatCommandMetadata = {
  builder: new SlashCommandBuilder()
    .setName("leave")
    .setDescription("Shoos the Llama from any channels he is currently in."),
  action: async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply();
    if (!interaction.guild) {
      await interaction.editReply(
        "🛑This command can only be used in a guild."
      );
      return;
    }

    const client = interaction.client;
    const connection = getVoiceConnection(interaction.guild?.id);
    if (connection) {
      client.player?.pause();
      connection.destroy();
      await interaction.editReply("The Llama has left the venue.🦙💨");
    } else {
      await interaction.editReply(
        "The Llama is not currently in any voice channels.💤"
      );
    }
    return;
  },
};

export default data;
