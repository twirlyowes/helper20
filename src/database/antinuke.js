const { getDoc, setDoc, resetDoc } = require('./guildConfig');
const { DEFAULTS } = require('../config/constants');

async function getAntinuke(guildId) {
  return getDoc(guildId, 'antinuke', DEFAULTS.ANTINUKE);
}

async function setAntinuke(guildId, patch) {
  const current = await getAntinuke(guildId);
  return setDoc(guildId, 'antinuke', { ...current, ...patch });
}

async function setThreshold(guildId, key, value) {
  const current = await getAntinuke(guildId);
  return setDoc(guildId, 'antinuke', { thresholds: { ...current.thresholds, [key]: value } });
}

async function resetAntinuke(guildId) {
  return resetDoc(guildId, 'antinuke', DEFAULTS.ANTINUKE);
}

module.exports = { getAntinuke, setAntinuke, setThreshold, resetAntinuke };
