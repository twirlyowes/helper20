const { safeExecute } = require('../handlers/errorHandler');
const { routeComponentInteraction } = require('../handlers/componentLoader');
const { getCommandConfig } = require('../database/moderation');
const { errorCard } = require('../ui/cards');
const logger = require('../utils/logger');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        if (interaction.guild) {
          const cfg = await getCommandConfig(interaction.guildId);
          const bypassRoles = cfg.bypassRoles[interaction.commandName] || [];
          const bypassUsers = cfg.bypassUsers[interaction.commandName] || [];
          const hasBypass =
            bypassUsers.includes(interaction.user.id) ||
            interaction.member?.roles?.cache?.some((r) => bypassRoles.includes(r.id));

          if (cfg.disabled.includes(interaction.commandName) && !hasBypass) {
            return interaction.reply({
              ...errorCard('Command disabled', 'This command has been disabled in this server.'),
              ephemeral: true,
            });
          }
        }

        return safeExecute(command, interaction, client);
      }

      if (interaction.isButton() || interaction.isAnySelectMenu()) {
        return routeComponentInteraction(interaction, client);
      }

      if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        if (command?.autocomplete) return command.autocomplete(interaction, client);
      }

      if (interaction.isModalSubmit()) {
        return routeComponentInteraction(interaction, client);
      }
    } catch (err) {
      logger.error('[interactionCreate]', err);
    }
  },
};
