const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkAuthorization } = require('../../utils/permissions');
const { successCard, errorCard } = require('../../ui/cards');

module.exports = {
  category: 'utility',
  data: new SlashCommandBuilder()
    .setName('steal')
    .setDescription('Add an emoji from another server (by image URL) to this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuildExpressions)
    .addStringOption((o) => o.setName('image_url').setDescription('Direct emoji image URL').setRequired(true))
    .addStringOption((o) => o.setName('name').setDescription('Name for the new emoji').setRequired(true)),

  async execute(interaction) {
    const { allowed } = await checkAuthorization(interaction.member, 'mod');
    if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need moderator authority to add emojis.'), ephemeral: true });

    const imageUrl = interaction.options.getString('image_url');
    const name = interaction.options.getString('name').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 32);

    try {
      const emoji = await interaction.guild.emojis.create({ attachment: imageUrl, name, reason: `Stolen by ${interaction.user.tag}` });
      return interaction.reply(successCard('Emoji added', `Added ${emoji} as \`:${emoji.name}:\``));
    } catch (err) {
      return interaction.reply({ ...errorCard('Failed to add emoji', 'That image could not be added as an emoji (check the URL, size, and format).'), ephemeral: true });
    }
  },
};
