js
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const https = require('https');
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
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates
  ],

  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User
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
// Discord Debug Logging
// ==========================================================

client.on('debug', info => {
  console.log(`[DISCORD DEBUG] ${info}`);
});

// ==========================================================
// Discord Ready Verification
// ==========================================================

client.once('ready', () => {
  console.log('========================================');
  console.log(`✅ BOT ONLINE: ${client.user.tag}`);
  console.log(`🆔 Bot ID: ${client.user.id}`);
  console.log(`🏠 Servers: ${client.guilds.cache.size}`);
  console.log('========================================');
});

// ==========================================================
// Discord REST Connectivity Test
// ==========================================================

function testDiscordREST() {
  console.log('🌐 Testing Discord REST API...');

  const request = https.get(
    'https://discord.com/api/v10/gateway',
    response => {
      console.log(
        `🌐 Discord REST test: HTTP ${response.statusCode}`
      );

      response.on('data', () => {});

      response.on('end', () => {
        console.log('🌐 Discord REST test completed.');
      });
    }
  );

  request.setTimeout(10000, () => {
    console.error('❌ Discord REST test timed out.');
    request.destroy();
  });

  request.on('error', err => {
    console.error(
      '❌ Discord REST test failed:',
      err.message
    );
  });
}

// ==========================================================
// Gateway Login With Timeout Diagnostics
// ==========================================================

async function connectToDiscord() {
  console.log(`Token present: YES (Length: ${token.length})`);
  console.log('Connecting to Discord Gateway...');

  // Test basic HTTPS connectivity to Discord first.
  testDiscordREST();

  let loginFinished = false;

  // Gateway timeout diagnostic.
  const gatewayTimeout = setTimeout(() => {
    if (!loginFinished && !client.isReady()) {
      console.error('========================================');
      console.error('❌ GATEWAY CONNECTION TIMEOUT');
      console.error(
        'Discord login has not completed after 30 seconds.'
      );
      console.error(
        'The process can reach Render, but Discord Gateway connection may be blocked or stalled.'
      );
      console.error('========================================');
    }
  }, 30000);

  try {
    await client.login(token);

    loginFinished = true;
    clearTimeout(gatewayTimeout);

    console.log('========================================');
    console.log('✅ client.login() resolved successfully');
    console.log('========================================');
  } catch (err) {
    loginFinished = true;
    clearTimeout(gatewayTimeout);

    console.error('========================================');
    console.error('❌ Discord Login Error');
    console.error(err);
    console.error('========================================');
  }
}

// ==========================================================
// Start Discord Connection
// ==========================================================

connectToDiscord();
