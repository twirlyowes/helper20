const { sendLog } = require('../utils/sendLog');
const logger = require('../utils/logger');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    try {
      const guild = newState.guild || oldState.guild;

      if (!oldState.channelId && newState.channelId) {
        await sendLog(guild, 'voicelog', 'Voice join', `${newState.member} joined ${newState.channel}.`);
      } else if (oldState.channelId && !newState.channelId) {
        await sendLog(guild, 'voicelog', 'Voice leave', `${oldState.member} left ${oldState.channel}.`);
      } else if (oldState.channelId !== newState.channelId) {
        await sendLog(guild, 'voicelog', 'Voice move', `${newState.member} moved from ${oldState.channel} to ${newState.channel}.`);
      }
    } catch (err) {
      logger.error('[voiceStateUpdate]', err);
    }
  },
};
