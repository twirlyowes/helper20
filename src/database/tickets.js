const { collection, addDocToCollection, getCollection } = require('./guildConfig');
const { getDoc, setDoc, resetDoc } = require('./guildConfig');
const { randomUUID } = require('crypto');

const PANEL_DEFAULTS = {}; // panels stored as subcollection docs, no single-doc defaults needed

async function createPanel(guildId, data) {
  return addDocToCollection(guildId, 'ticketPanels', data);
}

async function listPanels(guildId) {
  return getCollection(guildId, 'ticketPanels');
}

async function getPanel(guildId, panelId) {
  const snap = await collection(guildId, 'ticketPanels').doc(panelId).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

async function deletePanel(guildId, panelId) {
  await collection(guildId, 'ticketPanels').doc(panelId).delete();
}

async function resetPanels(guildId) {
  const panels = await listPanels(guildId);
  await Promise.all(panels.map((p) => collection(guildId, 'ticketPanels').doc(p.id).delete()));
}

async function createTicket(guildId, data) {
  const ticketId = randomUUID().slice(0, 8);
  await collection(guildId, 'tickets').doc(ticketId).set({ ticketId, status: 'open', createdAt: Date.now(), ...data });
  return { ticketId, ...data };
}

async function getOpenTicketForUser(guildId, userId, panelId) {
  const snap = await collection(guildId, 'tickets')
    .where('userId', '==', userId)
    .where('panelId', '==', panelId)
    .where('status', '==', 'open')
    .get();
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
}

async function getTicketByChannel(guildId, channelId) {
  const snap = await collection(guildId, 'tickets').where('channelId', '==', channelId).limit(1).get();
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
}

async function closeTicket(guildId, ticketId) {
  await collection(guildId, 'tickets').doc(ticketId).update({ status: 'closed', closedAt: Date.now() });
}

async function listOpenTickets(guildId) {
  const snap = await collection(guildId, 'tickets').where('status', '==', 'open').get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

module.exports = {
  createPanel, listPanels, getPanel, deletePanel, resetPanels,
  createTicket, getOpenTicketForUser, getTicketByChannel, closeTicket, listOpenTickets,
};
