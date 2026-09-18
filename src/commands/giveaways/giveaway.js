const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { checkAuthorization } = require('../../utils/permissions');
const { createGiveaway, listActiveGiveaways, listAllGiveaways, getGiveaway, addEntry, removeEntry, endGiveaway } = require('../../database/giveaways');
const { successCard, errorCard, infoCard } = require('../../ui/cards');
const { button, row } = require('../../ui/buttons');
const { ButtonStyle } = require('discord.js');

function parseDuration(input) {
  const match = /^(\d+)([smhd])$/i.exec(input.trim());
  if (!match) return null;
  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * multipliers[unit];
}

function pickWinners(entries, count) {
  const pool = [...entries];
  const winners = [];
  while (winners.length < count && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    winners.push(pool.splice(idx, 1)[0]);
  }
  return winners;
}

module.exports = {
  category: 'giveaways',
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Manage giveaways')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sc) =>
      sc
        .setName('start')
        .setDescription('Start a giveaway')
        .addStringOption((o) => o.setName('prize').setDescription('Prize').setRequired(true))
        .addStringOption((o) => o.setName('duration').setDescription('Duration, e.g. 10m, 1h, 2d').setRequired(true))
        .addIntegerOption((o) => o.setName('winners').setDescription('Number of winners').setMinValue(1).setRequired(true))
        .addChannelOption((o) => o.setName('channel').setDescription('Channel (defaults to this one)').addChannelTypes(ChannelType.GuildText)),
    )
    .addSubcommand((sc) => sc.setName('end').setDescription('End a giveaway early').addStringOption((o) => o.setName('id').setDescription('Giveaway ID').setRequired(true)))
    .addSubcommand((sc) => sc.setName('list').setDescription('List active giveaways'))
    .addSubcommand((sc) => sc.setName('reroll').setDescription('Reroll winners for a giveaway').addStringOption((o) => o.setName('id').setDescription('Giveaway ID').setRequired(true))),

  async execute(interaction) {
    const { allowed } = await checkAuthorization(interaction.member, 'mod');
    if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need moderator authority to manage giveaways.'), ephemeral: true });

    const sub = interaction.options.getSubcommand();

    if (sub === 'start') {
      const prize = interaction.options.getString('prize');
      const durationRaw = interaction.options.getString('duration');
      const winnersCount = interaction.options.getInteger('winners');
      const channel = interaction.options.getChannel('channel') || interaction.channel;

      const durationMs = parseDuration(durationRaw);
      if (!durationMs) return interaction.reply({ ...errorCard('Invalid duration', 'Use a format like `10m`, `1h`, or `2d`.'), ephemeral: true });

      const endsAt = Date.now() + durationMs;
      const giveaway = await createGiveaway(interaction.guildId, { prize, endsAt, winnersCount, channelId: channel.id, hostId: interaction.user.id });

      const enterRow = row(button({ customId: `giveaway:enter:${giveaway.id}`, label: 'Enter Giveaway', style: ButtonStyle.Primary, emoji: '🎉' }));
      const sent = await channel.send({
        ...successCard('🎉 Giveaway', `**Prize:** ${prize}\n**Winners:** ${winnersCount}\n**Ends:** <t:${Math.floor(endsAt / 1000)}:R>`, { rows: [enterRow] }),
      });

      const { collection } = require('../../database/guildConfig');
      await collection(interaction.guildId, 'giveaways').doc(giveaway.id).update({ messageId: sent.id });

      setTimeout(() => finishGiveaway(interaction.client, interaction.guildId, giveaway.id).catch(() => {}), durationMs);

      return interaction.reply({ ...successCard('Giveaway started', `Giveaway ID: \`${giveaway.id}\``), ephemeral: true });
    }

    if (sub === 'end') {
      const id = interaction.options.getString('id');
      const giveaway = await getGiveaway(interaction.guildId, id);
      if (!giveaway || giveaway.ended) return interaction.reply({ ...errorCard('Not found', 'No active giveaway with that ID.'), ephemeral: true });
      await finishGiveaway(interaction.client, interaction.guildId, id);
      return interaction.reply(successCard('Giveaway ended', `Giveaway \`${id}\` has been ended.`));
    }

    if (sub === 'list') {
      const active = await listActiveGiveaways(interaction.guildId);
      const lines = active.map((g) => `\`${g.id}\` — ${g.prize} (ends <t:${Math.floor(g.endsAt / 1000)}:R>)`);
      return interaction.reply(infoCard(`Active giveaways (${active.length})`, lines.join('\n') || '*None active.*'));
    }

    if (sub === 'reroll') {
      const id = interaction.options.getString('id');
      const giveaway = await getGiveaway(interaction.guildId, id);
      if (!giveaway || !giveaway.ended) return interaction.reply({ ...errorCard('Not found', 'That giveaway has not ended yet or does not exist.'), ephemeral: true });
      if (giveaway.entries.length === 0) return interaction.reply({ ...errorCard('No entries', 'There were no entries to reroll from.'), ephemeral: true });

      const winners = pickWinners(giveaway.entries, giveaway.winnersCount);
      await endGiveaway(interaction.guildId, id, winners);
      return interaction.reply(successCard('Winners rerolled', `New winner(s): ${winners.map((w) => `<@${w}>`).join(', ')}`));
    }
  },

  components: {
    giveaway: async (interaction) => {
      const [, action, id] = interaction.customId.split(':');
      if (action !== 'enter') return;

      const giveaway = await getGiveaway(interaction.guildId, id);
      if (!giveaway || giveaway.ended) {
        return interaction.reply({ ...errorCard('Giveaway ended', 'This giveaway has already ended.'), ephemeral: true });
      }

      if (giveaway.entries.includes(interaction.user.id)) {
        await removeEntry(interaction.guildId, id, interaction.user.id);
        return interaction.reply({ ...successCard('Entry removed', 'You have left this giveaway.'), ephemeral: true });
      }

      await addEntry(interaction.guildId, id, interaction.user.id);
      return interaction.reply({ ...successCard('Entered!', 'Good luck! Click the button again to leave the giveaway.'), ephemeral: true });
    },
  },
};

async function finishGiveaway(client, guildId, id) {
  const giveaway = await getGiveaway(guildId, id);
  if (!giveaway || giveaway.ended) return;

  const winners = pickWinners(giveaway.entries, giveaway.winnersCount);
  await endGiveaway(guildId, id, winners);

  const guild = await client.guilds.fetch(guildId).catch(() => null);
  if (!guild) return;
  const channel = await guild.channels.fetch(giveaway.channelId).catch(() => null);
  if (!channel) return;

  const { successCard: sc, errorCard: ec } = require('../../ui/cards');
  const resultCard = winners.length
    ? sc('🎉 Giveaway ended', `**Prize:** ${giveaway.prize}\n**Winner(s):** ${winners.map((w) => `<@${w}>`).join(', ')}`)
    : ec('🎉 Giveaway ended', `**Prize:** ${giveaway.prize}\nNo one entered — no winner could be selected.`);

  await channel.send(resultCard).catch(() => {});
}
