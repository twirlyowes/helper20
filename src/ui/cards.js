const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SectionBuilder,
  ThumbnailBuilder,
  MessageFlags,
} = require('discord.js');
const COLORS = require('./colors');
const { EMOJIS } = require('../config/constants');

/**
 * Builds a Components V2 message payload wrapping the given lines in a colored container.
 * @param {object} opts
 * @param {string} opts.title - Bold heading line (markdown).
 * @param {string} [opts.description] - Body text (markdown).
 * @param {number} [opts.color] - Container accent color.
 * @param {string} [opts.thumbnail] - Optional thumbnail image URL (e.g. user avatar).
 * @param {import('discord.js').ActionRowBuilder[]} [opts.rows] - Optional action rows (buttons/selects).
 * @param {string[]} [opts.fields] - Optional extra markdown lines added after a separator.
 */
function buildCard({ title, description = '', color = COLORS.PRIMARY, thumbnail = null, rows = [], fields = [] }) {
  const container = new ContainerBuilder().setAccentColor(color);

  const headerText = `### ${title}${description ? `\n${description}` : ''}`;

  if (thumbnail) {
    const section = new SectionBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText))
      .setThumbnailAccessory(new ThumbnailBuilder().setURL(thumbnail));
    container.addSectionComponents(section);
  } else {
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));
  }

  if (fields.length) {
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(fields.join('\n')));
  }

  for (const row of rows) {
    container.addActionRowComponents(row);
  }

  return {
    flags: MessageFlags.IsComponentsV2,
    components: [container],
  };
}

function successCard(title, description, opts = {}) {
  return buildCard({ title: `${EMOJIS.SUCCESS} ${title}`, description, color: COLORS.SUCCESS, ...opts });
}

function errorCard(title, description, opts = {}) {
  return buildCard({ title: `${EMOJIS.ERROR} ${title}`, description, color: COLORS.DANGER, ...opts });
}

function warningCard(title, description, opts = {}) {
  return buildCard({ title: `${EMOJIS.WARNING} ${title}`, description, color: COLORS.WARNING, ...opts });
}

function infoCard(title, description, opts = {}) {
  return buildCard({ title: `${EMOJIS.INFO} ${title}`, description, color: COLORS.PRIMARY, ...opts });
}

module.exports = { buildCard, successCard, errorCard, warningCard, infoCard };
