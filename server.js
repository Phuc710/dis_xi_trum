// server.js - Tạo file này trong thư mục gốc
const http = require('http');
const client = require('./main'); // Import bot

const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    
    const botInfo = {
        name: "Music Bot + Boo",
        status: global.client ? (global.client.isReady() ? 'Online' : 'Starting...') : 'Initializing...',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        servers: global.client ? global.client.guilds.cache.size : 0,
        users: global.client ? global.client.users.cache.size : 0,
        ping: global.client ? global.client.ws.ping : 0,
        booMood: global.booBot ? global.booBot.personality.currentMood : 'Not loaded'
    };
    
    if (req.url === '/health') {
        res.statusCode = 200;
        res.end(JSON.stringify({ status: 'healthy', ...botInfo }, null, 2));
    } else if (req.url === '/ping') {
        res.setHeader('Content-Type', 'text/plain');
        res.statusCode = 200;
        res.end('pong');
    } else if (req.url === '/') {
        res.statusCode = 200;
        res.end(`🤖 Music Bot + Boo is running!\n${JSON.stringify(botInfo, null, 2)}`);
    } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🌐 HTTP Server running on port ${PORT}`);
});

// Keep alive ping
setInterval(() => {
    if (global.client && global.client.isReady()) {
        console.log(`🔄 Keep alive - Guilds: ${global.client.guilds.cache.size}`);
    }
}, 300000); // 5 minutes

module.exports = server;