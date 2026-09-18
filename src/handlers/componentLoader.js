const logger = require('../utils/logger');

/**
 * Builds a map of customId-prefix -> handler function by scanning every loaded command's
 * optional `components` export, e.g. module.exports.components = { ticket: handlerFn }.
 * The prefix is the text before the first ':' in a customId (e.g. "ticket:close:123" -> "ticket").
 */
function buildComponentRouter(client) {
  const router = new Map();
  for (const command of client.commands.values()) {
    if (!command.components) continue;
    for (const [prefix, handler] of Object.entries(command.components)) {
      router.set(prefix, handler);
    }
  }
  client.componentRouter = router;
  logger.info(`[componentLoader] Registered ${router.size} component route prefixes.`);
  return router;
}

async function routeComponentInteraction(interaction, client) {
  const prefix = interaction.customId.split(':')[0];
  const handler = client.componentRouter?.get(prefix);
  if (!handler) {
    logger.warn(`[componentLoader] No handler registered for prefix "${prefix}"`);
    return;
  }
  await handler(interaction, client);
}

module.exports = { buildComponentRouter, routeComponentInteraction };
