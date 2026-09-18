const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkAuthorization } = require('../../utils/permissions');
const {
  setCustomRole, getCustomRole, removeCustomRole, listCustomRoles, resetCustomRoles,
  getReqRoles, addReqRole, removeReqRole, resetReqRoles,
} = require('../../database/customrole');
const { successCard, errorCard, infoCard } = require('../../ui/cards');

module.exports = {
  category: 'customrole',
  data: new SlashCommandBuilder()
    .setName('customrole')
    .setDescription('Manage personal custom roles')
    .addSubcommand((sc) =>
      sc
        .setName('add')
        .setDescription('Create/assign a custom role to a member')
        .addUserOption((o) => o.setName('user').setDescription('Member to receive the role').setRequired(true))
        .addStringOption((o) => o.setName('name').setDescription('Role name').setRequired(true))
        .addStringOption((o) => o.setName('color').setDescription('Hex color, e.g. #38BDF8')),
    )
    .addSubcommand((sc) => sc.setName('remove').setDescription('Remove a member\'s custom role').addUserOption((o) => o.setName('user').setDescription('Member').setRequired(true)))
    .addSubcommand((sc) => sc.setName('list').setDescription('List all custom roles'))
    .addSubcommand((sc) => sc.setName('reset').setDescription('Remove all custom roles'))
    .addSubcommand((sc) => sc.setName('config').setDescription('View custom role configuration'))
    .addSubcommandGroup((g) =>
      g
        .setName('reqrole')
        .setDescription('Manage which roles are required to use /customrole add')
        .addSubcommand((sc) => sc.setName('add').setDescription('Add a required role').addRoleOption((o) => o.setName('role').setDescription('Role').setRequired(true)))
        .addSubcommand((sc) => sc.setName('remove').setDescription('Remove a required role').addRoleOption((o) => o.setName('role').setDescription('Role').setRequired(true)))
        .addSubcommand((sc) => sc.setName('reset').setDescription('Clear required roles'))
        .addSubcommand((sc) => sc.setName('list').setDescription('List required roles')),
    ),

  async execute(interaction) {
    const group = interaction.options.getSubcommandGroup(false);
    const sub = interaction.options.getSubcommand();

    if (group === 'reqrole') {
      const { allowed } = await checkAuthorization(interaction.member, 'admin');
      if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need admin authority to configure required roles.'), ephemeral: true });

      if (sub === 'add') {
        const role = interaction.options.getRole('role');
        await addReqRole(interaction.guildId, role.id);
        return interaction.reply(successCard('Required role added', `${role} is now required to use custom roles.`));
      }
      if (sub === 'remove') {
        const role = interaction.options.getRole('role');
        await removeReqRole(interaction.guildId, role.id);
        return interaction.reply(successCard('Required role removed', `${role} is no longer required.`));
      }
      if (sub === 'reset') {
        await resetReqRoles(interaction.guildId);
        return interaction.reply(successCard('Reset complete', 'Required roles cleared.'));
      }
      if (sub === 'list') {
        const cfg = await getReqRoles(interaction.guildId);
        return interaction.reply(infoCard('Required roles', cfg.roles.map((id) => `<@&${id}>`).join('\n') || '*None — everyone can use custom roles.*'));
      }
      return;
    }

    if (sub === 'add') {
      const reqRoles = await getReqRoles(interaction.guildId);
      const authorizedByAdmin = (await checkAuthorization(interaction.member, 'admin')).allowed;
      const hasReqRole = reqRoles.roles.length === 0 || interaction.member.roles.cache.some((r) => reqRoles.roles.includes(r.id));
      if (!authorizedByAdmin && !hasReqRole) {
        return interaction.reply({ ...errorCard('Not authorized', 'You do not have a role required to create a custom role.'), ephemeral: true });
      }

      const user = interaction.options.getUser('user');
      const name = interaction.options.getString('name');
      const color = interaction.options.getString('color') || undefined;
      const targetMember = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!targetMember) return interaction.reply({ ...errorCard('Not found', 'That user is not in this server.'), ephemeral: true });

      const existing = await getCustomRole(interaction.guildId, user.id);
      if (existing) {
        const role = await interaction.guild.roles.fetch(existing.roleId).catch(() => null);
        if (role) {
          await role.setName(name).catch(() => {});
          if (color) await role.setColor(color).catch(() => {});
          return interaction.reply(successCard('Custom role updated', `Updated ${user}'s custom role.`));
        }
      }

      const role = await interaction.guild.roles.create({ name, color, reason: `Custom role for ${user.tag}` });
      await targetMember.roles.add(role).catch(() => {});
      await setCustomRole(interaction.guildId, user.id, role.id);
      return interaction.reply(successCard('Custom role created', `Created and assigned ${role} to ${user}.`));
    }

    if (sub === 'remove') {
      const { allowed } = await checkAuthorization(interaction.member, 'mod');
      if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need moderator authority to remove custom roles.'), ephemeral: true });

      const user = interaction.options.getUser('user');
      const existing = await getCustomRole(interaction.guildId, user.id);
      if (!existing) return interaction.reply({ ...errorCard('Not found', 'That user has no custom role.'), ephemeral: true });

      const role = await interaction.guild.roles.fetch(existing.roleId).catch(() => null);
      if (role) await role.delete(`Custom role removed by ${interaction.user.tag}`).catch(() => {});
      await removeCustomRole(interaction.guildId, user.id);
      return interaction.reply(successCard('Custom role removed', `Removed ${user}'s custom role.`));
    }

    if (sub === 'list') {
      const all = await listCustomRoles(interaction.guildId);
      const lines = all.map((r) => `<@${r.id}> → <@&${r.roleId}>`);
      return interaction.reply(infoCard(`Custom roles (${all.length})`, lines.join('\n') || '*None yet.*'));
    }

    if (sub === 'reset') {
      const { allowed } = await checkAuthorization(interaction.member, 'admin');
      if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need admin authority for this.'), ephemeral: true });

      const all = await listCustomRoles(interaction.guildId);
      for (const entry of all) {
        const role = await interaction.guild.roles.fetch(entry.roleId).catch(() => null);
        if (role) await role.delete('Custom role reset').catch(() => {});
      }
      await resetCustomRoles(interaction.guildId);
      return interaction.reply(successCard('Reset complete', `Removed ${all.length} custom role(s).`));
    }

    if (sub === 'config') {
      const reqRoles = await getReqRoles(interaction.guildId);
      const all = await listCustomRoles(interaction.guildId);
      return interaction.reply(
        infoCard('Custom role configuration', `**Total custom roles:** ${all.length}\n**Required roles:** ${reqRoles.roles.map((id) => `<@&${id}>`).join(', ') || 'None (open to everyone)'}`),
      );
    }
  },
};
