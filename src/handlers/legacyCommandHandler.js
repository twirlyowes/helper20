const { getPrefix } = require('../database/moderation');
const { DEFAULT_PREFIX } = require('../config/constants');
const { errorCard } = require('../ui/cards');
const logger = require('../utils/logger');

/**
 * Builds a minimal interaction-compatible wrapper around a Message so that a command's
 * existing `execute(interaction)` logic can run unchanged from a prefix invocation.
 * Commands opt in by exporting `legacyArgs(rawArgs, message)` to map plain-text args into
 * the option values `execute` reads via interaction.options.getX(...).
 */
function buildFakeInteraction(message, optionValues) {
  return {
    guild: message.guild,
    guildId: message.guildId,
    member: message.member,
    user: message.author,
    channel: message.channel,
    channelId: message.channelId,
    client: message.client,
    options: {
      getSubcommand: () => optionValues.__subcommand || null,
      getSubcommandGroup: () => optionValues.__group || null,
      getUser: (name) => optionValues[name] || null,
      getMember: (name) => optionValues[name] || null,
      getString: (name) => (optionValues[name] !== undefined ? String(optionValues[name]) : null),
      getInteger: (name) => (optionValues[name] !== undefined ? parseInt(optionValues[name], 10) : null),
      getBoolean: (name) => optionValues[name] ?? null,
      getChannel: (name) => optionValues[name] || null,
      getRole: (name) => optionValues[name] || null,
      getMentionable: (name) => optionValues[name] || null,
    },
    replied: false,
    deferred: false,
    reply: async (payload) => message.reply(typeof payload === 'string' ? payload : payload),
    editReply: async (payload) => message.channel.send(typeof payload === 'string' ? payload : payload),
    followUp: async (payload) => message.channel.send(typeof payload === 'string' ? payload : payload),
    deferReply: async () => {},
  };
}

async function handlePrefixCommand(message, client) {
  if (!message.guild || message.author.bot) return;

  const guildPrefix = (await getPrefix(message.guildId)) || DEFAULT_PREFIX;
  if (!message.content.startsWith(guildPrefix)) return;

  const args = message.content.slice(guildPrefix.length).trim().split(/\s+/);
  const commandName = args.shift()?.toLowerCase();
  if (!commandName) return;

  const command = client.commands.get(commandName);
  if (!command || typeof command.legacyArgs !== 'function') return; // not every command supports prefix mode

  try {
    const optionValues = await command.legacyArgs(args, message);
    if (optionValues === null) return; // command signaled invalid usage and already replied
    const fakeInteraction = buildFakeInteraction(message, optionValues);
    await command.execute(fakeInteraction, client);
  } catch (err) {
    logger.error(`[legacyCommand:${commandName}]`, err);
    await message.reply(errorCard('Something went wrong', "That command hit an unexpected error and couldn't finish.")).catch(() => {});
  }
}

module.exports = { handlePrefixCommand };
