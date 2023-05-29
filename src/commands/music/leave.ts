import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { ChatCommandMetadata } from "../../types/CommandDTO.js";

const data: ChatCommandMetadata = {
  builder: new SlashCommandBuilder()
    .setName("leave")
    .setDescription("Shoos the Llama from any channels he is currently in."),
  action: async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply();
    const client = interaction.client;
    if (client.voiceConnection) {
      client.player?.pause();
      client.voiceConnection.destroy();
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
