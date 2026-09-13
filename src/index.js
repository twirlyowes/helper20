require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { token, port } = require('./config');

if (!token) throw new Error('DISCORD_TOKEN is missing.');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [Partials.Channel, Partials.Message, Partials.User]
});

client.commands = new Collection();

// Safe Command Loader with Error Catching
function loadCommands(dir) {
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      loadCommands(fullPath);
    } else if (file.endsWith('.js') && !file.startsWith('_')) {
      try {
        const cmd = require(fullPath);
        if (cmd.data?.name) {
          client.commands.set(cmd.data.name, cmd);
        }
      } catch (err) {
        console.error(`❌ Failed to load command at ${fullPath}:`, err.message);
      }
    }
  }
}

// Load commands directory
loadCommands(path.join(__dirname, 'commands'));

// Load command groups
try {
  const groups = require('./commands/groups');
  for (const c of Object.values(groups)) {
    if (c?.data?.name) client.commands.set(c.data.name, c);
  }
} catch (err) {
  console.error('❌ Failed to load command groups:', err.message);
}

// Interaction Handler
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    const msg = { content: '❌ Something went wrong while executing that command.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg).catch(() => {});
    } else {
      await interaction.reply(msg).catch(() => {});
    }
  }
});

// Load Event Handlers
require('./events/ready')(client);
require('./events/messageCreate')(client);
require('./events/prefixCommands')(client);
require('./events/member')(client);
require('./events/logs')(client);
require('./events/antiNuke')(client);

// Express Health Check Server
const app = express();
app.get('/', (_, res) => res.send('Xieron HelpDesk is online.'));
app.get('/health', (_, res) => res.json({ ok: true, uptime: process.uptime() }));
app.listen(port, '0.0.0.0', () => console.log(`Health server running on port ${port}`));

// Global Exception Handler
process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

// Connect to Discord
client.login(token)
  .then(() => console.log('WebSocket Gateway connection established.'))
  .catch(err => console.error('❌ Discord Login Error:', err));
