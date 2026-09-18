const env = require('../config/env');
const { getSecurity } = require('../database/security');

/**
 * Resolves the authorization level of a guild member.
 * Levels (highest to lowest): owner > extraOwner > admin > mod > member
 */
async function getAuthorityLevel(member) {
  if (!member) return 'member';
  const { guild, id } = member;

  if (id === env.OWNER_ID) return 'owner';
  if (guild.ownerId === id) return 'owner';

  const sec = await getSecurity(guild.id);

  if (sec.extraOwners.includes(id)) return 'extraOwner';

  if (sec.admins.includes(id)) return 'admin';
  if (member.roles.cache.some((r) => sec.mainRoles.includes(r.id))) return 'admin';

  if (member.roles.cache.some((r) => sec.modRoles.includes(r.id))) return 'mod';

  return 'member';
}

const LEVEL_RANK = { owner: 4, extraOwner: 3, admin: 2, mod: 1, member: 0 };

function meetsLevel(actualLevel, requiredLevel) {
  return LEVEL_RANK[actualLevel] >= LEVEL_RANK[requiredLevel];
}

/**
 * Checks whether `actingMember` is authorized to run a command that requires `requiredLevel`.
 * Returns { allowed, level }.
 */
async function checkAuthorization(actingMember, requiredLevel = 'mod') {
  const level = await getAuthorityLevel(actingMember);
  return { allowed: meetsLevel(level, requiredLevel), level };
}

/**
 * Discord role-hierarchy safety checks for moderation actions.
 * Returns a string reason if the action should be blocked, or null if it's allowed.
 */
function checkHierarchy({ guild, actingMember, targetMember }) {
  if (!targetMember) return null; // target not in guild (e.g. ban by ID) - hierarchy N/A

  if (targetMember.id === guild.ownerId) {
    return "You can't take action against the server owner.";
  }

  if (targetMember.id === actingMember.id) {
    return "You can't take this action against yourself.";
  }

  const botMember = guild.members.me;
  if (botMember.roles.highest.position <= targetMember.roles.highest.position) {
    return "I can't take action against a member with an equal or higher role than me.";
  }

  if (
    actingMember.id !== guild.ownerId &&
    actingMember.roles.highest.position <= targetMember.roles.highest.position
  ) {
    return "You can't take action against a member with an equal or higher role than you.";
  }

  return null;
}

module.exports = { getAuthorityLevel, checkAuthorization, checkHierarchy, meetsLevel, LEVEL_RANK };
