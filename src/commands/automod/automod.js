const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkAuthorization } = require('../../utils/permissions');
const { getAutomod, setModule } = require('../../database/automod');
const { successCard, errorCard, infoCard } = require('../../ui/cards');

module.exports = {
  category: 'automod',
  data: new SlashCommandBuilder()
    .setName('automod')
    .setDescription('Configure automod protections')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommandGroup((g) =>
      g
        .setName('antispam')
        .setDescription('Anti-spam settings')
        .addSubcommand((sc) =>
          sc
            .setName('setup')
            .setDescription('Configure anti-spam')
            .addBooleanOption((o) => o.setName('enabled').setDescription('Enable anti-spam').setRequired(true))
            .addIntegerOption((o) => o.setName('max_messages').setDescription('Max messages per interval'))
            .addIntegerOption((o) => o.setName('interval_ms').setDescription('Interval in milliseconds'))
            .addIntegerOption((o) => o.setName('timeout_ms').setDescription('Timeout duration in milliseconds')),
        ),
    )
    .addSubcommandGroup((g) =>
      g
        .setName('antilink')
        .setDescription('Anti-link settings')
        .addSubcommand((sc) =>
          sc
            .setName('setup')
            .setDescription('Configure anti-link')
            .addBooleanOption((o) => o.setName('enabled').setDescription('Enable anti-link').setRequired(true))
            .addStringOption((o) => o.setName('whitelist_domains').setDescription('Comma-separated allowed domains')),
        ),
    )
    .addSubcommandGroup((g) =>
      g
        .setName('antizalgo')
        .setDescription('Anti-zalgo settings')
        .addSubcommand((sc) =>
          sc
            .setName('setup')
            .setDescription('Configure anti-zalgo')
            .addBooleanOption((o) => o.setName('enabled').setDescription('Enable anti-zalgo').setRequired(true)),
        ),
    )
    .addSubcommandGroup((g) =>
      g
        .setName('anticaps')
        .setDescription('Anti-caps settings')
        .addSubcommand((sc) =>
          sc
            .setName('setup')
            .setDescription('Configure anti-caps')
            .addBooleanOption((o) => o.setName('enabled').setDescription('Enable anti-caps').setRequired(true))
            .addIntegerOption((o) => o.setName('max_percent').setDescription('Max caps percentage (0-100)').setMinValue(1).setMaxValue(100))
            .addIntegerOption((o) => o.setName('min_length').setDescription('Minimum message length to check')),
        ),
    )
    .addSubcommand((sc) => sc.setName('config').setDescription('View current automod configuration')),

  async execute(interaction) {
    const { allowed } = await checkAuthorization(interaction.member, 'admin');
    if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need admin authority to configure automod.'), ephemeral: true });

    const group = interaction.options.getSubcommandGroup(false);
    const sub = interaction.options.getSubcommand();

    if (!group && sub === 'config') {
      const cfg = await getAutomod(interaction.guildId);
      return interaction.reply(
        infoCard(
          'Automod configuration',
          [
            `**Anti-spam:** ${cfg.antispam.enabled} (max ${cfg.antispam.maxMessages}/${cfg.antispam.intervalMs}ms, timeout ${cfg.antispam.timeoutMs}ms)`,
            `**Anti-link:** ${cfg.antilink.enabled} (whitelist: ${cfg.antilink.whitelistDomains.join(', ') || 'none'})`,
            `**Anti-zalgo:** ${cfg.antizalgo.enabled}`,
            `**Anti-caps:** ${cfg.anticaps.enabled} (max ${cfg.anticaps.maxPercent}%, min length ${cfg.anticaps.minLength})`,
          ].join('\n'),
        ),
      );
    }

    if (group === 'antispam' && sub === 'setup') {
      const enabled = interaction.options.getBoolean('enabled');
      const maxMessages = interaction.options.getInteger('max_messages');
      const intervalMs = interaction.options.getInteger('interval_ms');
      const timeoutMs = interaction.options.getInteger('timeout_ms');
      const patch = { enabled };
      if (maxMessages) patch.maxMessages = maxMessages;
      if (intervalMs) patch.intervalMs = intervalMs;
      if (timeoutMs) patch.timeoutMs = timeoutMs;
      await setModule(interaction.guildId, 'antispam', patch);
      return interaction.reply(successCard('Anti-spam updated', `Anti-spam is now **${enabled ? 'enabled' : 'disabled'}**.`));
    }

    if (group === 'antilink' && sub === 'setup') {
      const enabled = interaction.options.getBoolean('enabled');
      const domainsRaw = interaction.options.getString('whitelist_domains');
      const patch = { enabled };
      if (domainsRaw) patch.whitelistDomains = domainsRaw.split(',').map((d) => d.trim()).filter(Boolean);
      await setModule(interaction.guildId, 'antilink', patch);
      return interaction.reply(successCard('Anti-link updated', `Anti-link is now **${enabled ? 'enabled' : 'disabled'}**.`));
    }

    if (group === 'antizalgo' && sub === 'setup') {
      const enabled = interaction.options.getBoolean('enabled');
      await setModule(interaction.guildId, 'antizalgo', { enabled });
      return interaction.reply(successCard('Anti-zalgo updated', `Anti-zalgo is now **${enabled ? 'enabled' : 'disabled'}**.`));
    }

    if (group === 'anticaps' && sub === 'setup') {
      const enabled = interaction.options.getBoolean('enabled');
      const maxPercent = interaction.options.getInteger('max_percent');
      const minLength = interaction.options.getInteger('min_length');
      const patch = { enabled };
      if (maxPercent) patch.maxPercent = maxPercent;
      if (minLength) patch.minLength = minLength;
      await setModule(interaction.guildId, 'anticaps', patch);
      return interaction.reply(successCard('Anti-caps updated', `Anti-caps is now **${enabled ? 'enabled' : 'disabled'}**.`));
    }
  },
};
