const logger = require('../utils/logger');
const { errorCard } = require('../ui/cards');

/**
 * Wraps a command's execute() call, catching any uncaught error so one broken
 * command can never crash the process or leave an interaction hanging.
 */
async function safeExecute(command, interaction, client) {
  try {
    await command.execute(interaction, client);
  } catch (err) {
    logger.error(`[command:${command.data.name}]`, err);

    const payload = errorCard(
      'Something went wrong',
      "That command hit an unexpected error and couldn't finish. This has been logged.",
    );

    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(payload);
      } else {
        await interaction.reply({ ...payload, ephemeral: true });
      }
    } catch (followUpErr) {
      logger.error('[errorHandler] Failed to notify user of error:', followUpErr);
    }
  }
}

module.exports = { safeExecute };
