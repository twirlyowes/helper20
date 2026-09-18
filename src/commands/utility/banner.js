const { SlashCommandBuilder } = require('discord.js');
const { infoCard, errorCard } = require('../../ui/cards');

module.exports = {
  category: 'utility',
  data: new SlashCommandBuilder()
    .setName('banner')
    .setDescription('View a user\'s or the server\'s banner')
    .addSubcommand((sc) => sc.setName('user').setDescription('View a user\'s banner').addUserOption((o) => o.setName('user').setDescription('User (defaults to you)')))
    .addSubcommand((sc) => sc.setName('server').setDescription('View the server\'s banner')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'user') {
      const target = interaction.options.getUser('user') || interaction.user;
      const fetched = await interaction.client.users.fetch(target.id, { force: true });
      const url = fetched.bannerURL({ size: 512 });
      if (!url) return interaction.reply({ ...errorCard('No banner', `${target} does not have a banner set.`), ephemeral: true });
      return interaction.reply(infoCard(`${target.username}'s banner`, '', { thumbnail: url }));
    }

    if (sub === 'server') {
      const url = interaction.guild.bannerURL({ size: 512 });
      if (!url) return interaction.reply({ ...errorCard('No banner', 'This server does not have a banner set.'), ephemeral: true });
      return interaction.reply(infoCard(`${interaction.guild.name}'s banner`, '', { thumbnail: url }));
    }
  },
};
