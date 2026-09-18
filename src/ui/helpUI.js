const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MessageFlags,
} = require('discord.js');
const COLORS = require('./colors');
const { button, row } = require('./buttons');
const { paginate } = require('../utils/pagination');
const { LIMITS, EMOJIS } = require('../config/constants');

const CATEGORIES = {
  security: { emoji: EMOJIS.SECURITY, label: 'Security', description: 'Admins, owners, roles, whitelist & nightmode' },
  automod: { emoji: EMOJIS.AUTOMOD, label: 'Automod', description: 'Anti-spam, anti-link, anti-badwords & more' },
  moderation: { emoji: EMOJIS.MODERATION, label: 'Moderation', description: 'Ban, kick, mute, warn, purge & more' },
  logs: { emoji: EMOJIS.LOGS, label: 'Logs', description: 'Server activity logging channels' },
  customrole: { emoji: EMOJIS.CUSTOMROLE, label: 'Custom Role', description: 'Personal member roles' },
  utility: { emoji: EMOJIS.UTILITY, label: 'Utility', description: 'Info, stats & general tools' },
  giveaways: { emoji: EMOJIS.GIVEAWAYS, label: 'Giveaways', description: 'Run and manage giveaways' },
  autoresponder: { emoji: EMOJIS.AUTORESPONDER, label: 'Autoresponder', description: 'Automatic trigger responses' },
  welcomer: { emoji: EMOJIS.WELCOMER, label: 'Welcomer', description: 'Welcome messages & autorole' },
  ticket: { emoji: EMOJIS.TICKET, label: 'Ticket', description: 'Support ticket panels' },
  selfrole: { emoji: EMOJIS.SELFROLE, label: 'Selfrole', description: 'Self-assignable role panels' },
  media: { emoji: EMOJIS.MEDIA, label: 'Media', description: 'Restrict media to specific channels' },
  autonick: { emoji: EMOJIS.AUTONICK, label: 'Autonick', description: 'Automatic nickname rules' },
};

/** Groups client.commands by category using each command module's `category` field. */
function getCommandsByCategory(client) {
  const grouped = {};
  for (const key of Object.keys(CATEGORIES)) grouped[key] = [];
  for (const cmd of client.commands.values()) {
    if (!cmd.category || !grouped[cmd.category]) continue;
    grouped[cmd.category].push(cmd.data.name);
  }
  return grouped;
}

function buildHomeCard(client) {
  const grouped = getCommandsByCategory(client);
  const container = new ContainerBuilder().setAccentColor(COLORS.PRIMARY);
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent('### 🧭 Help Desk\nSelect a category below to view its commands.'),
  );
  container.addSeparatorComponents(new SeparatorBuilder());

  const lines = Object.entries(CATEGORIES).map(
    ([key, meta]) => `${meta.emoji} **${meta.label}** — ${meta.description} \`(${grouped[key].length})\``,
  );
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join('\n')));

  const options = Object.entries(CATEGORIES).map(([key, meta]) => ({
    label: meta.label,
    description: meta.description.slice(0, 100),
    value: key,
    emoji: meta.emoji,
  }));

  const selectRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder().setCustomId('help:select').setPlaceholder('Choose a category').addOptions(options),
  );
  container.addActionRowComponents(selectRow);
  container.addActionRowComponents(row(button({ customId: 'help:close', label: 'Close', emoji: EMOJIS.CLOSE })));

  return { flags: MessageFlags.IsComponentsV2, components: [container] };
}

function buildCategoryCard(client, categoryKey, page = 0) {
  const meta = CATEGORIES[categoryKey];
  if (!meta) return buildHomeCard(client);

  const grouped = getCommandsByCategory(client);
  const commands = grouped[categoryKey] || [];
  const pages = paginate(commands, LIMITS.PAGE_SIZE_HELP);
  const pageIndex = Math.min(Math.max(page, 0), pages.length - 1);
  const pageCommands = pages[pageIndex] || [];

  const container = new ContainerBuilder().setAccentColor(COLORS.PRIMARY);
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `### ${meta.emoji} ${meta.label}\n${meta.description}\nPage ${pageIndex + 1}/${pages.length} • ${commands.length} commands`,
    ),
  );
  container.addSeparatorComponents(new SeparatorBuilder());
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(pageCommands.length ? pageCommands.map((c) => `\`/${c}\``).join('\n') : '*No commands registered in this category yet.*'),
  );

  const navRow = row(
    button({ customId: 'help:home', label: 'Home', emoji: EMOJIS.HOME }),
    button({ customId: `help:page:${categoryKey}:${pageIndex - 1}`, label: 'Prev', emoji: EMOJIS.ARROW_LEFT, disabled: pageIndex === 0 }),
    button({ customId: `help:page:${categoryKey}:${pageIndex + 1}`, label: 'Next', emoji: EMOJIS.ARROW_RIGHT, disabled: pageIndex >= pages.length - 1 }),
    button({ customId: 'help:close', label: 'Close', emoji: EMOJIS.CLOSE }),
  );
  container.addActionRowComponents(navRow);

  return { flags: MessageFlags.IsComponentsV2, components: [container] };
}

/** Routes a help:* component interaction to the right view. Returns a message payload or null (for close). */
function routeHelpComponent(client, interaction) {
  const [, action, a, b] = interaction.customId.split(':');

  if (action === 'home') return buildHomeCard(client);
  if (action === 'close') return null;
  if (action === 'select') {
    const categoryKey = interaction.values[0];
    return buildCategoryCard(client, categoryKey, 0);
  }
  if (action === 'page') {
    return buildCategoryCard(client, a, parseInt(b, 10));
  }
  return buildHomeCard(client);
}

module.exports = { CATEGORIES, buildHomeCard, buildCategoryCard, routeHelpComponent, getCommandsByCategory };
