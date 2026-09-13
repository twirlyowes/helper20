require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { token, port } = require('./config');

if (!token) {
  throw new Error('DISCORD_TOKEN is missing in configuration/environment.');
}

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

// Safe recursive command loader
function loadCommands(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  for (const file of fs.readdirSync(dirPath)) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      loadCommands(fullPath);
    } else if (file.endsWith('.js') && !file.startsWith('_')) {
      try {
        const cmd = require(fullPath);
        if (cmd?.data?.name) {
          client.commands.set(cmd.data.name, cmd);
        }
      } catch (err) {
        console.error(`❌ Failed to load command at ${fullPath}:`, err.message);
      }
    }
  }
}

// Load commands and command groups safely
loadCommands(path.join(__dirname, 'commands'));

try {
  const groups = require('./commands/groups');
  for (const c of Object.values(groups)) {
    if (c?.data?.name) client.commands.set(c.data.name, c);
  }
} catch (err) {
  console.error('❌ Failed to load command groups:', err.message);
}

// Handle Slash Command Interactions
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}:`, error);
    const msg = { content: '❌ Something went wrong while executing that command.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg).catch(() => {});
    } else {
      await interaction.reply(msg).catch(() => {});
    }
  }
});

// Load Event Listeners
require('./events/ready')(client);
require('./events/messageCreate')(client);
require('./events/prefixCommands')(client);
require('./events/member')(client);
require('./events/logs')(client);
require('./events/antiNuke')(client);

// Express Web Server for Render Port Binding
const app = express();
app.get('/', (_, res) => res.send('Xieron HelpDesk is online.'));
app.get('/health', (_, res) => res.json({ ok: true, uptime: process.uptime() }));
app.listen(port, '0.0.0.0', () => console.log(`Health server running on port ${port}`));

// Global Exception Handler
process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

// Single Discord Gateway Connection
console.log('Connecting to Discord Gateway...');
client.login(token)
  .then(() => console.log('✅ WebSocket Gateway connection established.'))
  .catch(err => console.error('❌ Discord Login Error:', err));
// Global Exception Handler
process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

// Debug Environment Variable Token Presence
console.log(`Token present: ${!!token} (Length: ${token ? token.length : 0})`);
console.log('Connecting to Discord Gateway...');

const loginTimeout = setTimeout(() => {
  console.error('❌ Discord connection timed out after 10 seconds. Check if DISCORD_TOKEN is valid.');
}, 10000);

client.login(token)
  .then(() => {
    clearTimeout(loginTimeout);
    console.log('✅ WebSocket Gateway connection established.');
  })
  .catch(err => {
    clearTimeout(loginTimeout);
    console.error('❌ Discord Login Error:', err);
  });
