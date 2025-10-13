const { ActivityType } = require('discord.js');

module.exports = {
  ownerId: '589636439122378763',
  token: "",
  language: "en",
  prefix: "!",
  mongodbUri: "",
  status: {
    rotateDefault: [
      {
        name: "Cùng lắng nghe || /help",
        type: "Playing"
      }
    ],
    songStatus: true
  },
  excessCommands: {
    "utility": true,
    "other": true,
    "economy": true
  },
  categories: {
    "media": true,
    "basic": true,
    "utility": true,
    "moderation": true,
    "core": true,
    "lavalink": true,
    "music": true,
    "distube": true,
    "setups": true
  },
  spotifyClientId : "85aab1d51a174aad9eed6d7989f530e6",
  spotifyClientSecret : "b2ad05aa725e434c88776a1be8eab6c2",
}

