const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { checkAuthorization } = require('../../utils/permissions');
const { createInfoboard, listInfoboards, getInfoboard, deleteInfoboard } = require('../../database/infoboard');
const { successCard, errorCard, infoCard } = require('../../ui/cards');

module.exports = {
  category: 'utility',
  data: new SlashCommandBuilder()
    .setName('infoboard')
    .setDescription('Create persistent info boards')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sc) =>
      sc
        .setName('create')
        .setDescription('Create an info board')
        .addChannelOption((o) => o.setName('channel').setDescription('Channel to post in').addChannelTypes(ChannelType.GuildText).setRequired(true))
        .addStringOption((o) => o.setName('title').setDescription('Board title').setRequired(true))
        .addStringOption((o) => o.setName('content').setDescription('Board content').setRequired(true)),
    )
    .addSubcommand((sc) => sc.setName('delete').setDescription('Delete an info board').addStringOption((o) => o.setName('id').setDescription('Board ID').setRequired(true)))
    .addSubcommand((sc) => sc.setName('list').setDescription('List all info boards'))
    .addSubcommand((sc) => sc.setName('resend').setDescription('Resend (repost) an info board').addStringOption((o) => o.setName('id').setDescription('Board ID').setRequired(true))),

  async execute(interaction) {
    const { allowed } = await checkAuthorization(interaction.member, 'admin');
    if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need admin authority to manage info boards.'), ephemeral: true });

    const sub = interaction.options.getSubcommand();

    if (sub === 'create') {
      const channel = interaction.options.getChannel('channel');
      const title = interaction.options.getString('title');
      const content = interaction.options.getString('content');
      const sent = await channel.send(infoCard(title, content));
      const board = await createInfoboard(interaction.guildId, { channelId: channel.id, messageId: sent.id, title, content });
      return interaction.reply(successCard('Info board created', `Posted in ${channel}. ID: \`${board.id}\``));
    }

    if (sub === 'delete') {
      const id = interaction.options.getString('id');
      const board = await getInfoboard(interaction.guildId, id);
      if (!board) return interaction.reply({ ...errorCard('Not found', 'No info board with that ID.'), ephemeral: true });

      const channel = await interaction.guild.channels.fetch(board.channelId).catch(() => null);
      if (channel) {
        const msg = await channel.messages.fetch(board.messageId).catch(() => null);
        if (msg) await msg.delete().catch(() => {});
      }
      await deleteInfoboard(interaction.guildId, id);
      return interaction.reply(successCard('Info board deleted', `Deleted board \`${id}\`.`));
    }

    if (sub === 'list') {
      const boards = await listInfoboards(interaction.guildId);
      const lines = boards.map((b) => `\`${b.id}\` — ${b.title} in <#${b.channelId}>`);
      return interaction.reply(infoCard(`Info boards (${boards.length})`, lines.join('\n') || '*None yet.*'));
    }

    if (sub === 'resend') {
      const id = interaction.options.getString('id');
      const board = await getInfoboard(interaction.guildId, id);
      if (!board) return interaction.reply({ ...errorCard('Not found', 'No info board with that ID.'), ephemeral: true });

      const channel = await interaction.guild.channels.fetch(board.channelId).catch(() => null);
      if (!channel) return interaction.reply({ ...errorCard('Channel missing', 'The original channel no longer exists.'), ephemeral: true });

      const oldMsg = await channel.messages.fetch(board.messageId).catch(() => null);
      if (oldMsg) await oldMsg.delete().catch(() => {});

      const sent = await channel.send(infoCard(board.title, board.content));
      const { updateInfoboard } = require('../../database/infoboard');
      await updateInfoboard(interaction.guildId, id, { messageId: sent.id });
      return interaction.reply(successCard('Info board resent', `Reposted board \`${id}\`.`));
    }
  },
};
