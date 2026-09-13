require('dotenv').config();
const dns = require('dns');

// Force Node.js to prioritize IPv4 addresses over IPv6 for WebSocket connections
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const fs = require('fs');
const path = require('path');
const express = require('express');
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { token, port } = require('./config');

if (!token) {
  throw new Error('DISCORD_TOKEN environment variable is missing.');
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

// Express Health Server for Render Port Binding
const app = express();
app.get('/', (_, res) => res.send('Xieron HelpDesk is online.'));
app.get('/health', (_, res) => res.json({ ok: true, uptime: process.uptime() }));
app.listen(port, '0.0.0.0', () => console.log(`Health server running on port ${port}`));

// Safe Command Loading
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

// Event Handler Registration
const events = ['ready', 'messageCreate', 'prefixCommands', 'member', 'logs', 'antiNuke'];
for (const eventFile of events) {
  try {
    require(`./events/${eventFile}`)(client);
  } catch (err) {
    console.warn(`⚠️ Warning: Event '${eventFile}' skipped:`, err.message);
  }
}

// Global Diagnostics & Connection Verification
process.on('unhandledRejection', error => console.error('Unhandled Rejection:', error));
client.on('error', err => console.error('[DISCORD CLIENT ERROR]', err));

console.log(`Token present: YES (Length: ${token.length})`);
console.log('Connecting to Discord Gateway...');

client.login(token)
  .then(() => {
    console.log(`✅ Gateway connected! Logged in as ${client.user.tag}`);
  })
  .catch(err => {
    console.error('❌ Discord Login Error:', err);
  });
