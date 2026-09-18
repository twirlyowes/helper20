const { SlashCommandBuilder, PermissionFlagsBits, UserFlagsBitField } = require('discord.js');
const { checkAuthorization } = require('../../utils/permissions');
const { getSecurity } = require('../../database/security');
const { infoCard, errorCard } = require('../../ui/cards');

const MAX_LINES = 40;

function truncate(lines) {
  if (lines.length <= MAX_LINES) return lines.join('\n') || '*None found.*';
  return `${lines.slice(0, MAX_LINES).join('\n')}\n*...and ${lines.length - MAX_LINES} more*`;
}

module.exports = {
  category: 'moderation',
  data: new SlashCommandBuilder()
    .setName('list')
    .setDescription('List various server data')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sc) => sc.setName('joinpos').setDescription('Get a member\'s join position').addUserOption((o) => o.setName('user').setDescription('User').setRequired(true)))
    .addSubcommand((sc) => sc.setName('muted').setDescription('List currently timed-out members'))
    .addSubcommand((sc) => sc.setName('noroles').setDescription('List members with no roles'))
    .addSubcommand((sc) => sc.setName('roles').setDescription('List all server roles'))
    .addSubcommand((sc) => sc.setName('admin').setDescription('List configured admins'))
    .addSubcommand((sc) => sc.setName('mod').setDescription('List configured moderators'))
    .addSubcommand((sc) => sc.setName('bot').setDescription('List bot members'))
    .addSubcommand((sc) => sc.setName('inrole').setDescription('List members with a role').addRoleOption((o) => o.setName('role').setDescription('Role').setRequired(true)))
    .addSubcommand((sc) => sc.setName('booster').setDescription('List server boosters'))
    .addSubcommand((sc) => sc.setName('bans').setDescription('List banned users'))
    .addSubcommand((sc) => sc.setName('emojis').setDescription('List server emojis'))
    .addSubcommand((sc) => sc.setName('channels').setDescription('List server channels'))
    .addSubcommand((sc) => sc.setName('activedeveloper').setDescription('List members with the Active Developer badge'))
    .addSubcommand((sc) => sc.setName('earlysupporter').setDescription('List members with the Early Supporter badge')),

  async execute(interaction) {
    const { allowed } = await checkAuthorization(interaction.member, 'mod');
    if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need moderator authority for this.'), ephemeral: true });

    const sub = interaction.options.getSubcommand();
    await interaction.deferReply();

    if (sub === 'joinpos') {
      const user = interaction.options.getUser('user');
      const members = (await interaction.guild.members.fetch()).sort((a, b) => a.joinedTimestamp - b.joinedTimestamp);
      const arr = [...members.values()];
      const index = arr.findIndex((m) => m.id === user.id);
      if (index === -1) return interaction.editReply(errorCard('Not found', 'That user is not in this server.'));
      return interaction.editReply(infoCard('Join position', `${user} was the **#${index + 1}** member to join out of ${arr.length}.`));
    }

    if (sub === 'muted') {
      const members = await interaction.guild.members.fetch();
      const muted = members.filter((m) => m.communicationDisabledUntilTimestamp && m.communicationDisabledUntilTimestamp > Date.now());
      return interaction.editReply(infoCard(`Muted members (${muted.size})`, truncate([...muted.values()].map((m) => `${m}`))));
    }

    if (sub === 'noroles') {
      const members = await interaction.guild.members.fetch();
      const noRoles = members.filter((m) => m.roles.cache.size === 1);
      return interaction.editReply(infoCard(`No-role members (${noRoles.size})`, truncate([...noRoles.values()].map((m) => `${m}`))));
    }

    if (sub === 'roles') {
      const roles = interaction.guild.roles.cache.filter((r) => r.id !== interaction.guild.id).sort((a, b) => b.position - a.position);
      return interaction.editReply(infoCard(`Roles (${roles.size})`, truncate([...roles.values()].map((r) => `${r}`))));
    }

    if (sub === 'admin') {
      const sec = await getSecurity(interaction.guildId);
      return interaction.editReply(infoCard(`Admins (${sec.admins.length})`, truncate(sec.admins.map((id) => `<@${id}>`))));
    }

    if (sub === 'mod') {
      const sec = await getSecurity(interaction.guildId);
      return interaction.editReply(infoCard(`Mod roles (${sec.modRoles.length})`, truncate(sec.modRoles.map((id) => `<@&${id}>`))));
    }

    if (sub === 'bot') {
      const members = await interaction.guild.members.fetch();
      const bots = members.filter((m) => m.user.bot);
      return interaction.editReply(infoCard(`Bots (${bots.size})`, truncate([...bots.values()].map((m) => `${m}`))));
    }

    if (sub === 'inrole') {
      const role = interaction.options.getRole('role');
      const members = await interaction.guild.members.fetch();
      const inRole = members.filter((m) => m.roles.cache.has(role.id));
      return interaction.editReply(infoCard(`Members with ${role.name} (${inRole.size})`, truncate([...inRole.values()].map((m) => `${m}`))));
    }

    if (sub === 'booster') {
      const members = await interaction.guild.members.fetch();
      const boosters = members.filter((m) => m.premiumSince);
      return interaction.editReply(infoCard(`Boosters (${boosters.size})`, truncate([...boosters.values()].map((m) => `${m}`))));
    }

    if (sub === 'bans') {
      const bans = await interaction.guild.bans.fetch();
      return interaction.editReply(infoCard(`Banned users (${bans.size})`, truncate([...bans.values()].map((b) => `${b.user.tag} (${b.user.id})`))));
    }

    if (sub === 'emojis') {
      const emojis = interaction.guild.emojis.cache;
      return interaction.editReply(infoCard(`Emojis (${emojis.size})`, truncate([...emojis.values()].map((e) => `${e} \`:${e.name}:\``))));
    }

    if (sub === 'channels') {
      const channels = interaction.guild.channels.cache;
      return interaction.editReply(infoCard(`Channels (${channels.size})`, truncate([...channels.values()].map((c) => `${c}`))));
    }

    if (sub === 'activedeveloper') {
      const members = await interaction.guild.members.fetch();
      const flagged = members.filter((m) => m.user.flags?.has(UserFlagsBitField.Flags.ActiveDeveloper));
      return interaction.editReply(infoCard(`Active Developer badge (${flagged.size})`, truncate([...flagged.values()].map((m) => `${m}`))));
    }

    if (sub === 'earlysupporter') {
      const members = await interaction.guild.members.fetch();
      const flagged = members.filter((m) => m.user.flags?.has(UserFlagsBitField.Flags.PremiumEarlySupporter));
      return interaction.editReply(infoCard(`Early Supporter badge (${flagged.size})`, truncate([...flagged.values()].map((m) => `${m}`))));
    }
  },
};
