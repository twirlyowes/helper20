const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkAuthorization } = require('../../utils/permissions');
const { successCard, errorCard } = require('../../ui/cards');

module.exports = {
  category: 'moderation',
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Set slowmode for this channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption((o) => o.setName('seconds').setDescription('Slowmode duration in seconds (0 to disable)').setRequired(true).setMinValue(0).setMaxValue(21600)),

  async execute(interaction) {
    const { allowed } = await checkAuthorization(interaction.member, 'mod');
    if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need moderator authority to set slowmode.'), ephemeral: true });

    const seconds = interaction.options.getInteger('seconds');
    await interaction.channel.setRateLimitPerUser(seconds, `Set by ${interaction.user.tag}`);
    return interaction.reply(
      successCard('Slowmode updated', seconds === 0 ? 'Slowmode has been disabled.' : `Slowmode set to **${seconds}s** in this channel.`),
    );
  },

  async legacyArgs(args) {
    return { seconds: args[0] };
  },
};
