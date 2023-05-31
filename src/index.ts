import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  Guild,
  Interaction,
  REST,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  RESTPutAPIApplicationGuildCommandsResult,
  Routes,
} from "discord.js";
import { ChatCommandDTO, ChatCommandMetadata } from "./types/CommandDTO.js";
import dotenv from "dotenv";
import { logger, MessagePrefixes } from "./logger.js";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { Player } from "discord-player";

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
declare module "discord.js" {
  interface Client {
    commands?: Collection<string, ChatCommandMetadata>;
  }
}

// Setting gateway intents
const intents: GatewayIntentBits[] = [
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildVoiceStates,
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

// Client event handlers

// client.on("error", (error) => {
//   logger.write(error, MessagePrefixes.Failure);
// });
// client.on("debug", (message) => {
//   logger.write(message), MessagePrefixes.Debug;
// });

client.once(Events.ClientReady, (client: Client) => {
  if (client.user === null) {
    logger.write(
      "Something went wrong. The client does not have a username.😱",
      MessagePrefixes.Failure
    );
  } else {
    logger.write(
      `Ready! Logged in as ${client.user.tag}`,
      MessagePrefixes.Success
    );
  }
  // Register slash commands in all currently joined guilds
  if (
    process.env.DISCORD_TOKEN !== undefined &&
    process.env.APP_ID !== undefined &&
    commandsJSON
  ) {
    const rest = new REST().setToken(process.env.DISCORD_TOKEN);

    logger.write(
      `Started refreshing ${commandsJSON.length} slash command(s) in ${client.guilds.cache.size} guilds.`,
      MessagePrefixes.Neutral
    );

    for (const item of client.guilds.cache) {
      const guild: Guild = item[1];

      rest
        .put(Routes.applicationGuildCommands(process.env.APP_ID, guild.id), {
          body: commandsJSON,
        })
        .then((data: unknown) => {
          const commands = data as RESTPutAPIApplicationGuildCommandsResult;
          for (const command of commands) {
            logger.write(
              `'${command.name}' has been loaded | Guild: ${guild.name} | Command Id: ${command.id}`,
              MessagePrefixes.Success
            );
          }
        })
        .catch((error) => {
          logger.write(error, MessagePrefixes.Failure);
        });
    }
  }
});

// Slash command interaction handler
// Locates the correct method to run when receiving a slash command
client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  // Return if it's not a slash command
  if (!interaction.isChatInputCommand()) return;

  // Search for the command through the client
  const command: ChatCommandMetadata | undefined =
    interaction.client.commands?.get(interaction.commandName);

  // Handler for if the command was not found
  if (!command) {
    logger.write(
      "Received an interaction for an unregistered command.",
      MessagePrefixes.Failure
    );
    logger.write(interaction);
    return;
  }

  // Attempt to run the method associated with the command and pass the relevant interaction information
  try {
    await command.execute(interaction);
    logger.write(
      `'${interaction.commandName}' command executed by ${interaction.user.username}.`,
      MessagePrefixes.Success
    );
  } catch (error) {
    logger.write(error, MessagePrefixes.Failure);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "❌There was an error while executing this command.",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "❌There was an error while executing this command.",
        ephemeral: true,
      });
    }
  }
});

// Load slash commands from local directory
// Defining dirname manually because it is not accessible through normal means when a bundler is present
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Getting names of folders in commands directory
const foldersPath: string = path.join(__dirname, "commands");
const folders: string[] = fs
  .readdirSync(foldersPath)
  .filter((file) => !file.endsWith(".js"));

const commandsJSON: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
for (const folder of folders) {
  // Getting names of the commands in each of the subfolders previously enumerated
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath: string = pathToFileURL(
      path.join(commandsPath, file)
    ).toString();

    try {
      const result: ChatCommandDTO = (await import(filePath)) as ChatCommandDTO;
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

// Create audio player and add event listeners
const player = new Player(client, {
  ytdlOptions: { quality: "highestaudio", highWaterMark: 1 << 25 },
});
await player.extractors.loadDefault();

// player.events.on("error", (queue, error) => {
//   logger.write(queue, MessagePrefixes.Failure);
//   logger.write(error, MessagePrefixes.Failure);
// });
// player.events.on("playerError", (queue, error, track) => {
//   logger.write(queue, MessagePrefixes.Failure);
//   logger.write(track, MessagePrefixes.Failure);
//   logger.write(error, MessagePrefixes.Failure);
// });
// player.events.on("debug", (queue, message) => {
//   logger.write(queue, MessagePrefixes.Debug);
//   logger.write(message, MessagePrefixes.Debug);
// });

// Client comes online!
await client.login(process.env.DISCORD_TOKEN);
