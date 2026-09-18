const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { infoCard, errorCard } = require('../../ui/cards');

module.exports = {
  category: 'utility',
  data: new SlashCommandBuilder().setName('invite').setDescription('Create an invite link for this server'),

  async execute(interaction) {
    if (!interaction.channel.permissionsFor(interaction.member).has(PermissionFlagsBits.CreateInstantInvite)) {
      return interaction.reply({ ...errorCard('Not authorized', 'You do not have permission to create invites here.'), ephemeral: true });
    }
    const invite = await interaction.channel.createInvite({ maxAge: 86400, maxUses: 0, reason: `Requested by ${interaction.user.tag}` });
    return interaction.reply(infoCard('Invite created', `https://discord.gg/${invite.code} (expires in 24h)`));
  },
};
