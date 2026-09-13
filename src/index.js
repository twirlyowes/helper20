require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');

const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection
} = require('discord.js');

const { token, port } = require('./config');

// ==========================================================
// Token Validation
// ==========================================================

if (!token) {
  throw new Error('DISCORD_TOKEN environment variable is missing.');
}

// ==========================================================
// Discord Client
// ==========================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers
  ],

  partials: [
    Partials.Channel
  ]
});

client.commands = new Collection();

// ==========================================================
// Express Health Server for Render
// ==========================================================

const app = express();

app.get('/', (_, res) => {
  res.send('Xieron HelpDesk is online.');
});

app.get('/health', (_, res) => {
  res.json({
    ok: true,
    uptime: process.uptime(),
    discordReady: client.isReady()
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Health server running on port ${port}`);
});

// ==========================================================
// Safe Command Loading
// ==========================================================

function loadCommands(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.warn(`⚠️ Commands directory not found: ${dirPath}`);
    return;
  }

  for (const file of fs.readdirSync(dirPath)) {
    const fullPath = path.join(dirPath, file);

    if (fs.statSync(fullPath).isDirectory()) {
      loadCommands(fullPath);
    } else if (
      file.endsWith('.js') &&
      !file.startsWith('_')
    ) {
      try {
        const cmd = require(fullPath);

        if (cmd?.data?.name) {
          client.commands.set(cmd.data.name, cmd);
          console.log(`✅ Loaded command: ${cmd.data.name}`);
        }
      } catch (err) {
        console.error(
          `❌ Failed to load command at ${fullPath}:`,
          err
        );
      }
    }
  }
}

loadCommands(path.join(__dirname, 'commands'));

// ==========================================================
// Event Handler Registration
// ==========================================================

const events = [
  'ready',
  'messageCreate',
  'prefixCommands',
  'member',
  'logs',
  'antiNuke'
];

for (const eventFile of events) {
  try {
    require(`./events/${eventFile}`)(client);
    console.log(`✅ Loaded event: ${eventFile}`);
  } catch (err) {
    console.warn(
      `⚠️ Warning: Event '${eventFile}' skipped:`,
      err.message
    );
  }
}

// ==========================================================
// Global Error Diagnostics
// ==========================================================

process.on('unhandledRejection', error => {
  console.error('❌ Unhandled Rejection:', error);
});

process.on('uncaughtException', error => {
  console.error('❌ Uncaught Exception:', error);
});

client.on('error', err => {
  console.error('❌ Discord Client Error:', err);
});

client.on('shardError', err => {
  console.error('❌ Discord Shard Error:', err);
});

// ==========================================================
// Discord Ready
// ==========================================================

client.once('ready', () => {
  console.log('========================================');
  console.log(`✅ BOT ONLINE: ${client.user.tag}`);
  console.log(`🆔 Bot ID: ${client.user.id}`);
  console.log(`🏠 Servers: ${client.guilds.cache.size}`);
  console.log('========================================');
});

// ==========================================================
// Discord Login — Pixel Villa Style
// ==========================================================

console.log('About to login...');
console.log('Token exists:', !!token);

client.login(token)
  .then(() => {
    console.log('✅ Login successful');
  })
  .catch(err => {
    console.error('❌ Login failed:', err);
  });
