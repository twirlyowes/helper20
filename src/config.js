require('dotenv').config();
module.exports={token:process.env.DISCORD_TOKEN,clientId:process.env.CLIENT_ID,ownerId:process.env.OWNER_ID,port:Number(process.env.PORT||10000),defaultModRoleId:process.env.DEFAULT_MOD_ROLE_ID||null,prefix:process.env.PREFIX||'.',prefixBypassUserId:process.env.PREFIX_BYPASS_USER_ID||null};
