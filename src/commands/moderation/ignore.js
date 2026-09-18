const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { checkAuthorization } = require('../../utils/permissions');
const {
  getIgnore,
  addIgnoreChannel, removeIgnoreChannel, resetIgnoreChannels,
  addIgnoreWhitelistRole, removeIgnoreWhitelistRole, resetIgnoreWhitelistRoles,
  addIgnoreWhitelistUser, removeIgnoreWhitelistUser, resetIgnoreWhitelistUsers,
} = require('../../database/moderation');
const { successCard, errorCard, infoCard } = require('../../ui/cards');

// Note: the spec's "ignore whitelist role add/remove/list/reset" and "ignore whitelist user
// add/remove/list/reset" are flattened into two subcommand groups ("whitelistrole",
// "whitelistuser") since Discord only supports one level of subcommand grouping.
module.exports = {
  category: 'moderation',
  data: new SlashCommandBuilder()
    .setName('ignore')
    .setDescription('Manage automod/logging-ignored channels and whitelisted roles/users')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sc) => sc.setName('manage').setDescription('View current ignore configuration'))
    .addSubcommandGroup((g) =>
      g
        .setName('channel')
        .setDescription('Manage ignored channels')
        .addSubcommand((sc) => sc.setName('add').setDescription('Ignore a channel').addChannelOption((o) => o.setName('channel').setDescription('Channel').addChannelTypes(ChannelType.GuildText).setRequired(true)))
        .addSubcommand((sc) => sc.setName('remove').setDescription('Stop ignoring a channel').addChannelOption((o) => o.setName('channel').setDescription('Channel').addChannelTypes(ChannelType.GuildText).setRequired(true)))
        .addSubcommand((sc) => sc.setName('list').setDescription('List ignored channels'))
        .addSubcommand((sc) => sc.setName('reset').setDescription('Clear ignored channels')),
    )
    .addSubcommandGroup((g) =>
      g
        .setName('whitelistrole')
        .setDescription('Manage roles exempt from ignore rules')
        .addSubcommand((sc) => sc.setName('add').setDescription('Add a role').addRoleOption((o) => o.setName('role').setDescription('Role').setRequired(true)))
        .addSubcommand((sc) => sc.setName('remove').setDescription('Remove a role').addRoleOption((o) => o.setName('role').setDescription('Role').setRequired(true)))
        .addSubcommand((sc) => sc.setName('list').setDescription('List whitelisted roles'))
        .addSubcommand((sc) => sc.setName('reset').setDescription('Clear whitelisted roles')),
    )
    .addSubcommandGroup((g) =>
      g
        .setName('whitelistuser')
        .setDescription('Manage users exempt from ignore rules')
        .addSubcommand((sc) => sc.setName('add').setDescription('Add a user').addUserOption((o) => o.setName('user').setDescription('User').setRequired(true)))
        .addSubcommand((sc) => sc.setName('remove').setDescription('Remove a user').addUserOption((o) => o.setName('user').setDescription('User').setRequired(true)))
        .addSubcommand((sc) => sc.setName('list').setDescription('List whitelisted users'))
        .addSubcommand((sc) => sc.setName('reset').setDescription('Clear whitelisted users')),
    ),

  async execute(interaction) {
    const { allowed } = await checkAuthorization(interaction.member, 'admin');
    if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need admin authority to manage ignore settings.'), ephemeral: true });

    const group = interaction.options.getSubcommandGroup(false);
    const sub = interaction.options.getSubcommand();

    if (!group && sub === 'manage') {
      const cfg = await getIgnore(interaction.guildId);
      return interaction.reply(
        infoCard(
          'Ignore configuration',
          `**Channels:** ${cfg.channels.map((id) => `<#${id}>`).join(', ') || 'none'}\n**Whitelisted roles:** ${cfg.whitelistRoles.map((id) => `<@&${id}>`).join(', ') || 'none'}\n**Whitelisted users:** ${cfg.whitelistUsers.map((id) => `<@${id}>`).join(', ') || 'none'}`,
        ),
      );
    }

    if (group === 'channel') {
      if (sub === 'add') {
        const channel = interaction.options.getChannel('channel');
        await addIgnoreChannel(interaction.guildId, channel.id);
        return interaction.reply(successCard('Channel ignored', `${channel} is now ignored.`));
      }
      if (sub === 'remove') {
        const channel = interaction.options.getChannel('channel');
        await removeIgnoreChannel(interaction.guildId, channel.id);
        return interaction.reply(successCard('Channel unignored', `${channel} is no longer ignored.`));
      }
      if (sub === 'list') {
        const cfg = await getIgnore(interaction.guildId);
        return interaction.reply(infoCard('Ignored channels', cfg.channels.map((id) => `<#${id}>`).join('\n') || '*None*'));
      }
      if (sub === 'reset') {
        await resetIgnoreChannels(interaction.guildId);
        return interaction.reply(successCard('Reset complete', 'Ignored channels cleared.'));
      }
    }

    if (group === 'whitelistrole') {
      if (sub === 'add') {
        const role = interaction.options.getRole('role');
        await addIgnoreWhitelistRole(interaction.guildId, role.id);
        return interaction.reply(successCard('Role whitelisted', `${role} is now exempt from ignore rules.`));
      }
      if (sub === 'remove') {
        const role = interaction.options.getRole('role');
        await removeIgnoreWhitelistRole(interaction.guildId, role.id);
        return interaction.reply(successCard('Role removed', `${role} is no longer exempt.`));
      }
      if (sub === 'list') {
        const cfg = await getIgnore(interaction.guildId);
        return interaction.reply(infoCard('Whitelisted roles', cfg.whitelistRoles.map((id) => `<@&${id}>`).join('\n') || '*None*'));
      }
      if (sub === 'reset') {
        await resetIgnoreWhitelistRoles(interaction.guildId);
        return interaction.reply(successCard('Reset complete', 'Whitelisted roles cleared.'));
      }
    }

    if (group === 'whitelistuser') {
      if (sub === 'add') {
        const user = interaction.options.getUser('user');
        await addIgnoreWhitelistUser(interaction.guildId, user.id);
        return interaction.reply(successCard('User whitelisted', `${user} is now exempt from ignore rules.`));
      }
      if (sub === 'remove') {
        const user = interaction.options.getUser('user');
        await removeIgnoreWhitelistUser(interaction.guildId, user.id);
        return interaction.reply(successCard('User removed', `${user} is no longer exempt.`));
      }
      if (sub === 'list') {
        const cfg = await getIgnore(interaction.guildId);
        return interaction.reply(infoCard('Whitelisted users', cfg.whitelistUsers.map((id) => `<@${id}>`).join('\n') || '*None*'));
      }
      if (sub === 'reset') {
        await resetIgnoreWhitelistUsers(interaction.guildId);
        return interaction.reply(successCard('Reset complete', 'Whitelisted users cleared.'));
      }
    }
  },
};
