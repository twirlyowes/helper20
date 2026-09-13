const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { respondSuccess, respondError } = require('../utils/respond');
const { checkPermissions } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('channel')
    .setDescription('Manage channels in the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand(sub =>
      sub
        .setName('create')
        .setDescription('Create a new channel')
        .addStringOption(opt =>
          opt.setName('name').setDescription('Channel name').setRequired(true)
        )
        .addIntegerOption(opt =>
          opt
            .setName('type')
            .setDescription('Channel type')
            .setRequired(false)
            .addChoices(
              { name: 'Text', value: ChannelType.GuildText },
              { name: 'Voice', value: ChannelType.GuildVoice },
              { name: 'Category', value: ChannelType.GuildCategory }
            )
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('delete')
        .setDescription('Delete a channel')
        .addChannelOption(opt =>
          opt.setName('target').setDescription('Channel to delete').setRequired(true)
        )
    ),

  async execute(interaction) {
    if (!checkPermissions(interaction, PermissionFlagsBits.ManageChannels)) {
      return respondError(interaction, 'You lack permissions to manage channels.');
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'create') {
      const name = interaction.options.getString('name');
      const type = interaction.options.getInteger('type') || ChannelType.GuildText;

      try {
        const created = await interaction.guild.channels.create({ name, type });
        return respondSuccess(interaction, `Created channel ${created}.`);
      } catch (err) {
        return respondError(interaction, `Failed to create channel: ${err.message}`);
      }
    }

    if (sub === 'delete') {
      const target = interaction.options.getChannel('target');
      try {
        await target.delete();
        return respondSuccess(interaction, `Deleted channel **#${target.name}**.`);
      } catch (err) {
        return respondError(interaction, `Failed to delete channel: ${err.message}`);
      }
    }
  }
};
