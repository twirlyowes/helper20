const { SlashCommandBuilder } = require('discord.js');
const { infoCard } = require('../../ui/cards');

module.exports = {
  category: 'utility',
  data: new SlashCommandBuilder().setName('vote').setDescription('Get the bot\'s voting/listing link'),

  async execute(interaction) {
    return interaction.reply(
      infoCard('Vote for us!', 'Voting links aren\'t configured yet — an admin can wire this up to your bot-list page of choice (top.gg, discordbotlist.com, etc.) once the bot is listed.'),
    );
  },
};
