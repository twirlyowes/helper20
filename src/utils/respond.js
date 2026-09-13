const {MessageFlags}=require('discord.js');
const {card}=require('../ui/card');
const {primary}=require('../ui/theme');
async function ok(i,title,text){return i.reply({components:[card(title,text,primary,i.user.displayAvatarURL({extension:'png',size:64}))],flags:MessageFlags.IsComponentsV2});}
async function fail(i,text){return i.reply({content:`❌ ${text}`,ephemeral:true});}
module.exports={ok,fail};
