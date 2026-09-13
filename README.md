# Xieron HelpDesk Bot — Full Build

Clean-slate Discord.js + Firebase HelpDesk/moderation bot. No VoiceMaster/VoiceSystem commands are included.

## Included command surface

- `/security config|setmodrole|extraowner|mainrole|adminrole|antinuke|antibot`
- `/automod config|antispam|antilink|antibadwords|antizalgo|anticaps|whitelist`
- `/moderation ban|unban|unbanall|kick|mute|unmute|unmuteall|softban|warn|warnings|block|unblock|purge|nick|role`
- `/channel lock|unlock|lockall|unlockall|hide|unhide|hideall|unhideall|slowmode`
- `/role add|remove`
- `/logs autologs|channellog|memberlog|messagelog|modlog|resetlog|rolelog|serverlog|showlogs|voicelog`
- `/customrole customrole|add|remove|list|reset|config|reqrole`
- `/utility afk|avatar|banner|setboost|boostcount|channelinfo|embed|help|invite|membercount|ping|roleicon|roleinfo|servericon|serverinfo|stats|steal|uptime|userinfo|vote|infoboard`
- `/giveaway start|end|list|reroll`
- `/autoresponder add|remove|list|test|reset`
- `/welcome setup|test|delete|list|keyword|reset|edit`
- `/autorole humans|bots|add|remove|list|reset`
- `/ticket panel|setup|list|reset|status`
- `/sticky add|remove|list|reset`
- `/selfrole setup|list|delete|reset|cleanup|edit`
- `/media channel|whitelist|reset`
- `/autonick setup|config|reset`

## Setup

1. Install Node.js 20+.
2. Extract this folder and open it in VS Code.
3. Run `npm install`.
4. Copy `.env.example` to `.env`.
5. Add your Discord bot token, application/client ID and owner ID.
6. Add Firebase service-account JSON or a service-account file path.
7. Run `npm run register` once to register global slash commands.
8. Run `npm start`.

For Render: Build Command `npm install`, Start Command `npm start`. The built-in health server uses Render's `PORT` variable.

## Firebase

Server data is stored under `guilds/{guildId}`. The bot also has an in-memory fallback when Firebase credentials are not configured, so it can be tested locally without Firebase.

## Design

Primary UI color: `#38BDF8`. Green/red are reserved for semantic states. Components V2 cards are used for bot responses where supported.
