// src/config.js
require('dotenv').config();

module.exports = {
  token: process.env.DISCORD_TOKEN ? process.env.DISCORD_TOKEN.trim() : '',
  port: process.env.PORT || 10000
};
