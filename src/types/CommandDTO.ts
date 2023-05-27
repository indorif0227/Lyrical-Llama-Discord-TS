import { CommandInteraction, SlashCommandBuilder } from 'discord.js';

export type CommandMetadata = {
  builder: SlashCommandBuilder;
  action: (interaction: CommandInteraction) => Promise<void>;
};

export type CommandDTO = {
  default: CommandMetadata;
};
