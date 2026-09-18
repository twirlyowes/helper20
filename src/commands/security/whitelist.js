const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkAuthorization } = require('../../utils/permissions');
const { addWhitelist, removeWhitelist, resetWhitelist, getSecurity } = require('../../database/security');
const { successCard, errorCard, infoCard } = require('../../ui/cards');

// whitelist / unwhitelist / whitelisted / whitelistreset are four separate top-level
// commands in the spec; they're kept in one file since they all share the same tiny
// security-whitelist DB module and auth pattern.

const whitelist = {
  category: 'security',
  data: new SlashCommandBuilder()
    .setName('whitelist')
    .setDescription('Add a user or role to the security/automod whitelist')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addMentionableOption((o) => o.setName('target').setDescription('User or role to whitelist').setRequired(true)),

  async execute(interaction) {
    const { allowed } = await checkAuthorization(interaction.member, 'admin');
    if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need admin authority to manage the whitelist.'), ephemeral: true });

    const target = interaction.options.getMentionable('target');
    await addWhitelist(interaction.guildId, target.id);
    return interaction.reply(successCard('Whitelisted', `${target} is now exempt from automod and antinuke.`));
  },
};

const unwhitelist = {
  category: 'security',
  data: new SlashCommandBuilder()
    .setName('unwhitelist')
    .setDescription('Remove a user or role from the security/automod whitelist')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addMentionableOption((o) => o.setName('target').setDescription('User or role to remove').setRequired(true)),

  async execute(interaction) {
    const { allowed } = await checkAuthorization(interaction.member, 'admin');
    if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need admin authority to manage the whitelist.'), ephemeral: true });

    const target = interaction.options.getMentionable('target');
    await removeWhitelist(interaction.guildId, target.id);
    return interaction.reply(successCard('Removed from whitelist', `${target} is no longer exempt from automod/antinuke.`));
  },
};

const whitelisted = {
  category: 'security',
  data: new SlashCommandBuilder()
    .setName('whitelisted')
    .setDescription('List all whitelisted users/roles')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const { allowed } = await checkAuthorization(interaction.member, 'mod');
    if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need moderator authority to view the whitelist.'), ephemeral: true });

    const sec = await getSecurity(interaction.guildId);
    const list = sec.whitelist.length ? sec.whitelist.map((id) => `<@${id}> / <@&${id}>`).join('\n') : '*Nothing is whitelisted.*';
    return interaction.reply(infoCard('Whitelist', list));
  },
};

const whitelistreset = {
  category: 'security',
  data: new SlashCommandBuilder()
    .setName('whitelistreset')
    .setDescription('Clear the entire whitelist')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const { allowed } = await checkAuthorization(interaction.member, 'admin');
    if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need admin authority to reset the whitelist.'), ephemeral: true });

    await resetWhitelist(interaction.guildId);
    return interaction.reply(successCard('Whitelist reset', 'The whitelist has been cleared.'));
  },
};

module.exports = [whitelist, unwhitelist, whitelisted, whitelistreset];
