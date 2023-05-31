import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  SlashCommandStringOption,
} from "discord.js";
import { ChatCommandMetadata } from "../../types/CommandDTO.js";
import { SearchOptions, Track, useMasterPlayer } from "discord-player";

const data: ChatCommandMetadata = {
  builder: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Joins the voice channel you are in and plays some tunes.")
    .addStringOption((option: SlashCommandStringOption) => {
      return option
        .setName("query")
        .setDescription("Accepts song url, playlist url, or song name")
        .setRequired(true);
    })
    .addStringOption((option: SlashCommandStringOption) => {
      return option
        .setName("service")
        .setDescription(
          "Select which service you want to query the audio from. (Defaults to YouTube if not set)"
        )
        .setChoices(
          { name: "YouTube", value: "YouTube" },
          { name: "Spotify", value: "Spotify" },
          { name: "Apple Music", value: "Apple Music" },
          { name: "SoundCloud", value: "Sound Cloud" }
        );
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

    console.log();

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

    let searchEngine: SearchOptions["searchEngine"] = "youtubeSearch";

    switch (interaction.options.getString("service")) {
      case "YouTube":
        searchEngine = "youtubeSearch";
        break;
      case "Spotify":
        searchEngine = "spotifySearch";
        break;
      case "Apple Music":
        searchEngine = "appleMusicSearch";
        break;
      case "SoundCloud":
        searchEngine = "soundcloudSearch";
        break;
    }

    // Search for the user's query
    const result = await player?.search(query, {
      requestedBy: interaction.user,
      searchEngine: searchEngine,
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
