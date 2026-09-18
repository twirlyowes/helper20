# Premium Guild Bot

A modular Discord.js v14 bot with Firebase persistence, a Components V2 card UI, both slash and prefix commands, and both slash (`/`) and text-prefix commands sharing the same logic.

Built as a **companion/helper bot** alongside an existing bot ("Pixel Villa Support") — commands that already exist there (`ban`, `kick`, `unban`, `nick`, `ping`, `uptime`, `lock`, `unlock`, `avatar`, `userinfo`, `serverinfo`, `warn`, `afk`, `mute`, `unmute`, `purge`, badword filtering) were deliberately **not** duplicated here.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create a Discord application**
   - Go to https://discord.com/developers/applications → New Application
   - Bot tab → Reset Token → copy it into `DISCORD_TOKEN`
   - General Information → copy Application ID into `CLIENT_ID`
   - Bot tab → enable **Server Members Intent** and **Message Content Intent**

3. **Create a Firebase project**
   - https://console.firebase.google.com → New Project → Firestore Database → Create
   - Project Settings → Service Accounts → Generate new private key → downloads a JSON file
   - Copy `project_id` → `FIREBASE_PROJECT_ID`
   - Copy `client_email` → `FIREBASE_CLIENT_EMAIL`
   - Copy `private_key` → `FIREBASE_PRIVATE_KEY` (keep the `\n` sequences as-is; the bot converts them automatically)

4. **Set environment variables.** This bot reads exclusively from `process.env` — there is no `.env` file loading (no `dotenv` dependency at all). For local development, export the variables in your shell before running, e.g.:
   ```bash
   export DISCORD_TOKEN=...
   export CLIENT_ID=...
   # ...and so on for every variable in .env.example
   ```
   On Render, set them in the service's **Environment** tab instead (see the Render section below) — that's the primary way this bot is meant to be configured.

5. **Register slash commands**
   ```bash
   npm run deploy
   ```
   Set `GUILD_ID` as an environment variable during development for instant registration to one server. Leave it unset for production (global registration, can take up to an hour to propagate).

6. **Invite the bot** to your server using an OAuth2 URL with the `bot` and `applications.commands` scopes, and at minimum: Manage Roles, Manage Channels, Manage Messages, Kick Members, Ban Members, Manage Nicknames, Manage Guild, Manage Guild Expressions, Moderate Members, Create Instant Invite.

7. **Run the bot**
   ```bash
   npm start
   ```
   or for auto-restart on file changes during development:
   ```bash
   npm run dev
   ```

## Prefix commands

The default prefix is set in `src/config/constants.js` (`DEFAULT_PREFIX`, currently `.`). Each server can override this with `/prefix <new_prefix>` or `.prefix <new_prefix>` — the override is stored in Firestore per guild.

Only commands that export a `legacyArgs(args, message)` function support prefix-mode invocation (currently `prefix` and `slowmode`, as reference implementations — extend other commands the same way by adding a `legacyArgs` export that maps plain-text arguments to the same option names used in `execute()`).

## Deploying to Render

1. Push this repo to GitHub.
2. Create a new Web Service on Render, pointing at the repo.
3. Build command: `npm install`. Start command: `npm start`.
4. Add all the environment variables from `.env.example` in the Render dashboard.
5. Render provides `PORT` automatically — the bot's built-in Express health check binds to it.

## Project structure

See `phase1-architecture.md` (delivered earlier in this project) for the full folder tree, command-to-file mapping, and database schema this bot follows.

## What's intentionally not included

Per the no-duplicate-features instruction, the following were skipped because they already exist in Pixel Villa Support: `ban`, `kick`, `unban`, `nick`, `ping`, `uptime`, `lock`, `unlock`, `avatar`, `userinfo`, `serverinfo`, `warn` (+ list/remove/reset), `afk`, `mute`, `unmute`, `purge`, badword filtering (`automod antibadwords`), single-channel `hide`/`unhide` (`.hide`/`.unhide`), the single-member `role user` toggle (`.role @user`), `stats` (`.botinfo`), `embed` (`.testembed`), and the entire `sticky` category (`.sticky`). Voice/VoiceMaster features were removed entirely at the user's request.

Commands like `unbanall`, `unmuteall`, `lockall`, `unlockall`, `hideall`/`unhideall` (server-wide, not single-channel), `block`/`unblock`, `softban`, and `role all`/`role humans`/`role bots` (mass role assignment, not the single-member toggle) were **kept** since they're distinct mass-action or new features not present in the old bot.

**One item flagged for your call rather than removed automatically:** the `/ticket` panel system (button-based, creates a dedicated channel per ticket) and Pixel Villa Support's DM-based ModMail (categories, DM-forwarding, pending DM storage) both serve "user needs help from staff" — but they're mechanically very different flows, and the panel-based ticket system was a specifically mandated feature in the original build spec. I left it in rather than guess; let me know if you'd rather it come out too.
