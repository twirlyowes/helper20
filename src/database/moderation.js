const { getDoc, setDoc, resetDoc, collection } = require('./guildConfig');

const PREFIX_DEFAULTS = { prefix: '.' };
const COMMAND_CONFIG_DEFAULTS = { disabled: [], bypassRoles: {}, bypassUsers: {} };
const IGNORE_DEFAULTS = { channels: [], whitelistRoles: [], whitelistUsers: [] };

// --- Prefix ---
async function getPrefix(guildId) {
  const doc = await getDoc(guildId, 'prefix', PREFIX_DEFAULTS);
  return doc.prefix;
}
async function setPrefix(guildId, prefix) {
  return setDoc(guildId, 'prefix', { prefix });
}

// --- Command config (enable/disable + bypass) ---
async function getCommandConfig(guildId) {
  return getDoc(guildId, 'commandConfig', COMMAND_CONFIG_DEFAULTS);
}
async function setCommandDisabled(guildId, commandName, disabled) {
  const cfg = await getCommandConfig(guildId);
  const set = new Set(cfg.disabled);
  if (disabled) set.add(commandName);
  else set.delete(commandName);
  return setDoc(guildId, 'commandConfig', { disabled: [...set] });
}
async function addBypassRole(guildId, commandName, roleId) {
  const cfg = await getCommandConfig(guildId);
  const list = cfg.bypassRoles[commandName] || [];
  if (!list.includes(roleId)) list.push(roleId);
  return setDoc(guildId, 'commandConfig', { bypassRoles: { ...cfg.bypassRoles, [commandName]: list } });
}
async function removeBypassRole(guildId, commandName, roleId) {
  const cfg = await getCommandConfig(guildId);
  const list = (cfg.bypassRoles[commandName] || []).filter((id) => id !== roleId);
  return setDoc(guildId, 'commandConfig', { bypassRoles: { ...cfg.bypassRoles, [commandName]: list } });
}
async function resetBypassRoles(guildId, commandName) {
  const cfg = await getCommandConfig(guildId);
  return setDoc(guildId, 'commandConfig', { bypassRoles: { ...cfg.bypassRoles, [commandName]: [] } });
}
async function addBypassUser(guildId, commandName, userId) {
  const cfg = await getCommandConfig(guildId);
  const list = cfg.bypassUsers[commandName] || [];
  if (!list.includes(userId)) list.push(userId);
  return setDoc(guildId, 'commandConfig', { bypassUsers: { ...cfg.bypassUsers, [commandName]: list } });
}
async function removeBypassUser(guildId, commandName, userId) {
  const cfg = await getCommandConfig(guildId);
  const list = (cfg.bypassUsers[commandName] || []).filter((id) => id !== userId);
  return setDoc(guildId, 'commandConfig', { bypassUsers: { ...cfg.bypassUsers, [commandName]: list } });
}
async function resetBypassUsers(guildId, commandName) {
  const cfg = await getCommandConfig(guildId);
  return setDoc(guildId, 'commandConfig', { bypassUsers: { ...cfg.bypassUsers, [commandName]: [] } });
}
async function resetCommandConfig(guildId) {
  return resetDoc(guildId, 'commandConfig', COMMAND_CONFIG_DEFAULTS);
}

// --- Ignore (channels + whitelist) ---
async function getIgnore(guildId) {
  return getDoc(guildId, 'ignore', IGNORE_DEFAULTS);
}
async function addIgnoreChannel(guildId, channelId) {
  const cfg = await getIgnore(guildId);
  if (!cfg.channels.includes(channelId)) cfg.channels.push(channelId);
  return setDoc(guildId, 'ignore', { channels: cfg.channels });
}
async function removeIgnoreChannel(guildId, channelId) {
  const cfg = await getIgnore(guildId);
  return setDoc(guildId, 'ignore', { channels: cfg.channels.filter((id) => id !== channelId) });
}
async function resetIgnoreChannels(guildId) {
  return setDoc(guildId, 'ignore', { channels: [] });
}
async function addIgnoreWhitelistRole(guildId, roleId) {
  const cfg = await getIgnore(guildId);
  if (!cfg.whitelistRoles.includes(roleId)) cfg.whitelistRoles.push(roleId);
  return setDoc(guildId, 'ignore', { whitelistRoles: cfg.whitelistRoles });
}
async function removeIgnoreWhitelistRole(guildId, roleId) {
  const cfg = await getIgnore(guildId);
  return setDoc(guildId, 'ignore', { whitelistRoles: cfg.whitelistRoles.filter((id) => id !== roleId) });
}
async function resetIgnoreWhitelistRoles(guildId) {
  return setDoc(guildId, 'ignore', { whitelistRoles: [] });
}
async function addIgnoreWhitelistUser(guildId, userId) {
  const cfg = await getIgnore(guildId);
  if (!cfg.whitelistUsers.includes(userId)) cfg.whitelistUsers.push(userId);
  return setDoc(guildId, 'ignore', { whitelistUsers: cfg.whitelistUsers });
}
async function removeIgnoreWhitelistUser(guildId, userId) {
  const cfg = await getIgnore(guildId);
  return setDoc(guildId, 'ignore', { whitelistUsers: cfg.whitelistUsers.filter((id) => id !== userId) });
}
async function resetIgnoreWhitelistUsers(guildId) {
  return setDoc(guildId, 'ignore', { whitelistUsers: [] });
}

// --- AFK removed: already provided by Pixel Villa Support ---

module.exports = {
  getPrefix, setPrefix,
  getCommandConfig, setCommandDisabled,
  addBypassRole, removeBypassRole, resetBypassRoles,
  addBypassUser, removeBypassUser, resetBypassUsers,
  resetCommandConfig,
  getIgnore, addIgnoreChannel, removeIgnoreChannel, resetIgnoreChannels,
  addIgnoreWhitelistRole, removeIgnoreWhitelistRole, resetIgnoreWhitelistRoles,
  addIgnoreWhitelistUser, removeIgnoreWhitelistUser, resetIgnoreWhitelistUsers,
};
