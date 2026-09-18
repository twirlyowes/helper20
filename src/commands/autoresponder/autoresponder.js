const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkAuthorization } = require('../../utils/permissions');
const { addResponder, removeResponder, listResponders, resetResponders } = require('../../database/autoresponder');
const { successCard, errorCard, infoCard } = require('../../ui/cards');

module.exports = {
  category: 'autoresponder',
  data: new SlashCommandBuilder()
    .setName('autoresponder')
    .setDescription('Manage automatic trigger responses')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sc) =>
      sc
        .setName('add')
        .setDescription('Add a trigger/response pair')
        .addStringOption((o) => o.setName('trigger').setDescription('Trigger word (matched as a whole word)').setRequired(true))
        .addStringOption((o) => o.setName('response').setDescription('Response text').setRequired(true)),
    )
    .addSubcommand((sc) => sc.setName('remove').setDescription('Remove a trigger').addStringOption((o) => o.setName('trigger').setDescription('Trigger word').setRequired(true)))
    .addSubcommand((sc) => sc.setName('list').setDescription('List all triggers'))
    .addSubcommand((sc) =>
      sc.setName('test').setDescription('Preview what a trigger responds with').addStringOption((o) => o.setName('trigger').setDescription('Trigger word').setRequired(true)),
    )
    .addSubcommand((sc) => sc.setName('reset').setDescription('Remove all triggers')),

  async execute(interaction) {
    const { allowed } = await checkAuthorization(interaction.member, 'admin');
    if (!allowed) return interaction.reply({ ...errorCard('Not authorized', 'You need admin authority to manage autoresponders.'), ephemeral: true });

    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      const trigger = interaction.options.getString('trigger');
      const response = interaction.options.getString('response');
      await addResponder(interaction.guildId, trigger, response);
      return interaction.reply(successCard('Trigger added', `\`${trigger.toLowerCase()}\` will now trigger a response.`));
    }

    if (sub === 'remove') {
      const trigger = interaction.options.getString('trigger');
      await removeResponder(interaction.guildId, trigger);
      return interaction.reply(successCard('Trigger removed', `\`${trigger.toLowerCase()}\` has been removed.`));
    }

    if (sub === 'list') {
      const all = await listResponders(interaction.guildId);
      const lines = all.map((r) => `\`${r.trigger}\` → ${r.response.slice(0, 60)}`);
      return interaction.reply(infoCard(`Autoresponders (${all.length})`, lines.join('\n') || '*None yet.*'));
    }

    if (sub === 'test') {
      const trigger = interaction.options.getString('trigger');
      const { getResponder } = require('../../database/autoresponder');
      const responder = await getResponder(interaction.guildId, trigger);
      if (!responder) return interaction.reply({ ...errorCard('Not found', 'No responder for that trigger.'), ephemeral: true });
      return interaction.reply(infoCard(`Preview: ${trigger}`, responder.response));
    }

    if (sub === 'reset') {
      await resetResponders(interaction.guildId);
      return interaction.reply(successCard('Reset complete', 'All autoresponders have been removed.'));
    }
  },
};
