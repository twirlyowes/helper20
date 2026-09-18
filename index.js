// Single entry point for the entire bot. Run with: node index.js

const { Client, GatewayIntentBits, Partials } = require('discord.js');
const express = require('express');

const env = require('./src/config/env');
const { loadCommands } = require('./src/handlers/commandLoader');
const { loadEvents } = require('./src/handlers/eventLoader');
const { buildComponentRouter } = require('./src/handlers/componentLoader');
const logger = require('./src/utils/logger');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildExpressions,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.GuildMember,
  ],
});

loadCommands(client);
loadEvents(client);
buildComponentRouter(client);

// Render health check
const app = express();

app.get('/', (req, res) => {
  res.status(200).send('OK');
});

app.listen(env.PORT, () => {
  logger.info(`[health] Listening on port ${env.PORT}`);
});

// Process-level diagnostics
process.on('unhandledRejection', (err) => {
  console.error('[unhandledRejection]', err);
  logger.error(`[unhandledRejection] ${err?.stack || err}`);
});

process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
  logger.error(`[uncaughtException] ${err?.stack || err}`);
});

// Discord diagnostics
client.on('error', (err) => {
  console.error('[client:error]', err);
  logger.error(`[client:error] ${err?.stack || err}`);
});

client.on('shardError', (err, shardId) => {
  console.error(`[client:shardError] shard ${shardId}`, err);
  logger.error(`[client:shardError] shard ${shardId}: ${err?.stack || err}`);
});

client.on('warn', (msg) => {
  console.warn('[client:warn]', msg);
  logger.warn(`[client:warn] ${msg}`);
});

client.on('shardDisconnect', (event, shardId) => {
  console.warn(
    `[client:shardDisconnect] shard ${shardId} code=${event.code} reason=${event.reason}`
  );

  logger.warn(
    `[client:shardDisconnect] shard ${shardId} code=${event.code} reason=${event.reason}`
  );
});

client.on('shardReconnecting', (shardId) => {
  console.warn(`[client:shardReconnecting] shard ${shardId}`);
  logger.warn(`[client:shardReconnecting] shard ${shardId}`);
});

// Successful Discord login
client.once('ready', () => {
  console.log(`[Discord] READY — logged in as ${client.user.tag}`);
  logger.info(`[Discord] READY — logged in as ${client.user.tag}`);
});

// Check whether the token exists WITHOUT exposing the token
console.log(
  `[index] DISCORD_TOKEN present: ${Boolean(env.DISCORD_TOKEN)}`
);

console.log(
  `[index] DISCORD_TOKEN length: ${
    env.DISCORD_TOKEN ? env.DISCORD_TOKEN.length : 0
  }`
);

logger.info('[index] Attempting Discord login...');
// One-off connectivity probe: confirms whether outbound HTTPS to Discord even
// works from this host, independent of discord.js/login entirely.
(async () => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const start = Date.now();
    const res = await fetch('https://discord.com/api/v10/gateway', { signal: controller.signal });
    logger.info(`[probe] Reached discord.com in ${Date.now() - start}ms, status ${res.status}`);
  } catch (err) {
    logger.error(`[probe] FAILED to reach discord.com: ${err.message}`);
  } finally {
    clearTimeout(timeout);
  }
})();

client.login(env.DISCORD_TOKEN).catch((err) => {
  logger.error('[client:login] Login failed:', err?.stack || err);
});

setTimeout(() => {
  if (client.isReady()) return;
  logger.warn(
    `[index] Still not ready 20s after login attempt. ws.status=${client.ws.status} shards=${client.ws.shards.size}`,
  );
}, 20000);
