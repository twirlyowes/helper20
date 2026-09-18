const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { checkAuthorization } = require('../../utils/permissions');
const {
  createSelfrolePanel, listSelfrolePanels, getSelfrolePanel,
  updateSelfrolePanel, deleteSelfrolePanel, resetSelfrolePanels,
} = require('../../database/selfrole');
const { successCard, errorCard, infoCard } = require('../../ui/cards');
const { selectMenu } = require('../../ui/menus');

module.exports = {
  category: 'selfrole',
  data: new SlashCommandBuilder()
    .setName('selfrole')
    .setDescription('Self-assignable role panels')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand((sc) =>
      sc
        .setName('setup')
        .setDescription('Create a self-role panel with up to 5 roles')
        .addChannelOption((o) => o.setName('channel').setDescription('Channel to post in').addChannelTypes(ChannelType.GuildText).setRequired(true))
        .addStringOption((o) => o.setName('title').setDescription('Panel title').setRequired(true))
        .addRoleOption((o) => o.setName('role1').setDescription('Role 1').setRequired(true))
        .addRoleOption((o) => o.setName('role2').setDescription('Role 2'))
        .addRoleOption((o) => o.setName('role3').setDescription('Role 3'))
        .addRoleOption((o) => o.setName('role4').setDescription('Role 4'))
        .addRoleOption((o) => o.setName('role5').setDescription('Role 5')),
    )
    .addSubcommand((sc) => sc.setName('list').setDescription('List self-role panels'))
    .addSubcommand((sc) => sc.setName('delete').setDescription('Delete a panel').addStringOption((o) => o.setName('id').setDescription('Panel ID').setRequired(true)))
    .addSubcommand((sc) => sc.setName('reset').setDescription('Delete all self-role panels'))
    .addSubcommand((sc) => sc.setName('cleanup').setDescription('Remove roles from the panel that no longer exist'))
    .addSubcommand((sc) =>
      sc
        .setName('edit')
        .setDescription('Add a role to an existing panel')
        .addStringOption((o) => o.setName('id').setDescription('Panel ID').setRequired(true))
        .addRoleOption((o) => o.setName('role').setDescription('Role to add').setRequired(true)),
    ),

  async execute(interaction) {
    const { allowed } = await checkAuthorization(interaction.member, 'admin');
    if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need admin authority to manage self-roles.'), ephemeral: true });

    const sub = interaction.options.getSubcommand();

    if (sub === 'setup') {
      const channel = interaction.options.getChannel('channel');
      const title = interaction.options.getString('title');
      const roles = [1, 2, 3, 4, 5]
        .map((n) => interaction.options.getRole(`role${n}`))
        .filter(Boolean)
        .map((r) => ({ id: r.id, name: r.name }));

      const panel = await createSelfrolePanel(interaction.guildId, { title, roleIds: roles.map((r) => r.id) });

      const menu = selectMenu({
        customId: `selfrole:pick:${panel.id}`,
        placeholder: 'Select roles to toggle',
        options: roles.map((r) => ({ label: r.name, value: r.id })),
        minValues: 0,
        maxValues: roles.length,
      });

      const sent = await channel.send(infoCard(title, 'Select a role below to add or remove it.', { rows: [menu] }));
      const { updateSelfrolePanel: update } = require('../../database/selfrole');
      await update(interaction.guildId, panel.id, { messageId: sent.id });

      return interaction.reply(successCard('Self-role panel created', `Posted in ${channel}. ID: \`${panel.id}\``));
    }

    if (sub === 'list') {
      const panels = await listSelfrolePanels(interaction.guildId);
      const lines = panels.map((p) => `\`${p.id}\` — ${p.title} (${p.roleIds.length} roles)`);
      return interaction.reply(infoCard(`Self-role panels (${panels.length})`, lines.join('\n') || '*None yet.*'));
    }

    if (sub === 'delete') {
      const id = interaction.options.getString('id');
      await deleteSelfrolePanel(interaction.guildId, id);
      return interaction.reply(successCard('Panel deleted', `Deleted panel \`${id}\`.`));
    }

    if (sub === 'reset') {
      await resetSelfrolePanels(interaction.guildId);
      return interaction.reply(successCard('Reset complete', 'All self-role panels deleted.'));
    }

    if (sub === 'cleanup') {
      const panels = await listSelfrolePanels(interaction.guildId);
      let cleaned = 0;
      for (const panel of panels) {
        const valid = panel.roleIds.filter((id) => interaction.guild.roles.cache.has(id));
        if (valid.length !== panel.roleIds.length) {
          await updateSelfrolePanel(interaction.guildId, panel.id, { roleIds: valid });
          cleaned += 1;
        }
      }
      return interaction.reply(successCard('Cleanup complete', `Cleaned up ${cleaned} panel(s) with deleted roles.`));
    }

    if (sub === 'edit') {
      const id = interaction.options.getString('id');
      const role = interaction.options.getRole('role');
      const panel = await getSelfrolePanel(interaction.guildId, id);
      if (!panel) return interaction.reply({ ...errorCard('Not found', 'No panel with that ID.'), ephemeral: true });

      const roleIds = panel.roleIds.includes(role.id) ? panel.roleIds : [...panel.roleIds, role.id];
      await updateSelfrolePanel(interaction.guildId, id, { roleIds });
      return interaction.reply(successCard('Panel updated', `Added ${role} to panel \`${id}\`.`));
    }
  },

  components: {
    selfrole: async (interaction) => {
      const [, action, panelId] = interaction.customId.split(':');
      if (action !== 'pick') return;

      const selectedIds = interaction.values;
      const panel = await getSelfrolePanel(interaction.guildId, panelId);
      if (!panel) return interaction.reply({ ...errorCard('Panel missing', 'This self-role panel no longer exists.'), ephemeral: true });

      const member = interaction.member;
      const toAdd = selectedIds.filter((id) => !member.roles.cache.has(id));
      const toRemove = panel.roleIds.filter((id) => !selectedIds.includes(id) && member.roles.cache.has(id));

      if (toAdd.length) await member.roles.add(toAdd).catch(() => {});
      if (toRemove.length) await member.roles.remove(toRemove).catch(() => {});

      return interaction.reply({ ...successCard('Roles updated', 'Your roles have been updated.'), ephemeral: true });
    },
  },
};
