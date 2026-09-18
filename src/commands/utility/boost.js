const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { checkAuthorization } = require('../../utils/permissions');
const { successCard, errorCard, infoCard } = require('../../ui/cards');
const { setDoc } = require('../../database/guildConfig');

const DEFAULTS = { channelId: null, message: '{user} just boosted the server! Thank you 🚀' };

const setboost = {
  category: 'utility',
  data: new SlashCommandBuilder()
    .setName('setboost')
    .setDescription('Configure boost announcement channel/message')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((o) => o.setName('channel').setDescription('Announcement channel').addChannelTypes(ChannelType.GuildText).setRequired(true))
    .addStringOption((o) => o.setName('message').setDescription('Message ({user} placeholder supported)')),

  async execute(interaction) {
    const { allowed } = await checkAuthorization(interaction.member, 'admin');
    if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need admin authority to configure boost announcements.'), ephemeral: true });

    const channel = interaction.options.getChannel('channel');
    const message = interaction.options.getString('message') || DEFAULTS.message;
    await setDoc(interaction.guildId, 'boost', { channelId: channel.id, message });
    return interaction.reply(successCard('Boost announcements configured', `Boosts will be announced in ${channel}.`));
  },
};

const boostcount = {
  category: 'utility',
  data: new SlashCommandBuilder().setName('boostcount').setDescription('View the server\'s boost count'),

  async execute(interaction) {
    const guild = interaction.guild;
    return interaction.reply(infoCard('Boost status', `**Boost level:** ${guild.premiumTier}\n**Boosts:** ${guild.premiumSubscriptionCount || 0}`));
  },
};

module.exports = [setboost, boostcount];
