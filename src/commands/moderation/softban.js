const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkAuthorization, checkHierarchy } = require('../../utils/permissions');
const { sanitizeReason } = require('../../utils/validation');
const { successCard, errorCard } = require('../../ui/cards');
const { sendLog } = require('../../utils/sendLog');

module.exports = {
  category: 'moderation',
  data: new SlashCommandBuilder()
    .setName('softban')
    .setDescription('Ban then immediately unban a member, purging their recent messages')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((o) => o.setName('user').setDescription('User to softban').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason for the softban')),

  async execute(interaction) {
    const { allowed } = await checkAuthorization(interaction.member, 'mod');
    if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need moderator authority to softban members.'), ephemeral: true });

    const user = interaction.options.getUser('user');
    const reason = sanitizeReason(interaction.options.getString('reason'));
    const targetMember = await interaction.guild.members.fetch(user.id).catch(() => null);
    const hierarchyError = checkHierarchy({ guild: interaction.guild, actingMember: interaction.member, targetMember });
    if (hierarchyError) return interaction.reply({ ...errorCard('Cannot softban', hierarchyError), ephemeral: true });

    await interaction.guild.members.ban(user.id, { deleteMessageSeconds: 86400, reason: `Softban: ${reason}` });
    await interaction.guild.members.unban(user.id, 'Softban - auto unban');
    await sendLog(interaction.guild, 'modlog', 'Member softbanned', `${user.tag} was softbanned by ${interaction.user} for: ${reason}`);
    return interaction.reply(successCard('Member softbanned', `${user.tag} has been softbanned (messages purged, not permanently banned).`));
  },
};
