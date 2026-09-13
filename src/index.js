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
  partials: [Partials.Channel, Partials.Message, Partials.User],
  rest: {
    timeout: 15000 // Increase REST API timeout window
  }
});

client.commands = new Collection();

// Express Web Server for Render Port Binding
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
  // Ignore if no group commands file exists
}

// Interaction Handler
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

// Load Event Listeners Safely
const events = ['ready', 'messageCreate', 'prefixCommands', 'member', 'logs', 'antiNuke'];
for (const eventFile of events) {
  try {
    require(`./events/${eventFile}`)(client);
  } catch (err) {
    console.warn(`⚠️ Warning: Event listener '${eventFile}' not loaded:`, err.message);
  }
}

// Global Diagnostics & Exception Handlers
process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

client.on('debug', info => {
  // Filters out repetitive heartbeat logs to keep output clean
  if (!info.includes('Heartbeat')) console.log(`[DISCORD DEBUG] ${info}`);
});

client.on('error', err => console.error('[DISCORD CLIENT ERROR]', err));

// Gateway Connection Attempt
console.log(`Token present: ${!!token} (Length: ${token ? token.length : 0})`);
console.log('Connecting to Discord Gateway...');

const loginTimeout = setTimeout(() => {
  console.error('❌ Discord connection timed out after 20 seconds. Re-verify your bot token in Discord Portal.');
}, 20000);

client.login(token)
  .then(() => {
    clearTimeout(loginTimeout);
    console.log(`✅ Gateway connected! Logged in as ${client.user.tag}`);
  })
  .catch(err => {
    clearTimeout(loginTimeout);
    console.error('❌ Discord Login Error:', err);
  });
