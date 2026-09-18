const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkAuthorization } = require('../../utils/permissions');
const {
  addMainRole, removeMainRole, resetMainRoles,
  addModRole, removeModRole, resetModRoles,
  getSecurity,
} = require('../../database/security');
const { successCard, errorCard, infoCard } = require('../../ui/cards');

// mainrole and modrole are kept together since both just manage a role-ID list on the
// same security config doc with near-identical add/remove/list/reset shapes.

const mainrole = {
  category: 'security',
  data: new SlashCommandBuilder()
    .setName('mainrole')
    .setDescription('Manage roles treated as admin-equivalent')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sc) => sc.setName('add').setDescription('Add a main role').addRoleOption((o) => o.setName('role').setDescription('Role to add').setRequired(true)))
    .addSubcommand((sc) => sc.setName('remove').setDescription('Remove a main role').addRoleOption((o) => o.setName('role').setDescription('Role to remove').setRequired(true)))
    .addSubcommand((sc) => sc.setName('list').setDescription('List main roles'))
    .addSubcommand((sc) => sc.setName('reset').setDescription('Remove all main roles')),

  async execute(interaction) {
    const { allowed } = await checkAuthorization(interaction.member, 'owner');
    if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'Only the owner or extra owners can manage main roles.'), ephemeral: true });

    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      const role = interaction.options.getRole('role');
      await addMainRole(interaction.guildId, role.id);
      return interaction.reply(successCard('Main role added', `${role} now grants admin authority.`));
    }
    if (sub === 'remove') {
      const role = interaction.options.getRole('role');
      await removeMainRole(interaction.guildId, role.id);
      return interaction.reply(successCard('Main role removed', `${role} no longer grants admin authority.`));
    }
    if (sub === 'list') {
      const sec = await getSecurity(interaction.guildId);
      const list = sec.mainRoles.length ? sec.mainRoles.map((id) => `<@&${id}>`).join('\n') : '*None configured.*';
      return interaction.reply(infoCard('Main roles', list));
    }
    if (sub === 'reset') {
      await resetMainRoles(interaction.guildId);
      return interaction.reply(successCard('Reset complete', 'All main roles have been removed.'));
    }
  },
};

const modrole = {
  category: 'security',
  data: new SlashCommandBuilder()
    .setName('modrole')
    .setDescription('Manage roles treated as moderator-equivalent')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sc) => sc.setName('add').setDescription('Add a mod role').addRoleOption((o) => o.setName('role').setDescription('Role to add').setRequired(true)))
    .addSubcommand((sc) => sc.setName('set').setDescription('Replace all mod roles with one role').addRoleOption((o) => o.setName('role').setDescription('Role to set').setRequired(true)))
    .addSubcommand((sc) => sc.setName('remove').setDescription('Remove a mod role').addRoleOption((o) => o.setName('role').setDescription('Role to remove').setRequired(true)))
    .addSubcommand((sc) => sc.setName('edit').setDescription('Replace one mod role with another').addRoleOption((o) => o.setName('remove').setDescription('Role to remove').setRequired(true)).addRoleOption((o) => o.setName('add').setDescription('Role to add').setRequired(true)))
    .addSubcommand((sc) => sc.setName('view').setDescription('View mod roles'))
    .addSubcommand((sc) => sc.setName('list').setDescription('List mod roles'))
    .addSubcommand((sc) => sc.setName('reset').setDescription('Remove all mod roles')),

  async execute(interaction) {
    const { allowed } = await checkAuthorization(interaction.member, 'admin');
    if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need admin authority to manage mod roles.'), ephemeral: true });

    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      const role = interaction.options.getRole('role');
      await addModRole(interaction.guildId, role.id);
      return interaction.reply(successCard('Mod role added', `${role} now grants moderator authority.`));
    }
    if (sub === 'set') {
      const role = interaction.options.getRole('role');
      await resetModRoles(interaction.guildId);
      await addModRole(interaction.guildId, role.id);
      return interaction.reply(successCard('Mod role set', `${role} is now the only mod role.`));
    }
    if (sub === 'remove') {
      const role = interaction.options.getRole('role');
      await removeModRole(interaction.guildId, role.id);
      return interaction.reply(successCard('Mod role removed', `${role} no longer grants moderator authority.`));
    }
    if (sub === 'edit') {
      const remove = interaction.options.getRole('remove');
      const add = interaction.options.getRole('add');
      await removeModRole(interaction.guildId, remove.id);
      await addModRole(interaction.guildId, add.id);
      return interaction.reply(successCard('Mod roles updated', `Removed ${remove}, added ${add}.`));
    }
    if (sub === 'view' || sub === 'list') {
      const sec = await getSecurity(interaction.guildId);
      const list = sec.modRoles.length ? sec.modRoles.map((id) => `<@&${id}>`).join('\n') : '*None configured.*';
      return interaction.reply(infoCard('Mod roles', list));
    }
    if (sub === 'reset') {
      await resetModRoles(interaction.guildId);
      return interaction.reply(successCard('Reset complete', 'All mod roles have been removed.'));
    }
  },
};

module.exports = [mainrole, modrole];
