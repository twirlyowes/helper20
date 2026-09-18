const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkAuthorization } = require('../../utils/permissions');
const { getAntinuke, setAntinuke, setThreshold } = require('../../database/antinuke');
const { successCard, errorCard, infoCard } = require('../../ui/cards');

const THRESHOLD_KEYS = ['channelDelete', 'channelCreate', 'roleDelete', 'roleCreate', 'ban', 'kick', 'webhookCreate'];

module.exports = {
  category: 'security',
  data: new SlashCommandBuilder()
    .setName('antinuke')
    .setDescription('Configure anti-nuke protection')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sc) => sc.setName('enable').setDescription('Enable antinuke protection'))
    .addSubcommand((sc) => sc.setName('disable').setDescription('Disable antinuke protection'))
    .addSubcommand((sc) =>
      sc
        .setName('config')
        .setDescription('Configure a threshold')
        .addStringOption((o) => o.setName('key').setDescription('Threshold to configure').setRequired(true).addChoices(...THRESHOLD_KEYS.map((k) => ({ name: k, value: k }))))
        .addIntegerOption((o) => o.setName('value').setDescription('New threshold value').setRequired(true).setMinValue(1)),
    )
    .addSubcommand((sc) =>
      sc
        .setName('settings')
        .setDescription('Set punishment action and cooldown')
        .addStringOption((o) => o.setName('action').setDescription('Punishment action').addChoices({ name: 'Strip Roles', value: 'strip_roles' }, { name: 'Kick', value: 'kick' }, { name: 'Ban', value: 'ban' }))
        .addIntegerOption((o) => o.setName('cooldown_seconds').setDescription('Cooldown between punishments per user')),
    ),

  async execute(interaction) {
    const { allowed } = await checkAuthorization(interaction.member, 'admin');
    if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need admin authority to configure antinuke.'), ephemeral: true });

    const sub = interaction.options.getSubcommand();

    if (sub === 'enable') {
      await setAntinuke(interaction.guildId, { enabled: true });
      return interaction.reply(successCard('Antinuke enabled', 'Your server is now protected against mass-destructive actions.'));
    }

    if (sub === 'disable') {
      await setAntinuke(interaction.guildId, { enabled: false });
      return interaction.reply(successCard('Antinuke disabled', 'Antinuke protection has been turned off.'));
    }

    if (sub === 'config') {
      const key = interaction.options.getString('key');
      const value = interaction.options.getInteger('value');
      await setThreshold(interaction.guildId, key, value);
      return interaction.reply(successCard('Threshold updated', `**${key}** threshold set to **${value}**.`));
    }

    if (sub === 'settings') {
      const action = interaction.options.getString('action');
      const cooldownSeconds = interaction.options.getInteger('cooldown_seconds');
      const patch = {};
      if (action) patch.action = action;
      if (cooldownSeconds) patch.cooldownMs = cooldownSeconds * 1000;
      if (Object.keys(patch).length === 0) {
        const current = await getAntinuke(interaction.guildId);
        return interaction.reply(
          infoCard(
            'Antinuke settings',
            `**Enabled:** ${current.enabled}\n**Action:** ${current.action}\n**Cooldown:** ${current.cooldownMs / 1000}s\n**Window:** ${current.windowMs / 1000}s\n**Thresholds:** ${THRESHOLD_KEYS.map((k) => `${k}: ${current.thresholds[k]}`).join(', ')}`,
          ),
        );
      }
      await setAntinuke(interaction.guildId, patch);
      return interaction.reply(successCard('Settings updated', 'Antinuke settings have been updated.'));
    }
  },
};
