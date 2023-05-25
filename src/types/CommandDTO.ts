import { SlashCommandBuilder } from 'discord.js';

export type CommandMetadata = {
	builder: SlashCommandBuilder;
	action: Function;
};

export type CommandDTO = {
	default: CommandMetadata;
};
