const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkAuthorization } = require('../../utils/permissions');
const { successCard, errorCard, buildCard } = require('../../ui/cards');
const { confirmRow } = require('../../ui/buttons');
const { sendLog } = require('../../utils/sendLog');
const { EMOJIS } = require('../../config/constants');
const COLORS = require('../../ui/colors');

const unbanall = {
  category: 'moderation',
  data: new SlashCommandBuilder()
    .setName('unbanall')
    .setDescription('Unban every currently banned user')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const { allowed } = await checkAuthorization(interaction.member, 'admin');
    if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need admin authority for this.'), ephemeral: true });

    const bans = await interaction.guild.bans.fetch();
    if (bans.size === 0) return interaction.reply({ ...errorCard('Nothing to do', 'There are no banned users.'), ephemeral: true });

    await interaction.reply({
      ...errorCard('Confirm mass unban', `This will unban **${bans.size}** users. This cannot be undone.`, {
        rows: [confirmRow('unbanall:confirm', 'unbanall:cancel')],
      }),
    });
  },

  components: {
    unbanall: async (interaction) => {
      const [, action] = interaction.customId.split(':');
      if (action === 'cancel') return interaction.update({ ...successCard('Cancelled', 'Mass unban cancelled.'), components: [] });

      await interaction.update({
        ...buildCard({ title: `${EMOJIS.LOADING} Working...`, description: 'Unbanning all users, this may take a moment.', color: COLORS.PRIMARY }),
        components: [],
      });
      const bans = await interaction.guild.bans.fetch();
      let count = 0;
      for (const [, ban] of bans) {
        await interaction.guild.members.unban(ban.user.id, `Mass unban by ${interaction.user.tag}`).catch(() => {});
        count += 1;
      }
      await sendLog(interaction.guild, 'modlog', 'Mass unban', `${interaction.user} unbanned ${count} users.`);
      await interaction.editReply(successCard('Unban complete', `Unbanned **${count}** users.`));
    },
  },
};

const unmuteall = {
  category: 'moderation',
  data: new SlashCommandBuilder()
    .setName('unmuteall')
    .setDescription('Remove timeout from every currently timed-out member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const { allowed } = await checkAuthorization(interaction.member, 'admin');
    if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need admin authority for this.'), ephemeral: true });

    await interaction.deferReply();
    const members = await interaction.guild.members.fetch();
    const timedOut = members.filter((m) => m.communicationDisabledUntilTimestamp && m.communicationDisabledUntilTimestamp > Date.now());

    let count = 0;
    for (const [, member] of timedOut) {
      await member.timeout(null, `Unmuteall by ${interaction.user.tag}`).catch(() => {});
      count += 1;
    }
    await sendLog(interaction.guild, 'modlog', 'Mass unmute', `${interaction.user} removed timeout from ${count} members.`);
    return interaction.editReply(successCard('Unmute complete', `Removed timeout from **${count}** members.`));
  },
};

module.exports = [unbanall, unmuteall];
