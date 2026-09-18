const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { checkAuthorization } = require('../../utils/permissions');
const { getSecurity, setNightmode, resetNightmode } = require('../../database/security');
const { successCard, errorCard, infoCard } = require('../../ui/cards');
const { sendLog } = require('../../utils/sendLog');

module.exports = {
  category: 'security',
  data: new SlashCommandBuilder()
    .setName('nightmode')
    .setDescription('Lock the server automatically during set hours')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sc) => sc.setName('enable').setDescription('Enable nightmode'))
    .addSubcommand((sc) => sc.setName('disable').setDescription('Disable nightmode'))
    .addSubcommand((sc) =>
      sc
        .setName('auto')
        .setDescription('Configure automatic scheduling')
        .addBooleanOption((o) => o.setName('enabled').setDescription('Enable automatic scheduling').setRequired(true))
        .addIntegerOption((o) => o.setName('start_hour').setDescription('Start hour (0-23, local timezone)').setMinValue(0).setMaxValue(23))
        .addIntegerOption((o) => o.setName('end_hour').setDescription('End hour (0-23, local timezone)').setMinValue(0).setMaxValue(23))
        .addStringOption((o) => o.setName('timezone').setDescription('IANA timezone, e.g. Asia/Kolkata')),
    )
    .addSubcommand((sc) => sc.setName('status').setDescription('View nightmode status'))
    .addSubcommand((sc) => sc.setName('reset').setDescription('Reset nightmode configuration'))
    .addSubcommand((sc) => sc.setName('logs').setDescription('Set the nightmode log channel').addChannelOption((o) => o.setName('channel').setDescription('Log channel').addChannelTypes(ChannelType.GuildText).setRequired(true))),

  async execute(interaction) {
    const { allowed } = await checkAuthorization(interaction.member, 'admin');
    if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need admin authority to configure nightmode.'), ephemeral: true });

    const sub = interaction.options.getSubcommand();

    if (sub === 'enable') {
      await setNightmode(interaction.guildId, { enabled: true });
      const everyone = interaction.guild.roles.everyone;
      await everyone.setPermissions(everyone.permissions.remove('SendMessages')).catch(() => {});
      await sendLog(interaction.guild, 'serverlog', 'Nightmode enabled', `Nightmode was manually enabled by ${interaction.user}.`);
      return interaction.reply(successCard('Nightmode enabled', 'The server has been locked for the night.'));
    }

    if (sub === 'disable') {
      await setNightmode(interaction.guildId, { enabled: false });
      const everyone = interaction.guild.roles.everyone;
      await everyone.setPermissions(everyone.permissions.add('SendMessages')).catch(() => {});
      await sendLog(interaction.guild, 'serverlog', 'Nightmode disabled', `Nightmode was manually disabled by ${interaction.user}.`);
      return interaction.reply(successCard('Nightmode disabled', 'The server has been unlocked.'));
    }

    if (sub === 'auto') {
      const enabled = interaction.options.getBoolean('enabled');
      const startHour = interaction.options.getInteger('start_hour');
      const endHour = interaction.options.getInteger('end_hour');
      const timezone = interaction.options.getString('timezone');
      const patch = { auto: enabled };
      if (startHour !== null) patch.startHour = startHour;
      if (endHour !== null) patch.endHour = endHour;
      if (timezone) patch.timezone = timezone;
      await setNightmode(interaction.guildId, patch);
      return interaction.reply(successCard('Nightmode schedule updated', `Automatic nightmode is now **${enabled ? 'enabled' : 'disabled'}**.`));
    }

    if (sub === 'status') {
      const sec = await getSecurity(interaction.guildId);
      const nm = sec.nightmode;
      return interaction.reply(
        infoCard(
          'Nightmode status',
          `**Enabled:** ${nm.enabled}\n**Auto:** ${nm.auto}\n**Window:** ${nm.startHour}:00 - ${nm.endHour}:00 (${nm.timezone})\n**Log channel:** ${nm.logChannelId ? `<#${nm.logChannelId}>` : 'Not set'}`,
        ),
      );
    }

    if (sub === 'reset') {
      await resetNightmode(interaction.guildId);
      return interaction.reply(successCard('Nightmode reset', 'Nightmode configuration has been reset to defaults.'));
    }

    if (sub === 'logs') {
      const channel = interaction.options.getChannel('channel');
      await setNightmode(interaction.guildId, { logChannelId: channel.id });
      return interaction.reply(successCard('Nightmode log channel set', `Nightmode events will be logged in ${channel}.`));
    }
  },
};
