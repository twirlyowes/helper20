const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { checkAuthorization } = require('../../utils/permissions');
const {
  getMedia,
  addChannel, removeChannel, resetChannels,
  addWhitelistRole, removeWhitelistRole, resetWhitelistRoles,
  addWhitelistUser, removeWhitelistUser, resetWhitelistUsers,
} = require('../../database/media');
const { successCard, errorCard, infoCard } = require('../../ui/cards');

module.exports = {
  category: 'media',
  data: new SlashCommandBuilder()
    .setName('media')
    .setDescription('Restrict channels to media-only content')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand((sc) => sc.setName('config').setDescription('View media configuration'))
    .addSubcommandGroup((g) =>
      g
        .setName('channel')
        .setDescription('Manage media-only channels')
        .addSubcommand((sc) => sc.setName('add').setDescription('Add a media-only channel').addChannelOption((o) => o.setName('channel').setDescription('Channel').addChannelTypes(ChannelType.GuildText).setRequired(true)))
        .addSubcommand((sc) => sc.setName('remove').setDescription('Remove a media-only channel').addChannelOption((o) => o.setName('channel').setDescription('Channel').addChannelTypes(ChannelType.GuildText).setRequired(true)))
        .addSubcommand((sc) => sc.setName('list').setDescription('List media-only channels'))
        .addSubcommand((sc) => sc.setName('reset').setDescription('Clear media-only channels')),
    )
    .addSubcommandGroup((g) =>
      g
        .setName('whitelistrole')
        .setDescription('Manage roles exempt from media-only restriction')
        .addSubcommand((sc) => sc.setName('add').setDescription('Add a role').addRoleOption((o) => o.setName('role').setDescription('Role').setRequired(true)))
        .addSubcommand((sc) => sc.setName('remove').setDescription('Remove a role').addRoleOption((o) => o.setName('role').setDescription('Role').setRequired(true)))
        .addSubcommand((sc) => sc.setName('list').setDescription('List whitelisted roles'))
        .addSubcommand((sc) => sc.setName('reset').setDescription('Clear whitelisted roles')),
    )
    .addSubcommandGroup((g) =>
      g
        .setName('whitelistuser')
        .setDescription('Manage users exempt from media-only restriction')
        .addSubcommand((sc) => sc.setName('add').setDescription('Add a user').addUserOption((o) => o.setName('user').setDescription('User').setRequired(true)))
        .addSubcommand((sc) => sc.setName('remove').setDescription('Remove a user').addUserOption((o) => o.setName('user').setDescription('User').setRequired(true)))
        .addSubcommand((sc) => sc.setName('list').setDescription('List whitelisted users'))
        .addSubcommand((sc) => sc.setName('reset').setDescription('Clear whitelisted users')),
    ),

  async execute(interaction) {
    const { allowed } = await checkAuthorization(interaction.member, 'admin');
    if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need admin authority to configure media restrictions.'), ephemeral: true });

    const group = interaction.options.getSubcommandGroup(false);
    const sub = interaction.options.getSubcommand();

    if (!group && sub === 'config') {
      const cfg = await getMedia(interaction.guildId);
      return interaction.reply(
        infoCard(
          'Media configuration',
          `**Channels:** ${cfg.channels.map((id) => `<#${id}>`).join(', ') || 'none'}\n**Whitelisted roles:** ${cfg.whitelistRoles.map((id) => `<@&${id}>`).join(', ') || 'none'}\n**Whitelisted users:** ${cfg.whitelistUsers.map((id) => `<@${id}>`).join(', ') || 'none'}`,
        ),
      );
    }

    if (group === 'channel') {
      if (sub === 'add') {
        const channel = interaction.options.getChannel('channel');
        await addChannel(interaction.guildId, channel.id);
        return interaction.reply(successCard('Channel added', `${channel} is now media-only.`));
      }
      if (sub === 'remove') {
        const channel = interaction.options.getChannel('channel');
        await removeChannel(interaction.guildId, channel.id);
        return interaction.reply(successCard('Channel removed', `${channel} is no longer media-only.`));
      }
      if (sub === 'list') {
        const cfg = await getMedia(interaction.guildId);
        return interaction.reply(infoCard('Media-only channels', cfg.channels.map((id) => `<#${id}>`).join('\n') || '*None*'));
      }
      if (sub === 'reset') {
        await resetChannels(interaction.guildId);
        return interaction.reply(successCard('Reset complete', 'Media-only channels cleared.'));
      }
    }

    if (group === 'whitelistrole') {
      if (sub === 'add') {
        const role = interaction.options.getRole('role');
        await addWhitelistRole(interaction.guildId, role.id);
        return interaction.reply(successCard('Role whitelisted', `${role} is now exempt.`));
      }
      if (sub === 'remove') {
        const role = interaction.options.getRole('role');
        await removeWhitelistRole(interaction.guildId, role.id);
        return interaction.reply(successCard('Role removed', `${role} is no longer exempt.`));
      }
      if (sub === 'list') {
        const cfg = await getMedia(interaction.guildId);
        return interaction.reply(infoCard('Whitelisted roles', cfg.whitelistRoles.map((id) => `<@&${id}>`).join('\n') || '*None*'));
      }
      if (sub === 'reset') {
        await resetWhitelistRoles(interaction.guildId);
        return interaction.reply(successCard('Reset complete', 'Whitelisted roles cleared.'));
      }
    }

    if (group === 'whitelistuser') {
      if (sub === 'add') {
        const user = interaction.options.getUser('user');
        await addWhitelistUser(interaction.guildId, user.id);
        return interaction.reply(successCard('User whitelisted', `${user} is now exempt.`));
      }
      if (sub === 'remove') {
        const user = interaction.options.getUser('user');
        await removeWhitelistUser(interaction.guildId, user.id);
        return interaction.reply(successCard('User removed', `${user} is no longer exempt.`));
      }
      if (sub === 'list') {
        const cfg = await getMedia(interaction.guildId);
        return interaction.reply(infoCard('Whitelisted users', cfg.whitelistUsers.map((id) => `<@${id}>`).join('\n') || '*None*'));
      }
      if (sub === 'reset') {
        await resetWhitelistUsers(interaction.guildId);
        return interaction.reply(successCard('Reset complete', 'Whitelisted users cleared.'));
      }
    }
  },
};
