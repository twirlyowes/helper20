const logger = require('../utils/logger');
const { listActiveGiveaways, getGiveaway, endGiveaway } = require('../database/giveaways');
const { getSecurity, setNightmode } = require('../database/security');

function pickWinners(entries, count) {
  const pool = [...entries];
  const winners = [];
  while (winners.length < count && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    winners.push(pool.splice(idx, 1)[0]);
  }
  return winners;
}

async function finishGiveaway(client, guildId, id) {
  const giveaway = await getGiveaway(guildId, id);
  if (!giveaway || giveaway.ended) return;

  const winners = pickWinners(giveaway.entries, giveaway.winnersCount);
  await endGiveaway(guildId, id, winners);

  const guild = await client.guilds.fetch(guildId).catch(() => null);
  if (!guild) return;
  const channel = await guild.channels.fetch(giveaway.channelId).catch(() => null);
  if (!channel) return;

  const { successCard, errorCard } = require('../ui/cards');
  const resultCard = winners.length
    ? successCard('🎉 Giveaway ended', `**Prize:** ${giveaway.prize}\n**Winner(s):** ${winners.map((w) => `<@${w}>`).join(', ')}`)
    : errorCard('🎉 Giveaway ended', `**Prize:** ${giveaway.prize}\nNo one entered — no winner could be selected.`);

  await channel.send(resultCard).catch(() => {});
}

/** Reschedules or immediately finishes any active giveaways so they survive a bot restart. */
async function resumeGiveaways(client) {
  for (const [, guild] of client.guilds.cache) {
    const active = await listActiveGiveaways(guild.id).catch(() => []);
    for (const giveaway of active) {
      const remaining = giveaway.endsAt - Date.now();
      if (remaining <= 0) {
        finishGiveaway(client, guild.id, giveaway.id).catch((err) => logger.error('[resumeGiveaways]', err));
      } else {
        setTimeout(() => finishGiveaway(client, guild.id, giveaway.id).catch((err) => logger.error('[resumeGiveaways]', err)), remaining);
      }
    }
  }
}

const nightmodeState = new Map(); // guildId -> currently locked (boolean)

/** Checks each guild's nightmode.auto schedule every 5 minutes and locks/unlocks accordingly. */
function startNightmodeScheduler(client) {
  setInterval(async () => {
    for (const [, guild] of client.guilds.cache) {
      try {
        const sec = await getSecurity(guild.id);
        const nm = sec.nightmode;
        if (!nm.auto) continue;

        const hour = parseInt(
          new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: nm.timezone }).format(new Date()),
          10,
        );

        const shouldLock =
          nm.startHour < nm.endHour ? hour >= nm.startHour && hour < nm.endHour : hour >= nm.startHour || hour < nm.endHour;

        const currentlyLocked = nightmodeState.get(guild.id) ?? nm.enabled;
        if (shouldLock === currentlyLocked) continue;

        const everyone = guild.roles.everyone;
        if (shouldLock) await everyone.setPermissions(everyone.permissions.remove('SendMessages')).catch(() => {});
        else await everyone.setPermissions(everyone.permissions.add('SendMessages')).catch(() => {});

        nightmodeState.set(guild.id, shouldLock);
        await setNightmode(guild.id, { enabled: shouldLock });
      } catch (err) {
        logger.error(`[nightmodeScheduler] guild ${guild.id}`, err);
      }
    }
  }, 5 * 60 * 1000);
}

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    client.startedAt = Date.now();
    logger.info(`[ready] Logged in as ${client.user.tag} (${client.guilds.cache.size} guilds).`);
    client.user.setPresence({ activities: [{ name: '/help' }], status: 'online' });
    await resumeGiveaways(client);
    startNightmodeScheduler(client);
  },
};
