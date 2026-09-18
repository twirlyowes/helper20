const { getDoc, setDoc, resetDoc } = require('./guildConfig');

const WELCOME_DEFAULTS = {
  enabled: false,
  channelId: null,
  message: 'Welcome {user} to {server}! You are member #{count}.',
  keyword: null,
};

const AUTOROLE_DEFAULTS = { humans: [], bots: [] };

async function getWelcome(guildId) {
  return getDoc(guildId, 'welcome', WELCOME_DEFAULTS);
}
async function setWelcome(guildId, patch) {
  return setDoc(guildId, 'welcome', patch);
}
async function resetWelcome(guildId) {
  return resetDoc(guildId, 'welcome', WELCOME_DEFAULTS);
}

async function getAutorole(guildId) {
  return getDoc(guildId, 'autorole', AUTOROLE_DEFAULTS);
}
async function addAutoroleHuman(guildId, roleId) {
  const cfg = await getAutorole(guildId);
  if (!cfg.humans.includes(roleId)) cfg.humans.push(roleId);
  return setDoc(guildId, 'autorole', { humans: cfg.humans });
}
async function removeAutoroleHuman(guildId, roleId) {
  const cfg = await getAutorole(guildId);
  return setDoc(guildId, 'autorole', { humans: cfg.humans.filter((id) => id !== roleId) });
}
async function resetAutoroleHumans(guildId) {
  return setDoc(guildId, 'autorole', { humans: [] });
}
async function addAutoroleBot(guildId, roleId) {
  const cfg = await getAutorole(guildId);
  if (!cfg.bots.includes(roleId)) cfg.bots.push(roleId);
  return setDoc(guildId, 'autorole', { bots: cfg.bots });
}
async function removeAutoroleBot(guildId, roleId) {
  const cfg = await getAutorole(guildId);
  return setDoc(guildId, 'autorole', { bots: cfg.bots.filter((id) => id !== roleId) });
}
async function resetAutoroleBots(guildId) {
  return setDoc(guildId, 'autorole', { bots: [] });
}

module.exports = {
  getWelcome, setWelcome, resetWelcome,
  getAutorole, addAutoroleHuman, removeAutoroleHuman, resetAutoroleHumans,
  addAutoroleBot, removeAutoroleBot, resetAutoroleBots,
};
