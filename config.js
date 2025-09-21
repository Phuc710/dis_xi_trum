// config.js
module.exports = {
    app: {
        token: process.env.DISCORD_TOKEN || 'xxx',
        playing: 'Music || /help',
        global: true,
        guild: process.env.GUILD_ID || 'xxx',
        extraMessages: true,
        loopMessage: true,
        lang: 'en',
        enableEmojis: true,
    },

    emojis: {
        'back': '⏪',
        'skip': '⏩',
        'ResumePause': '⏹️',  
        'savetrack': '💾',
        'volumeUp': '🔊',
        'volumeDown': '🔉',
        'loop': '🔁',      
        'lyrics': '🎤', 
        'clear': '🗑️',
    },

    opt: {
        DJ: {
            enabled: false,
            roleName: '',
            commands: []
        },
        Translate_Timeout: 10000,
        maxVol: 100,
        spotifyBridge: true,
        volume: 75,
        leaveOnEmpty: true,
        leaveOnEmptyCooldown: 30000,
        leaveOnEnd: true,
        leaveOnEndCooldown: 30000,
        discordPlayer: {
            // Updated player options
            ytdlOptions: {
                quality: 'highestaudio',
                highWaterMark: 1 << 25,
                filter: 'audioonly'
            },
            // Add these options
            skipFFmpeg: false,
            ignoreInternalFilters: false,
            smoothVolume: true,
            disableVolume: false
        }
    }
};