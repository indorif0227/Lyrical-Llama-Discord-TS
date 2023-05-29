import {
  ChannelType,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandChannelOption,
} from "discord.js";
import { ChatCommandMetadata } from "../../types/CommandDTO.js";
import { joinVoiceChannel } from "@discordjs/voice";

const data: ChatCommandMetadata = {
  builder: new SlashCommandBuilder()
    .setName("join")
    .setDescription("Tell the Llama to join a specified voice channel.")
    .addChannelOption((option: SlashCommandChannelOption) => {
      option.setName("channel");
      option.setDescription("The voice channel to join.");
      option.addChannelTypes(
        ChannelType.GuildVoice,
        ChannelType.GuildStageVoice
      );
      option.setRequired(true);
      return option;
    }),
  action: async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply();

    const channel = interaction.options.getChannel("channel", true);

    if (interaction.guild) {
      interaction.client.voiceConnection = joinVoiceChannel({
        channelId: channel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });

      await interaction.editReply("It's Llama time!🎺🦙🎷");
    } else {
      await interaction.editReply("This slash command only works in guilds.🤷‍♂️");
      return;
    }
  },
};

export default data;
