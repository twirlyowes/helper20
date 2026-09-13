const {PermissionFlagsBits}=require('discord.js');
const {ownerId,defaultModRoleId}=require('../config');
function owner(i){return i.user.id===ownerId;}
function admin(i){return owner(i)||i.memberPermissions?.has(PermissionFlagsBits.Administrator);}
function mod(i){return admin(i)||!!defaultModRoleId&&i.member?.roles?.cache?.has(defaultModRoleId);}
function targetOK(i,target){return target&&target.id!==i.user.id&&target.id!==i.client.user.id&&(!target.roles?.highest||!i.member?.roles?.highest||target.roles.highest.position<i.member.roles.highest.position);}
function requireMod(i){return mod(i)?null:'You need moderator permissions for this command.';}
module.exports={owner,admin,mod,targetOK,requireMod};
