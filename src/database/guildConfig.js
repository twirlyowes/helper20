const { db } = require('./firebase');

function guildRef(guildId) {
  return db.collection('guilds').doc(guildId);
}

/**
 * Read a named sub-document under guilds/{guildId}, e.g. "config", "automod", "antinuke".
 * Returns `fallback` (merged shallow) if the document doesn't exist yet.
 */
async function getDoc(guildId, docName, fallback = {}) {
  const snap = await guildRef(guildId).collection('settings').doc(docName).get();
  if (!snap.exists) return { ...fallback };
  return { ...fallback, ...snap.data() };
}

/**
 * Merge-write a named sub-document under guilds/{guildId}.
 */
async function setDoc(guildId, docName, data) {
  await guildRef(guildId).collection('settings').doc(docName).set(data, { merge: true });
  return getDoc(guildId, docName, data);
}

/**
 * Replace a named sub-document entirely (used by "reset" commands).
 */
async function resetDoc(guildId, docName, defaults = {}) {
  await guildRef(guildId).collection('settings').doc(docName).set(defaults);
  return { ...defaults };
}

/** Generic collection helpers for feature subcollections (warnings, tickets, giveaways, etc.) */
function collection(guildId, name) {
  return guildRef(guildId).collection(name);
}

async function addDocToCollection(guildId, name, data) {
  const ref = await collection(guildId, name).add({ ...data, createdAt: Date.now() });
  return { id: ref.id, ...data };
}

async function getCollection(guildId, name) {
  const snap = await collection(guildId, name).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function deleteFromCollection(guildId, name, docId) {
  await collection(guildId, name).doc(docId).delete();
}

module.exports = {
  guildRef,
  getDoc,
  setDoc,
  resetDoc,
  collection,
  addDocToCollection,
  getCollection,
  deleteFromCollection,
};
