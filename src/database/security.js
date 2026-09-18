const { getDoc, setDoc, resetDoc } = require('./guildConfig');

const DEFAULTS = {
  admins: [], // user IDs
  extraOwners: [], // user IDs
  mainRoles: [], // role IDs treated as admin-equivalent
  modRoles: [], // role IDs treated as moderator-equivalent
  whitelist: [], // user/role IDs exempt from automod + antinuke
  nightmode: { enabled: false, auto: false, timezone: 'UTC', startHour: 23, endHour: 7, logChannelId: null },
};

async function getSecurity(guildId) {
  return getDoc(guildId, 'security', DEFAULTS);
}

async function addAdmin(guildId, userId) {
  const sec = await getSecurity(guildId);
  if (!sec.admins.includes(userId)) sec.admins.push(userId);
  return setDoc(guildId, 'security', { admins: sec.admins });
}

async function removeAdmin(guildId, userId) {
  const sec = await getSecurity(guildId);
  return setDoc(guildId, 'security', { admins: sec.admins.filter((id) => id !== userId) });
}

async function resetAdmins(guildId) {
  return setDoc(guildId, 'security', { admins: [] });
}

async function addExtraOwner(guildId, userId) {
  const sec = await getSecurity(guildId);
  if (!sec.extraOwners.includes(userId)) sec.extraOwners.push(userId);
  return setDoc(guildId, 'security', { extraOwners: sec.extraOwners });
}

async function removeExtraOwner(guildId, userId) {
  const sec = await getSecurity(guildId);
  return setDoc(guildId, 'security', { extraOwners: sec.extraOwners.filter((id) => id !== userId) });
}

async function resetExtraOwners(guildId) {
  return setDoc(guildId, 'security', { extraOwners: [] });
}

async function addMainRole(guildId, roleId) {
  const sec = await getSecurity(guildId);
  if (!sec.mainRoles.includes(roleId)) sec.mainRoles.push(roleId);
  return setDoc(guildId, 'security', { mainRoles: sec.mainRoles });
}

async function removeMainRole(guildId, roleId) {
  const sec = await getSecurity(guildId);
  return setDoc(guildId, 'security', { mainRoles: sec.mainRoles.filter((id) => id !== roleId) });
}

async function resetMainRoles(guildId) {
  return setDoc(guildId, 'security', { mainRoles: [] });
}

async function addModRole(guildId, roleId) {
  const sec = await getSecurity(guildId);
  if (!sec.modRoles.includes(roleId)) sec.modRoles.push(roleId);
  return setDoc(guildId, 'security', { modRoles: sec.modRoles });
}

async function removeModRole(guildId, roleId) {
  const sec = await getSecurity(guildId);
  return setDoc(guildId, 'security', { modRoles: sec.modRoles.filter((id) => id !== roleId) });
}

async function resetModRoles(guildId) {
  return setDoc(guildId, 'security', { modRoles: [] });
}

async function addWhitelist(guildId, id) {
  const sec = await getSecurity(guildId);
  if (!sec.whitelist.includes(id)) sec.whitelist.push(id);
  return setDoc(guildId, 'security', { whitelist: sec.whitelist });
}

async function removeWhitelist(guildId, id) {
  const sec = await getSecurity(guildId);
  return setDoc(guildId, 'security', { whitelist: sec.whitelist.filter((x) => x !== id) });
}

async function resetWhitelist(guildId) {
  return setDoc(guildId, 'security', { whitelist: [] });
}

async function setNightmode(guildId, patch) {
  const sec = await getSecurity(guildId);
  return setDoc(guildId, 'security', { nightmode: { ...sec.nightmode, ...patch } });
}

async function resetNightmode(guildId) {
  const sec = await getSecurity(guildId);
  return setDoc(guildId, 'security', { nightmode: DEFAULTS.nightmode });
}

async function resetAllSecurity(guildId) {
  return resetDoc(guildId, 'security', DEFAULTS);
}

module.exports = {
  DEFAULTS,
  getSecurity,
  addAdmin,
  removeAdmin,
  resetAdmins,
  addExtraOwner,
  removeExtraOwner,
  resetExtraOwners,
  addMainRole,
  removeMainRole,
  resetMainRoles,
  addModRole,
  removeModRole,
  resetModRoles,
  addWhitelist,
  removeWhitelist,
  resetWhitelist,
  setNightmode,
  resetNightmode,
  resetAllSecurity,
};
