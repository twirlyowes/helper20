const { collection, getCollection } = require('./guildConfig');

async function addResponder(guildId, trigger, response) {
  if (!isValidTrigger(trigger)) return;
  await collection(guildId, 'autoresponders').doc(trigger.toLowerCase()).set({ trigger: trigger.toLowerCase(), response });
}
function isValidTrigger(trigger) {
  return Boolean(trigger) && trigger !== '.' && trigger !== '..' && !trigger.includes('/');
}
async function removeResponder(guildId, trigger) {
  if (!isValidTrigger(trigger)) return;
  await collection(guildId, 'autoresponders').doc(trigger.toLowerCase()).delete();
}
async function listResponders(guildId) {
  return getCollection(guildId, 'autoresponders');
}
async function getResponder(guildId, trigger) {
  if (!isValidTrigger(trigger)) return null;
  const snap = await collection(guildId, 'autoresponders').doc(trigger.toLowerCase()).get();
  return snap.exists ? snap.data() : null;
}
async function resetResponders(guildId) {
  const all = await listResponders(guildId);
  await Promise.all(all.map((r) => collection(guildId, 'autoresponders').doc(r.id).delete()));
}

module.exports = { addResponder, removeResponder, listResponders, getResponder, resetResponders };
