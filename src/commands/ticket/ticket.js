const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, PermissionsBitField } = require('discord.js');
const { checkAuthorization } = require('../../utils/permissions');
const {
  createPanel, listPanels, getPanel, deletePanel, resetPanels,
  createTicket, getOpenTicketForUser, getTicketByChannel, closeTicket, listOpenTickets,
} = require('../../database/tickets');
const { successCard, errorCard, infoCard, buildCard } = require('../../ui/cards');
const { button, row } = require('../../ui/buttons');
const { EMOJIS } = require('../../config/constants');
const COLORS = require('../../ui/colors');
const { ButtonStyle } = require('discord.js');
const { sendLog } = require('../../utils/sendLog');

module.exports = {
  category: 'ticket',
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Support ticket system')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommandGroup((g) =>
      g
        .setName('panel')
        .setDescription('Manage ticket panels')
        .addSubcommand((sc) =>
          sc
            .setName('setup')
            .setDescription('Post a new ticket panel')
            .addChannelOption((o) => o.setName('channel').setDescription('Channel to post in').addChannelTypes(ChannelType.GuildText).setRequired(true))
            .addStringOption((o) => o.setName('title').setDescription('Panel title').setRequired(true))
            .addStringOption((o) => o.setName('description').setDescription('Panel description').setRequired(true))
            .addChannelOption((o) => o.setName('category').setDescription('Category tickets are created under').addChannelTypes(ChannelType.GuildCategory))
            .addRoleOption((o) => o.setName('support_role').setDescription('Role that can see/manage tickets')),
        )
        .addSubcommand((sc) => sc.setName('list').setDescription('List ticket panels'))
        .addSubcommand((sc) => sc.setName('reset').setDescription('Delete all ticket panels'))
        .addSubcommand((sc) => sc.setName('status').setDescription('View open ticket count')),
    ),

  async execute(interaction) {
    const { allowed } = await checkAuthorization(interaction.member, 'admin');
    if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need admin authority to manage tickets.'), ephemeral: true });

    const sub = interaction.options.getSubcommand();

    if (sub === 'setup') {
      const channel = interaction.options.getChannel('channel');
      const title = interaction.options.getString('title');
      const description = interaction.options.getString('description');
      const category = interaction.options.getChannel('category');
      const supportRole = interaction.options.getRole('support_role');

      const panel = await createPanel(interaction.guildId, {
        title,
        description,
        channelId: channel.id,
        categoryId: category?.id || null,
        supportRoleId: supportRole?.id || null,
      });

      const openRow = row(button({ customId: `ticket:open:${panel.id}`, label: 'Open Ticket', style: ButtonStyle.Primary, emoji: '🎫' }));
      const sent = await channel.send({ ...infoCard(title, description, { rows: [openRow] }) });

      const { collection } = require('../../database/guildConfig');
      await collection(interaction.guildId, 'ticketPanels').doc(panel.id).update({ messageId: sent.id });

      return interaction.reply(successCard('Panel created', `Ticket panel posted in ${channel}. ID: \`${panel.id}\``));
    }

    if (sub === 'list') {
      const panels = await listPanels(interaction.guildId);
      const lines = panels.map((p) => `\`${p.id}\` — ${p.title} in <#${p.channelId}>`);
      return interaction.reply(infoCard(`Ticket panels (${panels.length})`, lines.join('\n') || '*None yet.*'));
    }

    if (sub === 'reset') {
      await resetPanels(interaction.guildId);
      return interaction.reply(successCard('Reset complete', 'All ticket panels have been deleted.'));
    }

    if (sub === 'status') {
      const open = await listOpenTickets(interaction.guildId);
      return interaction.reply(infoCard('Ticket status', `**Open tickets:** ${open.length}`));
    }
  },

  components: {
    ticket: async (interaction) => {
      const [, action, panelId] = interaction.customId.split(':');

      if (action === 'open') {
        const panel = await getPanel(interaction.guildId, panelId);
        if (!panel) return interaction.reply({ ...errorCard('Panel missing', 'This ticket panel no longer exists.'), ephemeral: true });

        const existing = await getOpenTicketForUser(interaction.guildId, interaction.user.id, panelId);
        if (existing) {
          return interaction.reply({ ...errorCard('Ticket already open', `You already have an open ticket: <#${existing.channelId}>`), ephemeral: true });
        }

        const overwrites = [
          { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
          { id: interaction.client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
        ];
        if (panel.supportRoleId) {
          overwrites.push({ id: panel.supportRoleId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] });
        }

        const channel = await interaction.guild.channels.create({
          name: `ticket-${interaction.user.username}`.slice(0, 90),
          type: ChannelType.GuildText,
          parent: panel.categoryId || undefined,
          permissionOverwrites: overwrites,
        });

        const ticket = await createTicket(interaction.guildId, { userId: interaction.user.id, panelId, channelId: channel.id });
        const closeRow = row(button({ customId: `ticket:close:${ticket.ticketId}`, label: 'Close Ticket', style: ButtonStyle.Danger, emoji: EMOJIS.LOCK }));
        await channel.send({ ...infoCard('Ticket opened', `${interaction.user}, a staff member will be with you shortly.`, { rows: [closeRow] }) });

        await sendLog(interaction.guild, 'modlog', 'Ticket opened', `${interaction.user} opened a ticket: ${channel}`);
        return interaction.reply({ ...successCard('Ticket created', `Your ticket: ${channel}`), ephemeral: true });
      }

      if (action === 'close') {
        const ticket = await getTicketByChannel(interaction.guildId, interaction.channel.id);
        if (!ticket) return interaction.reply({ ...errorCard('Not a ticket', 'This does not look like an active ticket channel.'), ephemeral: true });

        await closeTicket(interaction.guildId, ticket.ticketId);
        await interaction.reply(
          buildCard({ title: `${EMOJIS.LOADING} Closing ticket`, description: 'This ticket will be deleted in 5 seconds.', color: COLORS.PRIMARY }),
        );
        await sendLog(interaction.guild, 'modlog', 'Ticket closed', `${interaction.user} closed ticket in ${interaction.channel}`);
        setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
      }
    },
  },
};
