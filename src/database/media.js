const { getDoc, setDoc, resetDoc } = require('./guildConfig');

const DEFAULTS = { channels: [], whitelistRoles: [], whitelistUsers: [] };

async function getMedia(guildId) {
  return getDoc(guildId, 'media', DEFAULTS);
}
async function addChannel(guildId, channelId) {
  const cfg = await getMedia(guildId);
  if (!cfg.channels.includes(channelId)) cfg.channels.push(channelId);
  return setDoc(guildId, 'media', { channels: cfg.channels });
}
async function removeChannel(guildId, channelId) {
  const cfg = await getMedia(guildId);
  return setDoc(guildId, 'media', { channels: cfg.channels.filter((id) => id !== channelId) });
}
async function resetChannels(guildId) {
  return setDoc(guildId, 'media', { channels: [] });
}
async function addWhitelistRole(guildId, roleId) {
  const cfg = await getMedia(guildId);
  if (!cfg.whitelistRoles.includes(roleId)) cfg.whitelistRoles.push(roleId);
  return setDoc(guildId, 'media', { whitelistRoles: cfg.whitelistRoles });
}
async function removeWhitelistRole(guildId, roleId) {
  const cfg = await getMedia(guildId);
  return setDoc(guildId, 'media', { whitelistRoles: cfg.whitelistRoles.filter((id) => id !== roleId) });
}
async function resetWhitelistRoles(guildId) {
  return setDoc(guildId, 'media', { whitelistRoles: [] });
}
async function addWhitelistUser(guildId, userId) {
  const cfg = await getMedia(guildId);
  if (!cfg.whitelistUsers.includes(userId)) cfg.whitelistUsers.push(userId);
  return setDoc(guildId, 'media', { whitelistUsers: cfg.whitelistUsers });
}
async function removeWhitelistUser(guildId, userId) {
  const cfg = await getMedia(guildId);
  return setDoc(guildId, 'media', { whitelistUsers: cfg.whitelistUsers.filter((id) => id !== userId) });
}
async function resetWhitelistUsers(guildId) {
  return setDoc(guildId, 'media', { whitelistUsers: [] });
}
async function resetMedia(guildId) {
  return resetDoc(guildId, 'media', DEFAULTS);
}

module.exports = {
  getMedia, addChannel, removeChannel, resetChannels,
  addWhitelistRole, removeWhitelistRole, resetWhitelistRoles,
  addWhitelistUser, removeWhitelistUser, resetWhitelistUsers,
  resetMedia,
};
