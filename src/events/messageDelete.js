const { sendLog } = require('../utils/sendLog');

module.exports = {
  name: 'messageDelete',
  async execute(message) {
    if (!message.guild || message.author?.bot) return;
    await sendLog(
      message.guild,
      'messagelog',
      'Message deleted',
      `**Author:** ${message.author?.tag ?? 'Unknown'}\n**Channel:** ${message.channel}\n**Content:** ${message.content || '*(no text content)*'}`,
    );
  },
};
