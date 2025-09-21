require('dotenv').config();

const { Player } = require('discord-player');
const { Client, GatewayIntentBits } = require('discord.js');
const { YoutubeiExtractor } = require('discord-player-youtubei');

// Tạo client
global.client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    disableMentions: 'everyone',
});

client.config = require('./config');

// Khởi tạo player
const player = new Player(client, {
    ...client.config.opt.discordPlayer,
    leaveOnEmpty: client.config.opt.leaveOnEmpty,
    leaveOnEmptyCooldown: client.config.opt.leaveOnEmptyCooldown,
    leaveOnEnd: client.config.opt.leaveOnEnd,  
    leaveOnEndCooldown: client.config.opt.leaveOnEndCooldown,
    autoSelfDeaf: true,
    initialVolume: client.config.opt.volume,
    maxVolume: client.config.opt.maxVol,
    skipFFmpeg: false,
    ignoreInternalFilters: true,
});

// Đăng ký extractor
try {
    player.extractors.register(YoutubeiExtractor, {
        ignoreInternalFilters: true,
        bypassAge: true
    });
} catch (error) {
    console.log('⚠️ YouTube extractor failed');
}

// Triệt để block tất cả YouTube.js spam
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

// Override console methods để block tất cả garbage
console.log = console.warn = console.error = (...args) => {
    const str = String(args.join(' '));
    
    // Block tất cả YouTube.js và parser spam
    if (str.includes('[YOUTUBEJS]') || 
        str.includes('GridShelfView') ||
        str.includes('SectionHeaderView') ||
        str.includes('InnertubeError') ||
        str.includes('This is a bug') ||
        str.includes('constructor(data: RawNode)') ||
        str.includes('at ERROR_HANDLER') ||
        str.includes('at createRuntimeClass') ||
        str.includes('Unable to find matching run') ||
        str.includes('class GridShelfView') ||
        str.includes('class SectionHeaderView') ||
        str.includes('generateRuntimeClass') ||
        str.includes('parseItem') ||
        str.includes('parseArray') ||
        str.includes('ItemSection') ||
        str.includes('SectionList') ||
        str.includes('Follow the instructions') ||
        str.includes('report it at') ||
        str.includes('Introspected and JIT') ||
        str.includes('date:') && str.includes('version:') ||
        str.includes('🔍 Searching') ||
        str.includes('✅ Search found') ||
        str.includes('🎵 First track') ||
        str.includes('🎵 audioTrackAdd') ||
        str.includes('📊 Queue size') ||
        str.includes('📺 Channel exists') ||
        str.includes('🎬 playerStart') ||
        str.includes('▶️ Is playing') ||
        str.includes('✅ Track loaded') ||
        str.includes('📊 Current queue') ||
        str.includes('📭 empty')) {
        return;
    }
    
    // Chỉ cho phép những thông báo quan trọng
    originalLog(...args);
};

// Error handling - QUAN TRỌNG để bot hoạt động
const handleError = (error) => {
    // Chỉ im lặng với YouTube.js parser errors
    if (error.message?.includes('GridShelfView') || 
        error.message?.includes('SectionHeaderView')) {
        return;
    }
    console.error(`❌ ${error.message}`);
};

// Player error handling - KHÔNG được bỏ qua!
player.events.on('error', (queue, error) => {
    console.error(`❌ Player Error: ${error.message}`);
});

// Suppress chỉ deprecation warnings
process.on('warning', (warning) => {
    if (warning.name === 'DeprecationWarning') return;
    console.warn(warning);
});

console.clear();
console.log('🚀 Starting Bot...');

require('./loader');

client.login(client.config.app.token).catch((error) => {
    if (error.message === 'An invalid token was provided.') {
        require('./process_tools').throwConfigError('app', 'token', 
            '\n\t❌ Invalid Token! ❌\n'
        );
    } else {
        handleError(error);
        process.exit(1);
    }
});

process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    client.destroy();
    process.exit(0);
});

const http = require('http');
const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    
    const botInfo = {
        name: "Music Bot + Boo",
        status: client.isReady() ? 'Online' : 'Starting...',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        servers: client.guilds ? client.guilds.cache.size : 0,
        users: client.users ? client.users.cache.size : 0,
        ping: client.ws.ping,
        booMood: global.booBot ? global.booBot.personality.currentMood : 'Not loaded'
    };
    
    if (req.url === '/health') {
        res.statusCode = 200;
        res.end(JSON.stringify({ status: 'healthy', ...botInfo }, null, 2));
    } else if (req.url === '/ping') {
        res.setHeader('Content-Type', 'text/plain');
        res.statusCode = 200;
        res.end('pong');
    } else {
        res.statusCode = 200;
        res.end(`🤖 Music Bot + Boo is running!\n${JSON.stringify(botInfo, null, 2)}`);
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🌐 HTTP Server running on port ${PORT}`);
});