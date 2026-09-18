const { SlashCommandBuilder } = require('discord.js');
const { infoCard } = require('../../ui/cards');

module.exports = {
  category: 'utility',
  data: new SlashCommandBuilder().setName('membercount').setDescription('View the server\'s member count'),

  async execute(interaction) {
    const guild = interaction.guild;
    const humans = guild.members.cache.filter((m) => !m.user.bot).size;
    const bots = guild.members.cache.filter((m) => m.user.bot).size;
    return interaction.reply(infoCard(`${guild.name} member count`, `**Total:** ${guild.memberCount}\n**Humans:** ${humans}\n**Bots:** ${bots}`));
  },
};
