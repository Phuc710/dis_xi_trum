// server.js
const http = require('http');

// Import và khởi động bot
require('./main'); // Khởi động bot

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
    } else {
        res.statusCode = 200;
        res.end(`🤖 Music Bot + Boo is running!\n${JSON.stringify(botInfo, null, 2)}`);
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🌐 HTTP Server running on port ${PORT}`);
});