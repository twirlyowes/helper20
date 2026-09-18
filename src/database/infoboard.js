const { collection, addDocToCollection, getCollection } = require('./guildConfig');

async function createInfoboard(guildId, data) {
  return addDocToCollection(guildId, 'infoboards', data);
}
async function listInfoboards(guildId) {
  return getCollection(guildId, 'infoboards');
}
async function getInfoboard(guildId, id) {
  const snap = await collection(guildId, 'infoboards').doc(id).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}
async function updateInfoboard(guildId, id, patch) {
  await collection(guildId, 'infoboards').doc(id).update(patch);
}
async function deleteInfoboard(guildId, id) {
  await collection(guildId, 'infoboards').doc(id).delete();
}

module.exports = { createInfoboard, listInfoboards, getInfoboard, updateInfoboard, deleteInfoboard };
