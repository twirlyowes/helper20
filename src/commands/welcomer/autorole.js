const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkAuthorization } = require('../../utils/permissions');
const {
  getAutorole,
  addAutoroleHuman, removeAutoroleHuman, resetAutoroleHumans,
  addAutoroleBot, removeAutoroleBot, resetAutoroleBots,
} = require('../../database/welcome');
const { successCard, errorCard, infoCard } = require('../../ui/cards');

module.exports = {
  category: 'welcomer',
  data: new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('Configure roles automatically given to new members')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommandGroup((g) =>
      g
        .setName('humans')
        .setDescription('Autorole for human members')
        .addSubcommand((sc) => sc.setName('add').setDescription('Add a role').addRoleOption((o) => o.setName('role').setDescription('Role').setRequired(true)))
        .addSubcommand((sc) => sc.setName('remove').setDescription('Remove a role').addRoleOption((o) => o.setName('role').setDescription('Role').setRequired(true)))
        .addSubcommand((sc) => sc.setName('list').setDescription('List human autoroles'))
        .addSubcommand((sc) => sc.setName('reset').setDescription('Clear human autoroles')),
    )
    .addSubcommandGroup((g) =>
      g
        .setName('bots')
        .setDescription('Autorole for bot members')
        .addSubcommand((sc) => sc.setName('add').setDescription('Add a role').addRoleOption((o) => o.setName('role').setDescription('Role').setRequired(true)))
        .addSubcommand((sc) => sc.setName('remove').setDescription('Remove a role').addRoleOption((o) => o.setName('role').setDescription('Role').setRequired(true)))
        .addSubcommand((sc) => sc.setName('list').setDescription('List bot autoroles'))
        .addSubcommand((sc) => sc.setName('reset').setDescription('Clear bot autoroles')),
    ),

  async execute(interaction) {
    const { allowed } = await checkAuthorization(interaction.member, 'admin');
    if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need admin authority to configure autorole.'), ephemeral: true });

    const group = interaction.options.getSubcommandGroup(true);
    const sub = interaction.options.getSubcommand();

    if (group === 'humans') {
      if (sub === 'add') {
        const role = interaction.options.getRole('role');
        await addAutoroleHuman(interaction.guildId, role.id);
        return interaction.reply(successCard('Autorole added', `${role} will now be given to new human members.`));
      }
      if (sub === 'remove') {
        const role = interaction.options.getRole('role');
        await removeAutoroleHuman(interaction.guildId, role.id);
        return interaction.reply(successCard('Autorole removed', `${role} will no longer be auto-assigned.`));
      }
      if (sub === 'list') {
        const cfg = await getAutorole(interaction.guildId);
        return interaction.reply(infoCard('Human autoroles', cfg.humans.map((id) => `<@&${id}>`).join('\n') || '*None*'));
      }
      if (sub === 'reset') {
        await resetAutoroleHumans(interaction.guildId);
        return interaction.reply(successCard('Reset complete', 'Human autoroles cleared.'));
      }
    }

    if (group === 'bots') {
      if (sub === 'add') {
        const role = interaction.options.getRole('role');
        await addAutoroleBot(interaction.guildId, role.id);
        return interaction.reply(successCard('Autorole added', `${role} will now be given to new bots.`));
      }
      if (sub === 'remove') {
        const role = interaction.options.getRole('role');
        await removeAutoroleBot(interaction.guildId, role.id);
        return interaction.reply(successCard('Autorole removed', `${role} will no longer be auto-assigned.`));
      }
      if (sub === 'list') {
        const cfg = await getAutorole(interaction.guildId);
        return interaction.reply(infoCard('Bot autoroles', cfg.bots.map((id) => `<@&${id}>`).join('\n') || '*None*'));
      }
      if (sub === 'reset') {
        await resetAutoroleBots(interaction.guildId);
        return interaction.reply(successCard('Reset complete', 'Bot autoroles cleared.'));
      }
    }
  },
};
