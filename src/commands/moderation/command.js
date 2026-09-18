const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkAuthorization } = require('../../utils/permissions');
const {
  getCommandConfig, setCommandDisabled,
  addBypassRole, removeBypassRole, resetBypassRoles,
  addBypassUser, removeBypassUser, resetBypassUsers,
  resetCommandConfig,
} = require('../../database/moderation');
const { successCard, errorCard, infoCard } = require('../../ui/cards');

module.exports = {
  category: 'moderation',
  data: new SlashCommandBuilder()
    .setName('command')
    .setDescription('Enable/disable commands and manage per-command bypass lists')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sc) =>
      sc
        .setName('config')
        .setDescription('Enable or disable a command')
        .addStringOption((o) => o.setName('command_name').setDescription('Command name (without /)').setRequired(true))
        .addBooleanOption((o) => o.setName('disabled').setDescription('True to disable, false to re-enable').setRequired(true)),
    )
    .addSubcommand((sc) => sc.setName('reset').setDescription('Reset all command enable/disable + bypass config'))
    .addSubcommandGroup((g) =>
      g
        .setName('bypassrole')
        .setDescription('Manage roles that bypass a disabled command')
        .addSubcommand((sc) => sc.setName('add').setDescription('Add a bypass role').addStringOption((o) => o.setName('command_name').setDescription('Command name').setRequired(true)).addRoleOption((o) => o.setName('role').setDescription('Role').setRequired(true)))
        .addSubcommand((sc) => sc.setName('remove').setDescription('Remove a bypass role').addStringOption((o) => o.setName('command_name').setDescription('Command name').setRequired(true)).addRoleOption((o) => o.setName('role').setDescription('Role').setRequired(true)))
        .addSubcommand((sc) => sc.setName('list').setDescription('List bypass roles').addStringOption((o) => o.setName('command_name').setDescription('Command name').setRequired(true)))
        .addSubcommand((sc) => sc.setName('reset').setDescription('Clear bypass roles').addStringOption((o) => o.setName('command_name').setDescription('Command name').setRequired(true))),
    )
    .addSubcommandGroup((g) =>
      g
        .setName('bypassuser')
        .setDescription('Manage users that bypass a disabled command')
        .addSubcommand((sc) => sc.setName('add').setDescription('Add a bypass user').addStringOption((o) => o.setName('command_name').setDescription('Command name').setRequired(true)).addUserOption((o) => o.setName('user').setDescription('User').setRequired(true)))
        .addSubcommand((sc) => sc.setName('remove').setDescription('Remove a bypass user').addStringOption((o) => o.setName('command_name').setDescription('Command name').setRequired(true)).addUserOption((o) => o.setName('user').setDescription('User').setRequired(true)))
        .addSubcommand((sc) => sc.setName('list').setDescription('List bypass users').addStringOption((o) => o.setName('command_name').setDescription('Command name').setRequired(true)))
        .addSubcommand((sc) => sc.setName('reset').setDescription('Clear bypass users').addStringOption((o) => o.setName('command_name').setDescription('Command name').setRequired(true))),
    ),

  async execute(interaction, client) {
    const { allowed } = await checkAuthorization(interaction.member, 'admin');
    if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need admin authority to manage commands.'), ephemeral: true });

    const group = interaction.options.getSubcommandGroup(false);
    const sub = interaction.options.getSubcommand();
    const commandName = interaction.options.getString('command_name');

    if (commandName && !client.commands.has(commandName)) {
      return interaction.reply({ ...errorCard('Unknown command', `No command named \`${commandName}\` exists.`), ephemeral: true });
    }

    if (!group && sub === 'config') {
      const disabled = interaction.options.getBoolean('disabled');
      await setCommandDisabled(interaction.guildId, commandName, disabled);
      return interaction.reply(successCard('Command updated', `\`/${commandName}\` is now **${disabled ? 'disabled' : 'enabled'}**.`));
    }

    if (!group && sub === 'reset') {
      await resetCommandConfig(interaction.guildId);
      return interaction.reply(successCard('Reset complete', 'All command config and bypass lists have been cleared.'));
    }

    if (group === 'bypassrole') {
      const role = interaction.options.getRole('role');
      if (sub === 'add') {
        await addBypassRole(interaction.guildId, commandName, role.id);
        return interaction.reply(successCard('Bypass role added', `${role} can now bypass \`/${commandName}\` being disabled.`));
      }
      if (sub === 'remove') {
        await removeBypassRole(interaction.guildId, commandName, role.id);
        return interaction.reply(successCard('Bypass role removed', `${role} can no longer bypass \`/${commandName}\`.`));
      }
      if (sub === 'list') {
        const cfg = await getCommandConfig(interaction.guildId);
        const list = cfg.bypassRoles[commandName] || [];
        return interaction.reply(infoCard(`Bypass roles for /${commandName}`, list.map((id) => `<@&${id}>`).join('\n') || '*None*'));
      }
      if (sub === 'reset') {
        await resetBypassRoles(interaction.guildId, commandName);
        return interaction.reply(successCard('Reset complete', `Bypass roles for \`/${commandName}\` cleared.`));
      }
    }

    if (group === 'bypassuser') {
      const user = interaction.options.getUser('user');
      if (sub === 'add') {
        await addBypassUser(interaction.guildId, commandName, user.id);
        return interaction.reply(successCard('Bypass user added', `${user} can now bypass \`/${commandName}\` being disabled.`));
      }
      if (sub === 'remove') {
        await removeBypassUser(interaction.guildId, commandName, user.id);
        return interaction.reply(successCard('Bypass user removed', `${user} can no longer bypass \`/${commandName}\`.`));
      }
      if (sub === 'list') {
        const cfg = await getCommandConfig(interaction.guildId);
        const list = cfg.bypassUsers[commandName] || [];
        return interaction.reply(infoCard(`Bypass users for /${commandName}`, list.map((id) => `<@${id}>`).join('\n') || '*None*'));
      }
      if (sub === 'reset') {
        await resetBypassUsers(interaction.guildId, commandName);
        return interaction.reply(successCard('Reset complete', `Bypass users for \`/${commandName}\` cleared.`));
      }
    }
  },
};
