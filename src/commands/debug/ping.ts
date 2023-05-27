import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import { CommandMetadata } from '../../types/CommandDTO.js';

const data: CommandMetadata = {
  builder: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Ping the bot to see if it is awake.'),
  action: async (interaction: CommandInteraction) => {
    await interaction.reply('Pong!');
    return;
  },
};

export default data;
