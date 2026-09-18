const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkAuthorization } = require('../../utils/permissions');
const { successCard, errorCard, infoCard } = require('../../ui/cards');
const { sendLog } = require('../../utils/sendLog');

// Tracks in-progress mass role operations per guild so they can be cancelled.
const activeOps = new Map(); // guildId -> { cancelled: boolean, processed: number, total: number, type: string }

// role.js is mass role operations only. The single-member "role @user [role]" toggle
// was dropped: already covered by Pixel Villa Support's .role command.

module.exports = {
  category: 'moderation',
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Mass role operations (add a role to many members at once)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand((sc) => sc.setName('all').setDescription('Add a role to every member').addRoleOption((o) => o.setName('role').setDescription('Role to add').setRequired(true)))
    .addSubcommand((sc) => sc.setName('humans').setDescription('Add a role to every human member').addRoleOption((o) => o.setName('role').setDescription('Role to add').setRequired(true)))
    .addSubcommand((sc) => sc.setName('bots').setDescription('Add a role to every bot member').addRoleOption((o) => o.setName('role').setDescription('Role to add').setRequired(true)))
    .addSubcommand((sc) => sc.setName('cancel').setDescription('Cancel the currently running mass role operation'))
    .addSubcommand((sc) => sc.setName('status').setDescription('View progress of the current mass role operation')),

  async execute(interaction) {
    const { allowed } = await checkAuthorization(interaction.member, 'mod');
    if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need moderator authority to manage roles.'), ephemeral: true });

    const sub = interaction.options.getSubcommand();

    if (sub === 'cancel') {
      const op = activeOps.get(interaction.guildId);
      if (!op) return interaction.reply({ ...errorCard('Nothing running', 'There is no mass role operation in progress.'), ephemeral: true });
      op.cancelled = true;
      return interaction.reply(successCard('Cancelling', `The ${op.type} operation will stop after the current member.`));
    }

    if (sub === 'status') {
      const op = activeOps.get(interaction.guildId);
      if (!op) return interaction.reply(infoCard('No operation running', 'There is no mass role operation in progress.'));
      return interaction.reply(infoCard('Operation status', `**Type:** ${op.type}\n**Progress:** ${op.processed}/${op.total}`));
    }

    // all / humans / bots
    if (activeOps.has(interaction.guildId)) {
      return interaction.reply({ ...errorCard('Already running', 'A mass role operation is already in progress. Use `/role status` or `/role cancel`.'), ephemeral: true });
    }

    const role = interaction.options.getRole('role');
    await interaction.deferReply();

    const members = await interaction.guild.members.fetch();
    const targets = members.filter((m) => {
      if (sub === 'humans') return !m.user.bot;
      if (sub === 'bots') return m.user.bot;
      return true;
    });

    const op = { cancelled: false, processed: 0, total: targets.size, type: sub };
    activeOps.set(interaction.guildId, op);

    for (const [, member] of targets) {
      if (op.cancelled) break;
      await member.roles.add(role, `Mass role (${sub}) by ${interaction.user.tag}`).catch(() => {});
      op.processed += 1;
    }

    activeOps.delete(interaction.guildId);
    await sendLog(interaction.guild, 'rolelog', 'Mass role assignment', `${interaction.user} added ${role} to ${op.processed}/${op.total} (${sub}) members.`);
    return interaction.editReply(
      successCard(op.cancelled ? 'Operation cancelled' : 'Operation complete', `Added ${role} to **${op.processed}/${op.total}** members${op.cancelled ? ' (cancelled early)' : ''}.`),
    );
  },
};
