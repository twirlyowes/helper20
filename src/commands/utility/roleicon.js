const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkAuthorization } = require('../../utils/permissions');
const { successCard, errorCard } = require('../../ui/cards');

module.exports = {
  category: 'utility',
  data: new SlashCommandBuilder()
    .setName('roleicon')
    .setDescription('Set a role\'s icon')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addRoleOption((o) => o.setName('role').setDescription('Role').setRequired(true))
    .addAttachmentOption((o) => o.setName('icon').setDescription('Icon image').setRequired(true)),

  async execute(interaction) {
    const { allowed } = await checkAuthorization(interaction.member, 'mod');
    if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need moderator authority to set role icons.'), ephemeral: true });

    const role = interaction.options.getRole('role');
    const icon = interaction.options.getAttachment('icon');

    if (!interaction.guild.features.includes('ROLE_ICONS')) {
      return interaction.reply({ ...errorCard('Not available', 'This server does not have role icons unlocked (requires a boost level).'), ephemeral: true });
    }

    await role.setIcon(icon.url, `Set by ${interaction.user.tag}`).catch((err) => {
      throw err;
    });
    return interaction.reply(successCard('Role icon updated', `Updated the icon for ${role}.`));
  },
};
