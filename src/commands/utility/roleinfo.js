const { SlashCommandBuilder } = require('discord.js');
const { infoCard } = require('../../ui/cards');

module.exports = {
  category: 'utility',
  data: new SlashCommandBuilder()
    .setName('roleinfo')
    .setDescription('View information about a role')
    .addRoleOption((o) => o.setName('role').setDescription('Role').setRequired(true)),

  async execute(interaction) {
    const role = interaction.options.getRole('role');
    const lines = [
      `**Name:** ${role.name}`,
      `**ID:** ${role.id}`,
      `**Color:** ${role.hexColor}`,
      `**Position:** ${role.position}`,
      `**Members:** ${role.members.size}`,
      `**Mentionable:** ${role.mentionable}`,
      `**Hoisted:** ${role.hoist}`,
      `**Created:** <t:${Math.floor(role.createdTimestamp / 1000)}:R>`,
    ];
    return interaction.reply(infoCard(`@${role.name}`, lines.join('\n')));
  },
};
