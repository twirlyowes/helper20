const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { checkAuthorization } = require('../../utils/permissions');
const { successCard, errorCard } = require('../../ui/cards');
const { sendLog } = require('../../utils/sendLog');

const lockall = {
  category: 'moderation',
  data: new SlashCommandBuilder()
    .setName('lockall')
    .setDescription('Lock all text channels (deny Send Messages for @everyone)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const { allowed } = await checkAuthorization(interaction.member, 'admin');
    if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need admin authority for this.'), ephemeral: true });

    await interaction.deferReply();
    const channels = interaction.guild.channels.cache.filter((c) => c.type === ChannelType.GuildText);
    let count = 0;
    for (const [, channel] of channels) {
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false }, { reason: `Lockall by ${interaction.user.tag}` }).catch(() => {});
      count += 1;
    }
    await sendLog(interaction.guild, 'serverlog', 'Server locked', `${interaction.user} locked ${count} channels.`);
    return interaction.editReply(successCard('Server locked', `Locked **${count}** text channels.`));
  },
};

const unlockall = {
  category: 'moderation',
  data: new SlashCommandBuilder()
    .setName('unlockall')
    .setDescription('Unlock all text channels')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const { allowed } = await checkAuthorization(interaction.member, 'admin');
    if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need admin authority for this.'), ephemeral: true });

    await interaction.deferReply();
    const channels = interaction.guild.channels.cache.filter((c) => c.type === ChannelType.GuildText);
    let count = 0;
    for (const [, channel] of channels) {
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null }, { reason: `Unlockall by ${interaction.user.tag}` }).catch(() => {});
      count += 1;
    }
    await sendLog(interaction.guild, 'serverlog', 'Server unlocked', `${interaction.user} unlocked ${count} channels.`);
    return interaction.editReply(successCard('Server unlocked', `Unlocked **${count}** text channels.`));
  },
};

module.exports = [lockall, unlockall];
