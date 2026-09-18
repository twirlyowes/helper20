const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { infoCard } = require('../../ui/cards');

module.exports = {
  category: 'utility',
  data: new SlashCommandBuilder()
    .setName('channelinfo')
    .setDescription('View information about a channel')
    .addChannelOption((o) => o.setName('channel').setDescription('Channel (defaults to this one)')),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const lines = [
      `**Name:** ${channel.name}`,
      `**Type:** ${ChannelType[channel.type] || channel.type}`,
      `**ID:** ${channel.id}`,
      `**Created:** <t:${Math.floor(channel.createdTimestamp / 1000)}:R>`,
    ];
    if ('topic' in channel && channel.topic) lines.push(`**Topic:** ${channel.topic}`);
    if ('rateLimitPerUser' in channel) lines.push(`**Slowmode:** ${channel.rateLimitPerUser}s`);
    return interaction.reply(infoCard(`#${channel.name}`, lines.join('\n')));
  },
};
