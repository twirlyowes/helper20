const { getDoc, setDoc, resetDoc } = require('./guildConfig');
const { DEFAULTS } = require('../config/constants');

async function getAutomod(guildId) {
  return getDoc(guildId, 'automod', DEFAULTS.AUTOMOD);
}

async function setModule(guildId, moduleName, patch) {
  const current = await getAutomod(guildId);
  const updated = { ...current, [moduleName]: { ...current[moduleName], ...patch } };
  await setDoc(guildId, 'automod', updated);
  return updated;
}

async function resetAutomod(guildId) {
  return resetDoc(guildId, 'automod', DEFAULTS.AUTOMOD);
}

module.exports = { getAutomod, setModule, resetAutomod };
