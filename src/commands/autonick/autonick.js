const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkAuthorization } = require('../../utils/permissions');
const { getAutonick, setAutonick, resetAutonick } = require('../../database/autonick');
const { successCard, errorCard, infoCard } = require('../../ui/cards');

module.exports = {
  category: 'autonick',
  data: new SlashCommandBuilder()
    .setName('autonick')
    .setDescription('Automatically set nicknames for new members')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
    .addSubcommand((sc) =>
      sc
        .setName('setup')
        .setDescription('Enable and configure autonick')
        .addStringOption((o) => o.setName('pattern').setDescription('Pattern, e.g. "{username}" or "New | {username}"').setRequired(true))
        .addBooleanOption((o) => o.setName('strip_special_chars').setDescription('Strip special characters from the username')),
    )
    .addSubcommand((sc) => sc.setName('config').setDescription('View autonick configuration'))
    .addSubcommand((sc) => sc.setName('reset').setDescription('Disable and reset autonick')),

  async execute(interaction) {
    const { allowed } = await checkAuthorization(interaction.member, 'admin');
    if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need admin authority to configure autonick.'), ephemeral: true });

    const sub = interaction.options.getSubcommand();

    if (sub === 'setup') {
      const pattern = interaction.options.getString('pattern');
      const stripSpecialChars = interaction.options.getBoolean('strip_special_chars') ?? false;
      await setAutonick(interaction.guildId, { enabled: true, pattern, stripSpecialChars });
      return interaction.reply(successCard('Autonick enabled', `New members will be nicknamed using pattern: \`${pattern}\``));
    }

    if (sub === 'config') {
      const cfg = await getAutonick(interaction.guildId);
      return interaction.reply(infoCard('Autonick configuration', `**Enabled:** ${cfg.enabled}\n**Pattern:** \`${cfg.pattern}\`\n**Strip special chars:** ${cfg.stripSpecialChars}`));
    }

    if (sub === 'reset') {
      await resetAutonick(interaction.guildId);
      return interaction.reply(successCard('Autonick reset', 'Autonick has been disabled and reset to defaults.'));
    }
  },
};
