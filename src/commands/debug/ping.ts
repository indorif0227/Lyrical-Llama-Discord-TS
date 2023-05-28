import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { ChatCommandMetadata } from '../../types/CommandDTO.js';

const data: ChatCommandMetadata = {
  builder: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Ping the bot to see if it is awake.'),
  action: async (interaction: ChatInputCommandInteraction) => {
    await interaction.reply('Pong!');
    return;
  },
};

export default data;
