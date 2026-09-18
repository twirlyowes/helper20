const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { checkAuthorization } = require('../../utils/permissions');
const { getWelcome, setWelcome, resetWelcome } = require('../../database/welcome');
const { successCard, errorCard, infoCard } = require('../../ui/cards');

module.exports = {
  category: 'welcomer',
  data: new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Configure welcome messages')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sc) =>
      sc
        .setName('setup')
        .setDescription('Set up welcome messages')
        .addChannelOption((o) => o.setName('channel').setDescription('Welcome channel').addChannelTypes(ChannelType.GuildText).setRequired(true))
        .addStringOption((o) => o.setName('message').setDescription('Message ({user}, {username}, {server}, {count} supported)')),
    )
    .addSubcommand((sc) => sc.setName('test').setDescription('Preview the welcome message'))
    .addSubcommand((sc) => sc.setName('delete').setDescription('Disable welcome messages'))
    .addSubcommand((sc) => sc.setName('list').setDescription('View current welcome configuration'))
    .addSubcommand((sc) => sc.setName('keyword').setDescription('Set a keyword users must send to be considered welcomed (optional)').addStringOption((o) => o.setName('word').setDescription('Keyword (leave empty to clear)')))
    .addSubcommand((sc) => sc.setName('reset').setDescription('Reset welcome configuration to defaults'))
    .addSubcommand((sc) => sc.setName('edit').setDescription('Edit the welcome message text').addStringOption((o) => o.setName('message').setDescription('New message').setRequired(true))),

  async execute(interaction) {
    const { allowed } = await checkAuthorization(interaction.member, 'admin');
    if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need admin authority to configure welcome messages.'), ephemeral: true });

    const sub = interaction.options.getSubcommand();

    if (sub === 'setup') {
      const channel = interaction.options.getChannel('channel');
      const message = interaction.options.getString('message');
      const patch = { enabled: true, channelId: channel.id };
      if (message) patch.message = message;
      await setWelcome(interaction.guildId, patch);
      return interaction.reply(successCard('Welcome configured', `Welcome messages will post in ${channel}.`));
    }

    if (sub === 'test') {
      const welcome = await getWelcome(interaction.guildId);
      const preview = welcome.message
        .replace(/{user}/g, `${interaction.user}`)
        .replace(/{username}/g, interaction.user.username)
        .replace(/{server}/g, interaction.guild.name)
        .replace(/{count}/g, interaction.guild.memberCount);
      return interaction.reply(infoCard('Welcome preview', preview));
    }

    if (sub === 'delete') {
      await setWelcome(interaction.guildId, { enabled: false });
      return interaction.reply(successCard('Welcome disabled', 'Welcome messages have been turned off.'));
    }

    if (sub === 'list') {
      const welcome = await getWelcome(interaction.guildId);
      return interaction.reply(
        infoCard('Welcome configuration', `**Enabled:** ${welcome.enabled}\n**Channel:** ${welcome.channelId ? `<#${welcome.channelId}>` : 'Not set'}\n**Keyword:** ${welcome.keyword || 'None'}\n**Message:** ${welcome.message}`),
      );
    }

    if (sub === 'keyword') {
      const word = interaction.options.getString('word');
      await setWelcome(interaction.guildId, { keyword: word || null });
      return interaction.reply(successCard('Keyword updated', word ? `New members must say \`${word}\` to be considered welcomed.` : 'Keyword requirement cleared.'));
    }

    if (sub === 'reset') {
      await resetWelcome(interaction.guildId);
      return interaction.reply(successCard('Welcome reset', 'Welcome configuration has been reset to defaults.'));
    }

    if (sub === 'edit') {
      const message = interaction.options.getString('message');
      await setWelcome(interaction.guildId, { message });
      return interaction.reply(successCard('Message updated', 'Welcome message text has been updated.'));
    }
  },
};
