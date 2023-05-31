import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBooleanOption,
  SlashCommandBuilder,
  SlashCommandUserOption,
  User,
} from "discord.js";
import { ChatCommandMetadata } from "../../types/CommandDTO.js";

const data: ChatCommandMetadata = {
  builder: new SlashCommandBuilder()
    .setName("whois")
    .setDescription("Retrieves info about a user.")
    .addUserOption((option: SlashCommandUserOption) => {
      option.setName("user");
      option.setDescription("The user to retrieve information on.");
      option.setRequired(true);
      return option;
    })
    .addBooleanOption((option: SlashCommandBooleanOption) => {
      option.setName("private");
      option.setDescription("Wether the response will only be visible to you.");
      return option;
    }),
  execute: async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply({
      ephemeral: interaction.options.getBoolean("private") ?? false,
    });

    const user: User = interaction.options.getUser("user", true);
    const embed = new EmbedBuilder()
      .setColor(0xeb3371)
      .setTitle(`${user.username} #${user.discriminator}`)
      .setThumbnail(user.avatarURL())
      .addFields([
        { name: "User ID", value: user.id ?? "Not Found" },
        {
          name: "User Creation Date",
          value: user.createdAt.toLocaleDateString() ?? "Not Found",
        },
        {
          name: "Avatar",
          value: user.avatarURL({ size: 4096 }) ?? "Not Found",
        },
        {
          name: "Display Avatar",
          value: user.displayAvatarURL({ size: 4096 }) ?? "Not Found",
        },
        { name: "Banner", value: user.bannerURL() ?? "Not Found" },
      ])
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    return;
  },
};

export default data;
