import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { ChatCommandMetadata } from "../../types/CommandDTO.js";
import { Track, useMasterPlayer } from "discord-player";

const data: ChatCommandMetadata = {
  builder: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Joins the voice channel you are in and plays some tunes.")
    .addStringOption((option) => {
      return option
        .setName("query")
        .setDescription("Accepts song url, playlist url, or song name")
        .setRequired(true);
    }),
  execute: async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply();
    // Guard clauses
    if (!interaction.guild) {
      await interaction.editReply(
        "🛑This command can only be used in a guild."
      );
      return;
    }

    // Get channel the user is currently in
    const channel = interaction.guild.members.cache.get(
      interaction.member?.user.id ?? ""
    )?.voice.channel;

    if (!channel) {
      await interaction.editReply(
        "The Llama doesn't see you in a voice channel right now.👀"
      );
      return;
    }

    // Fetch our player object that was created on client startup
    const player = useMasterPlayer();

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const query = interaction.options.getString("query")!;

    // Search for the user's query
    const result = await player?.search(query, {
      requestedBy: interaction.user,
      searchEngine: `youtubeSearch`,
    });

    if (!result) {
      throw new Error("Nothing was returned from search(query).");
    }

    if (result.tracks.length === 0) {
      await interaction.editReply(
        `❔No results were found for the query \`${query}\``
      );
      return;
    }

    const track: Track = result.tracks[0];
    // Create embed to display once the music starts
    const embed: EmbedBuilder = new EmbedBuilder()
      .setColor(0xeb3371)
      .setAuthor({ name: `${track.author}` })
      .setTitle(track.title)
      .setURL(track.url)
      .setDescription("🎶 Added to Queue")
      .setThumbnail(track.thumbnail)
      .addFields([
        {
          name: "Requested by",
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          value: `<@${interaction.member!.user.id}>`,
          inline: true,
        },
        {
          name: "Duration",
          value: track.duration,
          inline: true,
        },
        {
          name: "Views",
          value: track.views.toLocaleString(),
          inline: true,
        },
      ])
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    await player?.play(channel, result.tracks[0]);
    return;
  },
};

export default data;
