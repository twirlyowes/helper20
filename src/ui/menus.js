const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

function selectMenu({ customId, placeholder, options, minValues = 1, maxValues = 1 }) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder(placeholder)
    .setMinValues(minValues)
    .setMaxValues(maxValues)
    .addOptions(options);
  return new ActionRowBuilder().addComponents(menu);
}

module.exports = { selectMenu };
