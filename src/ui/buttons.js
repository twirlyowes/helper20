const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { EMOJIS } = require('../config/constants');

function button({ customId, label, style = ButtonStyle.Secondary, emoji, disabled = false, url }) {
  const b = new ButtonBuilder().setLabel(label).setStyle(url ? ButtonStyle.Link : style).setDisabled(disabled);
  if (url) b.setURL(url);
  else b.setCustomId(customId);
  if (emoji) b.setEmoji(emoji);
  return b;
}

function row(...buttons) {
  return new ActionRowBuilder().addComponents(...buttons);
}

function confirmRow(confirmId, cancelId) {
  return row(
    button({ customId: confirmId, label: 'Confirm', style: ButtonStyle.Danger, emoji: EMOJIS.SUCCESS }),
    button({ customId: cancelId, label: 'Cancel', style: ButtonStyle.Secondary, emoji: EMOJIS.BACK }),
  );
}

module.exports = { button, row, confirmRow, ButtonStyle };
