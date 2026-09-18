const { getAutomod } = require('../database/automod');
const { getIgnore } = require('../database/moderation');
const { getSecurity } = require('../database/security');
const { getMedia } = require('../database/media');
const { getResponder } = require('../database/autoresponder');
const { isOnCooldown, setCooldown } = require('../utils/cooldowns');
const { warningCard } = require('../ui/cards');
const { handlePrefixCommand } = require('../handlers/legacyCommandHandler');
const logger = require('../utils/logger');

const LINK_RE = /(https?:\/\/[^\s]+)/gi;
const ZALGO_RE = /[\u0300-\u036f\u0489]/g;

// Rolling spam tracker: guildId:userId -> array of timestamps
const spamTracker = new Map();

async function isWhitelisted(member, guildId) {
  if (!member) return false;
  const sec = await getSecurity(guildId);
  if (sec.whitelist.includes(member.id)) return true;
  return member.roles.cache.some((r) => sec.whitelist.includes(r.id));
}

// --- AFK removed: already provided by Pixel Villa Support ---

async function handleMedia(message) {
  const media = await getMedia(message.guildId);
  if (!media.channels.includes(message.channelId)) return false;
  if (await isWhitelisted(message.member, message.guildId)) return false;

  const hasAttachment = message.attachments.size > 0;
  const hasLink = LINK_RE.test(message.content);
  if (hasAttachment || hasLink) return false;

  await message.delete().catch(() => {});
  message.channel
    .send({ ...warningCard('Media only channel', `${message.author}, only images/links are allowed here.`) })
    .then((m) => setTimeout(() => m.delete().catch(() => {}), 6000))
    .catch(() => {});
  return true;
}

async function handleAutomod(message) {
  if (await isWhitelisted(message.member, message.guildId)) return false;
  const automod = await getAutomod(message.guildId);
  const content = message.content;

  if (automod.antizalgo.enabled && ZALGO_RE.test(content)) {
    await message.delete().catch(() => {});
    return true;
  }

  if (automod.antilink.enabled) {
    const links = content.match(LINK_RE);
    if (links) {
      const allowed = links.every((link) =>
        automod.antilink.whitelistDomains.some((domain) => link.includes(domain)),
      );
      if (!allowed) {
        await message.delete().catch(() => {});
        return true;
      }
    }
  }

  if (automod.anticaps.enabled && content.length >= automod.anticaps.minLength) {
    const letters = content.replace(/[^a-zA-Z]/g, '');
    if (letters.length > 0) {
      const caps = letters.replace(/[^A-Z]/g, '').length;
      const percent = (caps / letters.length) * 100;
      if (percent >= automod.anticaps.maxPercent) {
        await message.delete().catch(() => {});
        return true;
      }
    }
  }

  if (automod.antispam.enabled) {
    const key = `${message.guildId}:${message.author.id}`;
    const now = Date.now();
    const timestamps = (spamTracker.get(key) || []).filter((t) => now - t < automod.antispam.intervalMs);
    timestamps.push(now);
    spamTracker.set(key, timestamps);

    if (timestamps.length > automod.antispam.maxMessages) {
      spamTracker.delete(key);
      if (message.member?.moderatable) {
        await message.member.timeout(automod.antispam.timeoutMs, 'Automod: anti-spam threshold exceeded').catch(() => {});
      }
      return true;
    }
  }

  return false;
}

async function handleAutoresponder(message) {
  const words = message.content.toLowerCase().split(/\s+/);
  for (const word of new Set(words)) {
    const responder = await getResponder(message.guildId, word);
    if (responder) {
      const cooldownKey = `ar:${message.guildId}:${message.channelId}:${word}`;
      if (isOnCooldown(cooldownKey)) continue;
      setCooldown(cooldownKey, 5000);
      await message.channel.send({ content: responder.response }).catch(() => {});
    }
  }
}

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (!message.guild || message.author.bot) return;

    try {
      // Prefix commands run alongside slash commands; the prefix is configurable per guild
      // (Firestore, set via /prefix) with a code-level fallback in config/constants.js.
      await handlePrefixCommand(message, client);

      const ignore = await getIgnore(message.guildId);
      const ignored =
        ignore.channels.includes(message.channelId) &&
        !ignore.whitelistUsers.includes(message.author.id) &&
        !message.member?.roles.cache.some((r) => ignore.whitelistRoles.includes(r.id));
      if (ignored) return;

      const mediaDeleted = await handleMedia(message);
      if (mediaDeleted) return;

      const automodDeleted = await handleAutomod(message);
      if (automodDeleted) return;

      await handleAutoresponder(message);
    } catch (err) {
      logger.error('[messageCreate]', err);
    }
  },
};
