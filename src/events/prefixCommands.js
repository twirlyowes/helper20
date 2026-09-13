const { PermissionsBitField } = require('discord.js');

/**
 * Prefix command handler.
 * Prefix is configured with PREFIX in .env.
 * PREFIX_BYPASS_USER_ID is the ONE Discord user who cannot use prefix commands.
 */
module.exports = client => client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return;

  const prefix = String(process.env.PREFIX || '.');
  const bypassId = String(process.env.PREFIX_BYPASS_USER_ID || '').trim();

  // This user is deliberately unable to use prefix commands.
  if (bypassId && message.author.id === bypassId) return;
  if (!message.content.startsWith(prefix)) return;

  const raw = message.content.slice(prefix.length).trim();
  if (!raw) return;

  const parts = raw.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  const command = parts.shift().toLowerCase();
  const args = parts.map(x => x.replace(/^"|"$/g, ''));

  // Prefix aliases for the core commands. Slash commands remain available too.
  try {
    if (command === 'ping') {
      return message.reply(`🏓 Pong! WebSocket: ${client.ws.ping}ms`);
    }

    if (command === 'help') {
      return message.reply({
        content: `**Xieron HelpDesk**\nPrefix: \`${prefix}\`\n\nUse \`${prefix}ping\`, \`${prefix}serverinfo\`, \`${prefix}userinfo @user\`, \`${prefix}avatar @user\`, \`${prefix}uptime\`.\nFor the complete command system, use the slash commands.`
      });
    }

    if (command === 'uptime') {
      const s = Math.floor(process.uptime());
      const d = Math.floor(s / 86400);
      const h = Math.floor(s / 3600) % 24;
      const m = Math.floor(s / 60) % 60;
      return message.reply(`⏱️ Uptime: **${d}d ${h}h ${m}m**`);
    }

    if (command === 'serverinfo') {
      return message.reply(`**${message.guild.name}**\nMembers: ${message.guild.memberCount}\nChannels: ${message.guild.channels.cache.size}\nRoles: ${message.guild.roles.cache.size}`);
    }

    if (command === 'membercount') {
      return message.reply(`👥 **${message.guild.memberCount}** members.`);
    }

    if (command === 'avatar') {
      const user = message.mentions.users.first() || message.author;
      return message.reply(user.displayAvatarURL({ size: 1024 }));
    }

    if (command === 'userinfo') {
      const user = message.mentions.users.first() || message.author;
      return message.reply(`**${user.tag}**\nID: ${user.id}\nCreated: <t:${Math.floor(user.createdTimestamp / 1000)}:F>`);
    }

    if (command === 'invite') {
      const url = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&scope=bot%20applications.commands&permissions=8`;
      return message.reply(url);
    }

    if (command === 'afk') {
      const { getGuild, setGuild } = require('../database/firebase');
      const g = await getGuild(message.guild.id);
      g.afk = g.afk || {};
      g.afk[message.author.id] = { reason: args.join(' ') || 'AFK', at: Date.now() };
      await setGuild(message.guild.id, g);
      return message.reply(`💤 AFK enabled: **${g.afk[message.author.id].reason}**`);
    }

    if (command === 'purge') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        return message.reply('❌ You need Manage Messages permission.');
      }
      const amount = Math.max(1, Math.min(100, Number(args[0]) || 0));
      if (!amount) return message.reply(`Usage: \`${prefix}purge <1-100>\``);
      await message.channel.bulkDelete(amount, true);
      return;
    }

    // Unknown prefix commands are silently ignored so normal chat is unaffected.
  } catch (error) {
    console.error('Prefix command error:', error);
    if (!message.deleted) await message.reply('❌ Something went wrong while running that prefix command.').catch(() => {});
  }
});
