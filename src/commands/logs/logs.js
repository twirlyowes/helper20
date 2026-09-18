const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { checkAuthorization } = require('../../utils/permissions');
const { getLogs, setLogChannel, setAutologs, resetLogs } = require('../../database/logs');
const { successCard, errorCard, infoCard } = require('../../ui/cards');

const CHANNEL_LOG_TYPES = ['channellog', 'memberlog', 'messagelog', 'modlog', 'rolelog', 'serverlog', 'voicelog'];

function channelSetter(type) {
  return (sc) =>
    sc
      .setName(type)
      .setDescription(`Set the ${type} channel`)
      .addChannelOption((o) => o.setName('channel').setDescription('Log channel').addChannelTypes(ChannelType.GuildText).setRequired(true));
}

module.exports = {
  category: 'logs',
  data: new SlashCommandBuilder()
    .setName('logs')
    .setDescription('Configure server logging')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sc) => sc.setName('autologs').setDescription('Toggle logging on/off').addBooleanOption((o) => o.setName('enabled').setDescription('Enable logging').setRequired(true)))
    .addSubcommand(channelSetter('channellog'))
    .addSubcommand(channelSetter('memberlog'))
    .addSubcommand(channelSetter('messagelog'))
    .addSubcommand(channelSetter('modlog'))
    .addSubcommand(channelSetter('rolelog'))
    .addSubcommand(channelSetter('serverlog'))
    .addSubcommand(channelSetter('voicelog'))
    .addSubcommand((sc) => sc.setName('showlogs').setDescription('View current log channel configuration'))
    .addSubcommand((sc) => sc.setName('resetlog').setDescription('Reset all log configuration')),

  async execute(interaction) {
    const { allowed } = await checkAuthorization(interaction.member, 'admin');
    if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need admin authority to configure logging.'), ephemeral: true });

    const sub = interaction.options.getSubcommand();

    if (sub === 'autologs') {
      const enabled = interaction.options.getBoolean('enabled');
      await setAutologs(interaction.guildId, enabled);
      return interaction.reply(successCard('Logging updated', `Logging is now **${enabled ? 'enabled' : 'disabled'}**.`));
    }

    if (CHANNEL_LOG_TYPES.includes(sub)) {
      const channel = interaction.options.getChannel('channel');
      if (!channel) {
        return interaction.reply({ ...errorCard('Missing channel', 'Select a text channel for this log type.'), ephemeral: true });
      }
      await setLogChannel(interaction.guildId, sub, channel.id);
      return interaction.reply(successCard('Log channel set', `**${sub}** will now log to ${channel}.`));
    }

    if (sub === 'showlogs') {
      const logs = await getLogs(interaction.guildId);
      const lines = [`**Enabled:** ${logs.enabled}`, ...Object.entries(logs.channels).map(([type, id]) => `**${type}:** ${id ? `<#${id}>` : 'Not set'}`)];
      return interaction.reply(infoCard('Log configuration', lines.join('\n')));
    }

    if (sub === 'resetlog') {
      await resetLogs(interaction.guildId);
      return interaction.reply(successCard('Logs reset', 'All log configuration has been reset.'));
    }
  },
};
