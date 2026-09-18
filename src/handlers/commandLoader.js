const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');
const logger = require('../utils/logger');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files = files.concat(walk(full));
    else if (entry.name.endsWith('.js')) files.push(full);
  }
  return files;
}

/**
 * A command file may export either a single command object ({ data, execute, ... })
 * or an array of command objects, so multiple related commands can share one file
 * (e.g. whitelist/unwhitelist/whitelisted/whitelistreset all live in whitelist.js).
 */
function normalizeExport(exported) {
  return Array.isArray(exported) ? exported : [exported];
}

function loadCommands(client) {
  client.commands = new Collection();
  const commandsDir = path.join(__dirname, '..', 'commands');
  const files = walk(commandsDir);

  for (const file of files) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const exported = require(file);
    for (const command of normalizeExport(exported)) {
      if (!command?.data?.name || typeof command.execute !== 'function') {
        logger.warn(`[commandLoader] Skipping invalid command export in: ${file}`);
        continue;
      }
      client.commands.set(command.data.name, command);
    }
  }

  logger.info(`[commandLoader] Loaded ${client.commands.size} commands.`);
  return client.commands;
}

function getAllCommandJSON() {
  const commandsDir = path.join(__dirname, '..', 'commands');
  const files = walk(commandsDir);
  const json = [];
  for (const file of files) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const exported = require(file);
    for (const command of normalizeExport(exported)) {
      if (command?.data?.toJSON) json.push(command.data.toJSON());
    }
  }
  return json;
}

module.exports = { loadCommands, getAllCommandJSON, walk };
