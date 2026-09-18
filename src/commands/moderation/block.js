const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkAuthorization, checkHierarchy } = require('../../utils/permissions');
const { successCard, errorCard } = require('../../ui/cards');

const block = {
  category: 'moderation',
  data: new SlashCommandBuilder()
    .setName('block')
    .setDescription('Block a member from viewing/sending in this channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addUserOption((o) => o.setName('user').setDescription('User to block').setRequired(true)),

  async execute(interaction) {
    const { allowed } = await checkAuthorization(interaction.member, 'mod');
    if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need moderator authority to block members.'), ephemeral: true });

    const user = interaction.options.getUser('user');
    const targetMember = await interaction.guild.members.fetch(user.id).catch(() => null);
    const hierarchyError = checkHierarchy({ guild: interaction.guild, actingMember: interaction.member, targetMember });
    if (hierarchyError) return interaction.reply({ ...errorCard('Cannot block', hierarchyError), ephemeral: true });

    await interaction.channel.permissionOverwrites.edit(user.id, { SendMessages: false, ViewChannel: false }, { reason: `Blocked by ${interaction.user.tag}` });
    return interaction.reply(successCard('Member blocked', `${user} has been blocked from ${interaction.channel}.`));
  },
};

const unblock = {
  category: 'moderation',
  data: new SlashCommandBuilder()
    .setName('unblock')
    .setDescription('Unblock a member from this channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addUserOption((o) => o.setName('user').setDescription('User to unblock').setRequired(true)),

  async execute(interaction) {
    const { allowed } = await checkAuthorization(interaction.member, 'mod');
    if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need moderator authority to unblock members.'), ephemeral: true });

    const user = interaction.options.getUser('user');
    await interaction.channel.permissionOverwrites.delete(user.id, `Unblocked by ${interaction.user.tag}`);
    return interaction.reply(successCard('Member unblocked', `${user} has been unblocked from ${interaction.channel}.`));
  },
};

module.exports = [block, unblock];
