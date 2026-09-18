const { collection, addDocToCollection, getCollection } = require('./guildConfig');

async function createGiveaway(guildId, data) {
  return addDocToCollection(guildId, 'giveaways', { ...data, ended: false, entries: [] });
}

async function listActiveGiveaways(guildId) {
  const all = await getCollection(guildId, 'giveaways');
  return all.filter((g) => !g.ended);
}

async function listAllGiveaways(guildId) {
  return getCollection(guildId, 'giveaways');
}

async function getGiveaway(guildId, id) {
  const snap = await collection(guildId, 'giveaways').doc(id).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

async function addEntry(guildId, id, userId) {
  const g = await getGiveaway(guildId, id);
  if (!g || g.entries.includes(userId)) return g;
  const entries = [...g.entries, userId];
  await collection(guildId, 'giveaways').doc(id).update({ entries });
  return { ...g, entries };
}

async function removeEntry(guildId, id, userId) {
  const g = await getGiveaway(guildId, id);
  if (!g) return null;
  const entries = g.entries.filter((u) => u !== userId);
  await collection(guildId, 'giveaways').doc(id).update({ entries });
  return { ...g, entries };
}

async function endGiveaway(guildId, id, winners) {
  await collection(guildId, 'giveaways').doc(id).update({ ended: true, winners, endedAt: Date.now() });
}

module.exports = { createGiveaway, listActiveGiveaways, listAllGiveaways, getGiveaway, addEntry, removeEntry, endGiveaway };
