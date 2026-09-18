const { REST, Routes } = require('discord.js');
const env = require('../src/config/env');
const { getAllCommandJSON } = require('../src/handlers/commandLoader');
const logger = require('../src/utils/logger');

async function main() {
  const commands = getAllCommandJSON();
  const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);

  try {
    logger.info(`[deploy] Registering ${commands.length} commands...`);

    if (env.GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(env.CLIENT_ID, env.GUILD_ID), { body: commands });
      logger.info(`[deploy] Registered ${commands.length} commands to guild ${env.GUILD_ID} (instant).`);
    } else {
      await rest.put(Routes.applicationCommands(env.CLIENT_ID), { body: commands });
      logger.info(`[deploy] Registered ${commands.length} commands globally (may take up to 1 hour to propagate).`);
    }
  } catch (err) {
    logger.error('[deploy] Failed to register commands:', err);
    process.exit(1);
  }
}

main();
