const { SlashCommandBuilder } = require('discord.js');
const { buildHomeCard, routeHelpComponent } = require('../../ui/helpUI');

module.exports = {
  category: 'utility',
  data: new SlashCommandBuilder().setName('help').setDescription('Browse all commands by category'),

  async execute(interaction, client) {
    return interaction.reply(buildHomeCard(client));
  },

  components: {
    help: async (interaction, client) => {
      const payload = routeHelpComponent(client, interaction);
      if (!payload) return interaction.update({ content: 'Closed.', embeds: [], components: [] });
      if (interaction.isStringSelectMenu?.()) return interaction.update(payload);
      return interaction.update(payload);
    },
  },
};
