import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export type ChatCommandMetadata = {
  builder: Omit<
    SlashCommandBuilder,
    | "addBooleanOption"
    | "addUserOption"
    | "addChannelOption"
    | "addRoleOption"
    | "addAttachmentOption"
    | "addMentionableOption"
    | "addStringOption"
    | "addIntegerOption"
    | "addNumberOption"
    | "addSubcommandGroup"
    | "addSubcommand"
  >;
  action: (interaction: ChatInputCommandInteraction) => Promise<void>;
};

export type ChatCommandDTO = {
  default: ChatCommandMetadata;
};
