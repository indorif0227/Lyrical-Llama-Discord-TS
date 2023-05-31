import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  SlashCommandStringOption,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import { ChatCommandMetadata } from "../../types/CommandDTO.js";
import { logger } from "../../logger.js";
import { useMasterPlayer } from "discord-player";

const data: ChatCommandMetadata = {
  builder: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Joins the voice channel you are in and plays some tunes.")
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) => {
      return subcommand
        .setName("search")
        .setDescription("Search for a song by keyword.")
        .addStringOption((option: SlashCommandStringOption) => {
          return option
            .setName("query")
            .setDescription("Keywords to search for.")
            .setRequired(true);
        });
    })
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) => {
      return subcommand
        .setName("playlist")
        .setDescription("Plays an entire playlist of songs from a url.")
        .addStringOption((option: SlashCommandStringOption) => {
          return option
            .setName("url")
            .setDescription("The url of the playlist you want to play.")
            .setRequired(true);
        });
    })
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) => {
      return subcommand
        .setName("song")
        .setDescription("Plays a song from a url.")
        .addStringOption((option: SlashCommandStringOption) => {
          return option
            .setName("url")
            .setDescription("The url of the song you want to play.")
            .setRequired(true);
        });
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

    // Handle the song request appropriately based on the subcommand used
    const subcommand: string = interaction.options.getSubcommand();

    const query =
      interaction.options.getString(
        subcommand === "search" ? "query" : "url"
      ) ?? "";

    // Search for the user's query
    const result = await player?.search(query, {
      requestedBy: interaction.user,
      ignoreCache: true,
      searchEngine: "AUTO_SEARCH",
    });

    logger.write(result?.toJSON());

    if (!result) {
      throw new Error("Nothing was returned from search(query).");
    }

    if (result.tracks.length === 0) {
      await interaction.editReply(
        `❔No results were found for the ${subcommand}`
      );
      return;
    }

    // Create embed to display once the music starts
    const embed: EmbedBuilder = new EmbedBuilder()
      .setColor(0xeb3371)
      .setTitle(`▶ Now Playing - [${result.tracks[0].title}]`)
      .setThumbnail(result.tracks[0].thumbnail)
      .addFields([{ name: "Description", value: result.tracks[0].description }])
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    await player?.play(channel, result);
    return;
  },
};

export default data;
