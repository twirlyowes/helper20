const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkAuthorization } = require('../../utils/permissions');
const { getPrefix, setPrefix } = require('../../database/moderation');
const { DEFAULT_PREFIX } = require('../../config/constants');
const { successCard, errorCard, infoCard } = require('../../ui/cards');

module.exports = {
  category: 'moderation',
  data: new SlashCommandBuilder()
    .setName('prefix')
    .setDescription('View or change this server\'s text-command prefix')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((o) => o.setName('new_prefix').setDescription('New prefix (leave empty to view current)').setMaxLength(5)),

  async execute(interaction) {
    const newPrefix = interaction.options.getString('new_prefix');

    if (!newPrefix) {
      const current = (await getPrefix(interaction.guildId)) || DEFAULT_PREFIX;
      return interaction.reply(infoCard('Current prefix', `The prefix in this server is \`${current}\``));
    }

    const { allowed } = await checkAuthorization(interaction.member, 'admin');
    if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need admin authority to change the prefix.'), ephemeral: true });

    await setPrefix(interaction.guildId, newPrefix);
    return interaction.reply(successCard('Prefix updated', `The prefix is now \`${newPrefix}\``));
  },

  // Maps ".prefix" and ".prefix !" style invocations onto the same execute() logic above.
  async legacyArgs(args) {
    return { new_prefix: args[0] || null };
  },
};
