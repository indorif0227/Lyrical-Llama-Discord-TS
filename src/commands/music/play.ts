import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandStringOption,
} from "discord.js";
import { ChatCommandMetadata } from "../../types/CommandDTO.js";
import {
  createAudioResource,
  createAudioPlayer,
  NoSubscriberBehavior,
  getVoiceConnection,
} from "@discordjs/voice";
import ytdl from "ytdl-core";

const data: ChatCommandMetadata = {
  builder: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Searches for and plays the requested song from YouTube.")
    .addStringOption((option: SlashCommandStringOption) => {
      option.setName("url");
      option.setDescription("The url of the YouTube audio you want to play.");
      option.setRequired(true);
      return option;
    }),
  action: async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply();
    if (!interaction.guild) {
      await interaction.editReply(
        "🛑This command can only be used in a guild."
      );
      return;
    }
    if (interaction.client.voice.adapters.size === 0) {
      await interaction.editReply(
        "Llama is not currently in a voice channel, so no one will be able to hear the music.😢"
      );
      return;
    } else {
      const url: string = interaction.options.getString("url", true);

      if (!ytdl.validateURL(url)) {
        await interaction.editReply(
          "Llama found that url kinda sus.🤔 Try again with a valid one."
        );
        return;
      }

      const stream = ytdl(url, { filter: "audioonly" });
      // const metadata = await ytdl.getInfo(url);

      const client = interaction.client;
      const connection = getVoiceConnection(interaction.guild.id);

      if (!client.queue) {
        client.queue = [];
      }
      if (!connection) {
        await interaction.editReply(
          "You can teach a Llama to be a DJ, but you have to lead it to the venue first.💿 (trans. use the join command to add the Llama to a voice channel first)"
        );
        return;
      }

      client.queue.push(createAudioResource(stream));
      client.player = createAudioPlayer({
        behaviors: { noSubscriber: NoSubscriberBehavior.Play },
      });
      connection.subscribe(client.player);
      client.player.play(client.queue.splice(0, 1)[0]);
      await interaction.editReply(`▶ Now Playing - [Song title here]`);
      return;
    }
  },
};

export default data;
