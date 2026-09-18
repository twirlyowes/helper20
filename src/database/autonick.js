const { getDoc, setDoc, resetDoc } = require('./guildConfig');

const DEFAULTS = { enabled: false, pattern: '{username}', stripSpecialChars: false };

async function getAutonick(guildId) {
  return getDoc(guildId, 'autonick', DEFAULTS);
}
async function setAutonick(guildId, patch) {
  return setDoc(guildId, 'autonick', patch);
}
async function resetAutonick(guildId) {
  return resetDoc(guildId, 'autonick', DEFAULTS);
}

module.exports = { getAutonick, setAutonick, resetAutonick };
