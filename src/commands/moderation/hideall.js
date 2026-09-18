const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { checkAuthorization } = require('../../utils/permissions');
const { successCard, errorCard } = require('../../ui/cards');
const { sendLog } = require('../../utils/sendLog');

// Single-channel hide/unhide were dropped: already covered by Pixel Villa Support's
// .hide/.unhide. Only the mass (all-channels) versions are new here.

const hideall = {
  category: 'moderation',
  data: new SlashCommandBuilder()
    .setName('hideall')
    .setDescription('Hide all text channels from @everyone')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const { allowed } = await checkAuthorization(interaction.member, 'admin');
    if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need admin authority for this.'), ephemeral: true });

    await interaction.deferReply();
    const channels = interaction.guild.channels.cache.filter((c) => c.type === ChannelType.GuildText);
    let count = 0;
    for (const [, channel] of channels) {
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: false }, { reason: `Hideall by ${interaction.user.tag}` }).catch(() => {});
      count += 1;
    }
    await sendLog(interaction.guild, 'serverlog', 'Server hidden', `${interaction.user} hid ${count} channels.`);
    return interaction.editReply(successCard('Server hidden', `Hid **${count}** text channels from @everyone.`));
  },
};

const unhideall = {
  category: 'moderation',
  data: new SlashCommandBuilder()
    .setName('unhideall')
    .setDescription('Unhide all text channels for @everyone')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const { allowed } = await checkAuthorization(interaction.member, 'admin');
    if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need admin authority for this.'), ephemeral: true });

    await interaction.deferReply();
    const channels = interaction.guild.channels.cache.filter((c) => c.type === ChannelType.GuildText);
    let count = 0;
    for (const [, channel] of channels) {
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: null }, { reason: `Unhideall by ${interaction.user.tag}` }).catch(() => {});
      count += 1;
    }
    await sendLog(interaction.guild, 'serverlog', 'Server unhidden', `${interaction.user} unhid ${count} channels.`);
    return interaction.editReply(successCard('Server unhidden', `Unhid **${count}** text channels for @everyone.`));
  },
};

module.exports = [hideall, unhideall];
