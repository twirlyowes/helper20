const { collection, getCollection, getDoc, setDoc } = require('./guildConfig');

async function setCustomRole(guildId, userId, roleId) {
  await collection(guildId, 'customroles').doc(userId).set({ roleId });
}
async function getCustomRole(guildId, userId) {
  const snap = await collection(guildId, 'customroles').doc(userId).get();
  return snap.exists ? snap.data() : null;
}
async function removeCustomRole(guildId, userId) {
  await collection(guildId, 'customroles').doc(userId).delete();
}
async function listCustomRoles(guildId) {
  return getCollection(guildId, 'customroles');
}
async function resetCustomRoles(guildId) {
  const all = await listCustomRoles(guildId);
  await Promise.all(all.map((r) => collection(guildId, 'customroles').doc(r.id).delete()));
}

const REQROLE_DEFAULTS = { roles: [] };
async function getReqRoles(guildId) {
  return getDoc(guildId, 'customroleReqRoles', REQROLE_DEFAULTS);
}
async function addReqRole(guildId, roleId) {
  const cfg = await getReqRoles(guildId);
  if (!cfg.roles.includes(roleId)) cfg.roles.push(roleId);
  return setDoc(guildId, 'customroleReqRoles', { roles: cfg.roles });
}
async function removeReqRole(guildId, roleId) {
  const cfg = await getReqRoles(guildId);
  return setDoc(guildId, 'customroleReqRoles', { roles: cfg.roles.filter((id) => id !== roleId) });
}
async function resetReqRoles(guildId) {
  return setDoc(guildId, 'customroleReqRoles', { roles: [] });
}

module.exports = {
  setCustomRole, getCustomRole, removeCustomRole, listCustomRoles, resetCustomRoles,
  getReqRoles, addReqRole, removeReqRole, resetReqRoles,
};
