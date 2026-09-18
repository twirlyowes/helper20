const { getDoc, setDoc, resetDoc } = require('./guildConfig');

const DEFAULTS = {
  enabled: false,
  channels: {
    channellog: null,
    memberlog: null,
    messagelog: null,
    modlog: null,
    rolelog: null,
    serverlog: null,
    voicelog: null,
  },
};

async function getLogs(guildId) {
  return getDoc(guildId, 'logs', DEFAULTS);
}

async function setLogChannel(guildId, type, channelId) {
  const current = await getLogs(guildId);
  return setDoc(guildId, 'logs', { channels: { ...current.channels, [type]: channelId } });
}

async function setAutologs(guildId, enabled) {
  return setDoc(guildId, 'logs', { enabled });
}

async function resetLogs(guildId) {
  return resetDoc(guildId, 'logs', DEFAULTS);
}

module.exports = { getLogs, setLogChannel, setAutologs, resetLogs, DEFAULTS };
