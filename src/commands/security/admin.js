const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkAuthorization } = require('../../utils/permissions');
const { addAdmin, removeAdmin, resetAdmins, addExtraOwner, removeExtraOwner, resetExtraOwners, getSecurity } = require('../../database/security');
const { successCard, errorCard, infoCard } = require('../../ui/cards');

const admin = {
  category: 'security',
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Manage server admins')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sc) => sc.setName('add').setDescription('Add an admin').addUserOption((o) => o.setName('user').setDescription('User to add').setRequired(true)))
    .addSubcommand((sc) => sc.setName('remove').setDescription('Remove an admin').addUserOption((o) => o.setName('user').setDescription('User to remove').setRequired(true)))
    .addSubcommand((sc) => sc.setName('edit').setDescription('Replace the admin list with a new user').addUserOption((o) => o.setName('remove').setDescription('User to remove').setRequired(true)).addUserOption((o) => o.setName('add').setDescription('User to add').setRequired(true)))
    .addSubcommand((sc) => sc.setName('list').setDescription('List all admins'))
    .addSubcommand((sc) => sc.setName('reset').setDescription('Remove all admins'))
    .addSubcommand((sc) => sc.setName('cleanup').setDescription('Remove admins who left the server')),

  async execute(interaction) {
    const { allowed } = await checkAuthorization(interaction.member, 'owner');
    if (!allowed) {
      return interaction.reply({ ...errorCard('Not authorized', 'Only the owner or extra owners can manage admins.'), ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      const user = interaction.options.getUser('user');
      await addAdmin(interaction.guildId, user.id);
      return interaction.reply(successCard('Admin added', `${user} is now an admin.`));
    }

    if (sub === 'remove') {
      const user = interaction.options.getUser('user');
      await removeAdmin(interaction.guildId, user.id);
      return interaction.reply(successCard('Admin removed', `${user} is no longer an admin.`));
    }

    if (sub === 'edit') {
      const remove = interaction.options.getUser('remove');
      const add = interaction.options.getUser('add');
      await removeAdmin(interaction.guildId, remove.id);
      await addAdmin(interaction.guildId, add.id);
      return interaction.reply(successCard('Admins updated', `Removed ${remove}, added ${add}.`));
    }

    if (sub === 'list') {
      const sec = await getSecurity(interaction.guildId);
      const list = sec.admins.length ? sec.admins.map((id) => `<@${id}>`).join('\n') : '*No admins configured.*';
      return interaction.reply(infoCard('Admins', list));
    }

    if (sub === 'reset') {
      await resetAdmins(interaction.guildId);
      return interaction.reply(successCard('Admins reset', 'All admins have been removed.'));
    }

    if (sub === 'cleanup') {
      const sec = await getSecurity(interaction.guildId);
      let removed = 0;
      for (const id of sec.admins) {
        const member = await interaction.guild.members.fetch(id).catch(() => null);
        if (!member) {
          await removeAdmin(interaction.guildId, id);
          removed += 1;
        }
      }
      return interaction.reply(successCard('Cleanup complete', `Removed ${removed} admin(s) who left the server.`));
    }
  },
};

const extraowner = {
  category: 'security',
  data: new SlashCommandBuilder()
    .setName('extraowner')
    .setDescription('Manage extra owners')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sc) => sc.setName('add').setDescription('Add an extra owner').addUserOption((o) => o.setName('user').setDescription('User to add').setRequired(true)))
    .addSubcommand((sc) => sc.setName('remove').setDescription('Remove an extra owner').addUserOption((o) => o.setName('user').setDescription('User to remove').setRequired(true)))
    .addSubcommand((sc) => sc.setName('list').setDescription('List extra owners'))
    .addSubcommand((sc) => sc.setName('reset').setDescription('Remove all extra owners')),

  async execute(interaction) {
    const { allowed } = await checkAuthorization(interaction.member, 'owner');
    if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'Only the server owner can manage extra owners.'), ephemeral: true });

    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      const user = interaction.options.getUser('user');
      await addExtraOwner(interaction.guildId, user.id);
      return interaction.reply(successCard('Extra owner added', `${user} now has owner-level authority.`));
    }
    if (sub === 'remove') {
      const user = interaction.options.getUser('user');
      await removeExtraOwner(interaction.guildId, user.id);
      return interaction.reply(successCard('Extra owner removed', `${user} no longer has owner-level authority.`));
    }
    if (sub === 'list') {
      const sec = await getSecurity(interaction.guildId);
      const list = sec.extraOwners.length ? sec.extraOwners.map((id) => `<@${id}>`).join('\n') : '*None configured.*';
      return interaction.reply(infoCard('Extra owners', list));
    }
    if (sub === 'reset') {
      await resetExtraOwners(interaction.guildId);
      return interaction.reply(successCard('Reset complete', 'All extra owners have been removed.'));
    }
  },
};

module.exports = [admin, extraowner];
