const { PermissionFlagsBits } = require('discord.js');
const { getGuild, setGuild } = require('../database/firebase');
const { ownerId, defaultModRoleId } = require('../config');
const { card } = require('../ui/card');
const { primary } = require('../ui/theme');
const { MessageFlags } = require('discord.js');

function owner(i) { return i.user?.id === ownerId; }
function admin(i) {
  return owner(i) || !!i.memberPermissions?.has(PermissionFlagsBits.Administrator);
}
function mod(i) {
  return admin(i) || (!!defaultModRoleId && !!i.member?.roles?.cache?.has(defaultModRoleId));
}
function targetOK(i, target) {
  if (!target || target.id === i.user.id || target.id === i.client.user.id) return false;
  const actor = i.member?.roles?.highest;
  const highest = target.roles?.highest;
  return !highest || !actor || highest.position < actor.position;
}
async function ok(i, title, text) {
  const avatar = i.user?.displayAvatarURL?.({ extension: 'png', size: 64 });
  return i.reply({
    components: [card(title, String(text ?? ''), primary, avatar)],
    flags: MessageFlags.IsComponentsV2
  });
}
async function fail(i, text) {
  return i.reply({ content: `❌ ${text}`, ephemeral: true });
}
module.exports = { getGuild, setGuild, owner, admin, mod, targetOK, ok, fail };
