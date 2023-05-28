import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export type ChatCommandMetadata = {
  builder: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  action: (interaction: ChatInputCommandInteraction) => Promise<void>;
};

export type ChatCommandDTO = {
  default: ChatCommandMetadata;
};
