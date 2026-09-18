require('dotenv').config();

const REQUIRED = [
  'DISCORD_TOKEN',
  'CLIENT_ID',
  'OWNER_ID',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
];

function validateEnv() {
  const missing = REQUIRED.filter((key) => !process.env[key] || process.env[key].trim() === '');
  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.error(`[env] Missing required environment variables: ${missing.join(', ')}`);
    console.error('[env] Set these in Render under your service\'s Environment tab.');
    process.exit(1);
  }
}

validateEnv();

function normalizePrivateKey(value) {
  const normalized = value
    .trim()
    .replace(/^(["'])([\s\S]*)\1$/, '$2')
    .replace(/\\+n/g, '\n')
    .replace(/\r/g, '');
  const match = normalized.match(/-----BEGIN PRIVATE KEY-----([\s\S]*?)-----END PRIVATE KEY-----/);
  if (!match) return normalized;

  const body = match[1].replace(/[^A-Za-z0-9+/=]/g, '');
  const lines = body.match(/.{1,64}/g) || [];
  return `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----\n`;
}

const firebasePrivateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

module.exports = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  CLIENT_ID: process.env.CLIENT_ID,
  OWNER_ID: process.env.OWNER_ID,
  GUILD_ID: process.env.GUILD_ID || null,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  PORT: process.env.PORT || 3000,
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  MONGO_CONNECTION: process.env.MONGO_CONNECTION || null,
  FIREBASE_PRIVATE_KEY: firebasePrivateKey,
};
