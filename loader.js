const { readdirSync } = require("fs");
const { Collection } = require("discord.js");
const { useMainPlayer } = require("discord-player");
client.commands = new Collection();
const commandsArray = [];
const player = useMainPlayer();

const { Translate, GetTranslationModule } = require("./process_tools");

const discordEvents = readdirSync("./events/Discord/").filter((file) =>
  file.endsWith(".js")
);
const playerEvents = readdirSync("./events/Player/").filter((file) =>
  file.endsWith(".js")
);

GetTranslationModule().then(() => {
  // Load Discord Events
  let discordEventCount = 0;
  for (const file of discordEvents) {
    const DiscordEvent = require(`./events/Discord/${file}`);
    client.on(file.split(".")[0], DiscordEvent.bind(null, client));
    delete require.cache[require.resolve(`./events/Discord/${file}`)];
    discordEventCount++;
  }
  console.log(`📡 Discord Events: ${discordEventCount} loaded`);

  // Load Player Events
  let playerEventCount = 0;
  for (const file of playerEvents) {
    const PlayerEvent = require(`./events/Player/${file}`);
    player.events.on(file.split(".")[0], PlayerEvent.bind(null));
    delete require.cache[require.resolve(`./events/Player/${file}`)];
    playerEventCount++;
  }
  console.log(`🎵 Player Events: ${playerEventCount} loaded`);
  
  // Load Commands
  let commandCount = 0;
  let failedCommands = 0;
  readdirSync("./commands/").forEach((dirs) => {
    const commands = readdirSync(`./commands/${dirs}`).filter((files) =>
      files.endsWith(".js")
    );
    
    for (const file of commands) {
      const command = require(`./commands/${dirs}/${file}`);
      if (command.name && command.description) {
        commandsArray.push(command);
        client.commands.set(command.name.toLowerCase(), command);
        delete require.cache[require.resolve(`./commands/${dirs}/${file}`)];
        commandCount++;
      } else {
        failedCommands++;
        console.log(`❌ Failed: ${file} - Missing name or description`);
      }
    }
  });
  
  console.log(`⚡ Commands: ${commandCount} loaded${failedCommands > 0 ? ` (${failedCommands} failed)` : ''}`);
  
  // Load Boo Integration
  try {
    const BooIntegration = require('./boo');
    global.booBot = new BooIntegration(client);
    console.log('🎭 Boo: Ready');
  } catch (error) {
    console.log('⚠️ Boo: failed to load');
    console.error(error.message);
  }
  
  console.log("-----------------------------------------");
  console.log("🚀 Bot is ready to work!");
  console.log("-----------------------------------------");

  client.once("clientReady", (client) => {
    if (client.config.app.global)
      client.application.commands.set(commandsArray);
    else
      client.guilds.cache
        .get(client.config.app.guild)
        .commands.set(commandsArray);
  });
});