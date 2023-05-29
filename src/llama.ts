import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  Guild,
  Interaction,
  REST,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  Routes,
} from "discord.js";
import { ChatCommandDTO, ChatCommandMetadata } from "./types/CommandDTO.js";
import dotenv from "dotenv";
import { logger, MessagePrefixes } from "./logger.js";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { AudioResource } from "@discordjs/voice";
import { AudioPlayer } from "@discordjs/voice";

// Augmenting the Client type so that it is able to store a commands array as a property
declare module "discord.js" {
  interface Client {
    commands?: Collection<string, ChatCommandMetadata>;
    commandsJSON?: RESTPostAPIChatInputApplicationCommandsJSONBody[];
    player?: AudioPlayer;
    queue?: AudioResource[];
  }
}

function createClient(): Client {
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

  return client;
}

function registerEventHandlers(client: Client): Client {
  // Event Handlers
  client.once(Events.ClientReady, (client: Client) => {
    if (client.user === null) {
      logger.write(
        "Something went wrong. The client does not have a username😱",
        MessagePrefixes.Failure
      );
    } else {
      logger.write(
        `Ready! Logged in as ${client.user.tag}`,
        MessagePrefixes.Success
      );
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
    if (command === undefined) {
      logger.write(
        "Received an interaction for an unregistered command",
        MessagePrefixes.Failure
      );
      logger.write(interaction);
      return;
    }

    // Attempt to run the method associated with the command and pass the relevant interaction information
    try {
      await command.action(interaction);
      logger.write(
        `'${interaction.commandName}' command executed by ${interaction.user.username}.`,
        MessagePrefixes.Success
      );
      // logger.write(interaction);
    } catch (error) {
      logger.write(error, MessagePrefixes.Failure);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      }
    }
  });
  return client;
}

async function loadSlashCommands(client: Client): Promise<Client> {
  // Load slash commands from local directory
  // Defining dirname manually because it is not accessible through normal means when a bundler is present
  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  // Getting names of folders in commands directory
  const foldersPath: string = path.join(__dirname, "commands");
  const folders: string[] = fs
    .readdirSync(foldersPath)
    .filter((file) => !file.endsWith(".js"));

  client.commandsJSON = [];
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
        const result: ChatCommandDTO = (await import(
          filePath
        )) as ChatCommandDTO;
        client.commands?.set(result.default.builder.name, result.default);
        // Save json versions of CommandBuilders for registration in a later step

        client.commandsJSON.push(result.default.builder.toJSON());

        logger.write(
          `Command '${result.default.builder.name}' has been found!`,
          MessagePrefixes.Success
        );
      } catch (error) {
        logger.write(error, MessagePrefixes.Failure);
      }
    }
  }
  return client;
}

async function registerSlashCommands(
  client: Client,
  token: string,
  appId: string
): Promise<Client<boolean>> {
  // Register slash commands with all currently joined guilds
  const rest = new REST().setToken(token);
  try {
    if (!client.commandsJSON) {
      client.commandsJSON = [];
    }

    logger.write(
      `Started refreshing ${client.commandsJSON.length} slash command(s) in ${client.guilds.cache.size} guilds.`,
      MessagePrefixes.Neutral
    );

    for (const item of client.guilds.cache) {
      const name: string = item[0];
      const guild: Guild = item[1];

      logger.write(name, MessagePrefixes.Neutral);

      const data = await rest.put(
        Routes.applicationGuildCommands(appId, guild.id),
        { body: client.commandsJSON }
      );

      logger.write(data, MessagePrefixes.Success);
    }
  } catch (error) {
    logger.write(error, MessagePrefixes.Failure);
  }
  return client;
}

async function clientFactory() {
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

  let client = createClient();
  client = registerEventHandlers(client);
  client = await loadSlashCommands(client);
  // Client comes online!
  await client.login(process.env.DISCORD_TOKEN);
  client = await registerSlashCommands(
    client,
    process.env.DISCORD_TOKEN,
    process.env.APP_ID
  );
}

await clientFactory();
