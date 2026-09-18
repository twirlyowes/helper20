const { collection, addDocToCollection, getCollection } = require('./guildConfig');

async function createSelfrolePanel(guildId, data) {
  return addDocToCollection(guildId, 'selfroles', data);
}
async function listSelfrolePanels(guildId) {
  return getCollection(guildId, 'selfroles');
}
async function getSelfrolePanel(guildId, panelId) {
  const snap = await collection(guildId, 'selfroles').doc(panelId).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}
async function updateSelfrolePanel(guildId, panelId, patch) {
  await collection(guildId, 'selfroles').doc(panelId).update(patch);
}
async function deleteSelfrolePanel(guildId, panelId) {
  await collection(guildId, 'selfroles').doc(panelId).delete();
}
async function resetSelfrolePanels(guildId) {
  const panels = await listSelfrolePanels(guildId);
  await Promise.all(panels.map((p) => collection(guildId, 'selfroles').doc(p.id).delete()));
}

module.exports = {
  createSelfrolePanel, listSelfrolePanels, getSelfrolePanel,
  updateSelfrolePanel, deleteSelfrolePanel, resetSelfrolePanels,
};
