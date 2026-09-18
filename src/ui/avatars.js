function getAvatarURL(user, size = 128) {
  return user.displayAvatarURL({ size, extension: 'png' });
}

function getGuildIconURL(guild, size = 128) {
  return guild.iconURL({ size, extension: 'png' }) || null;
}

module.exports = { getAvatarURL, getGuildIconURL };
