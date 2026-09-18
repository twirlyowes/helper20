const { SlashCommandBuilder } = require('discord.js');
const { infoCard, errorCard } = require('../../ui/cards');
const { getGuildIconURL } = require('../../ui/avatars');

module.exports = {
  category: 'utility',
  data: new SlashCommandBuilder().setName('servericon').setDescription('View the server\'s icon'),

  async execute(interaction) {
    const url = getGuildIconURL(interaction.guild, 512);
    if (!url) return interaction.reply({ ...errorCard('No icon', 'This server does not have an icon set.'), ephemeral: true });
    return interaction.reply(infoCard(`${interaction.guild.name}'s icon`, '', { thumbnail: url }));
  },
};
