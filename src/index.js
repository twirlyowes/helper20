require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { token, port } = require('./config');

if (!token) {
  throw new Error('DISCORD_TOKEN environment variable is missing.');
}

// Initialize Client with custom WebSocket options to prevent hosting connection hangs
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [Partials.Channel, Partials.Message, Partials.User],
  ws: {
    large_threshold: 50,
    version: 10
  },
  rest: {
    timeout: 20000,
    retries: 3
  }
});

client.commands = new Collection();

// Express Health Server for Render Port Binding
const app = express();
app.get('/', (_, res) => res.send('Xieron HelpDesk is online.'));
app.get('/health', (_, res) => res.json({ ok: true, uptime: process.uptime() }));
app.listen(port, '0.0.0.0', () => console.log(`Health server running on port ${port}`));

// Safe Recursive Command Loader
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

loadCommands(path.join(__dirname, 'commands'));

try {
  const groups = require('./commands/groups');
  for (const c of Object.values(groups)) {
    if (c?.data?.name) client.commands.set(c.data.name, c);
  }
} catch (err) {
  // Ignore missing group commands file
}

// Interaction Event Handler
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

// Load Event Handlers
const events = ['ready', 'messageCreate', 'prefixCommands', 'member', 'logs', 'antiNuke'];
for (const eventFile of events) {
  try {
    require(`./events/${eventFile}`)(client);
  } catch (err) {
    console.warn(`⚠️ Warning: Event '${eventFile}' not loaded:`, err.message);
  }
}

// Global Diagnostics
process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

client.on('error', err => console.error('[DISCORD ERROR]', err));

// Secure Login Attempt
console.log(`Token present: YES (Length: ${token.length})`);
console.log('Connecting to Discord Gateway...');

const loginTimeout = setTimeout(() => {
  console.error('❌ Login timed out. If token was reset, update DISCORD_TOKEN on Render.');
}, 25000);

client.login(token)
  .then(() => {
    clearTimeout(loginTimeout);
    console.log(`✅ Gateway connected! Logged in as ${client.user.tag}`);
  })
  .catch(err => {
    clearTimeout(loginTimeout);
    console.error('❌ Discord Login Error:', err);
  });
