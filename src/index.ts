import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  Interaction,
  REST,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  Routes,
} from 'discord.js';
import { CommandDTO, CommandMetadata } from './types/CommandDTO.js';
import dotenv from 'dotenv';
import { logger, MessagePrefixes } from './logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

dotenv.config();

// Guard Clauses
if (!process.env.DISCORD_TOKEN) {
  throw new Error(
    `The "DISCORD_TOKEN" variable is not defined in the .env file.`
  );
}
if (!process.env.APP_ID) {
  throw new Error(`The "APP_ID" variable is not defined in the .env file.`);
}
if (!process.env.GUILD_ID) {
  throw new Error(`The "GUILD_ID" variable is not defined in the .env file.`);
}

// Augmenting the Client type so that it is able to store a commands array as a property
declare module 'discord.js' {
  interface Client {
    commands?: Collection<string, CommandMetadata>;
  }
}

// Setting gateway intents
const intents: GatewayIntentBits[] = [
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.Guilds,
  GatewayIntentBits.MessageContent,
];

// Augmenting the type for this client so we can add an array to store slash commands
// This will allow us to access all our slash commands from any of the SlashCommandBuilder files
const client: Client = new Client({ intents });

client.commands = new Collection();

logger.write(
  `Gateway Intents: ${intents
    .map((intent) => {
      return GatewayIntentBits[intent];
    })
    .toString()}`,
  MessagePrefixes.Success
);

// Event Handlers
client.once(Events.ClientReady, (client: Client) => {
  if (client.user === null) {
    logger.write(
      'Something went wrong. The client does not have a username😱',
      MessagePrefixes.Failure
    );
  } else {
    logger.write(
      `Ready! Logged in as ${client.user.tag}`,
      MessagePrefixes.Success
    );
  }
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command: CommandMetadata | undefined = interaction.client.commands?.get(
    interaction.commandName
  );

  if (command === undefined) {
    logger.write(
      'Received an interaction for an unregistered command',
      MessagePrefixes.Failure
    );
    logger.write(interaction);
    return;
  }

  try {
    await command.action(interaction);
    logger.write(
      `'${interaction.commandName}' command executed by ${interaction.user.username}.`,
      MessagePrefixes.Success
    );
    logger.write(interaction.options);
  } catch (error) {
    logger.write(error, MessagePrefixes.Failure);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: 'There was an error while executing this command!',
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: 'There was an error while executing this command!',
        ephemeral: true,
      });
    }
  }
});

// Load slash commands from local directory
// Defining dirname manually because it is not accessible through normal means when a bundler is present
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Getting names of folders in commands directory
const foldersPath: string = path.join(__dirname, 'commands');
const commandsJSON: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
const folders: string[] = fs
  .readdirSync(foldersPath)
  .filter((file) => !file.endsWith('.js'));

for (const folder of folders) {
  // Getting names of the commands in each of the subfolders previously enumerated
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath: string = pathToFileURL(
      path.join(commandsPath, file)
    ).toString();

    try {
      const result: CommandDTO = (await import(filePath)) as CommandDTO;
      client.commands?.set(result.default.builder.name, result.default);
      // Save json versions of CommandBuilders for registration in a later step
      commandsJSON.push(result.default.builder.toJSON());

      logger.write(
        `Command '${result.default.builder.name}' has been found!`,
        MessagePrefixes.Success
      );
    } catch (error) {
      logger.write(error, MessagePrefixes.Failure);
    }
  }
}

// Register slash commands with all currently joined guilds
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

try {
  logger.write(
    `Started refreshing ${commandsJSON.length} slash command(s).`,
    MessagePrefixes.Neutral
  );

  const data = await rest.put(
    Routes.applicationGuildCommands(process.env.APP_ID, process.env.GUILD_ID),
    { body: commandsJSON }
  );

  logger.write(data, MessagePrefixes.Success);
} catch (error) {
  logger.write(error, MessagePrefixes.Failure);
}

// Client comes online!
await client.login(process.env.DISCORD_TOKEN);
