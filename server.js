/**
 * Boo Music Bot - Web Server
 * Server để duy trì bot luôn online trên Render
 * 
 * @version 1.0.0
 * @author Phucx
 */

const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Root endpoint
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>🎵 Boo Music Bot - Status</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    color: white;
                }
                .container {
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    border-radius: 20px;
                    padding: 40px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    text-align: center;
                    max-width: 500px;
                    animation: fadeIn 0.5s ease-in;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                h1 {
                    font-size: 2.5em;
                    margin-bottom: 10px;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                }
                .status {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    background: rgba(255, 255, 255, 0.2);
                    padding: 15px 30px;
                    border-radius: 50px;
                    margin: 20px 0;
                    font-size: 1.2em;
                }
                .status-dot {
                    width: 15px;
                    height: 15px;
                    background: #00ff00;
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                .info {
                    margin: 20px 0;
                    line-height: 1.8;
                }
                .info p {
                    margin: 10px 0;
                }
                .links {
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                    margin-top: 30px;
                    flex-wrap: wrap;
                }
                .btn {
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                    padding: 12px 25px;
                    border-radius: 25px;
                    text-decoration: none;
                    transition: all 0.3s ease;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                }
                .btn:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                }
                .stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: 15px;
                    margin: 20px 0;
                }
                .stat-box {
                    background: rgba(255, 255, 255, 0.15);
                    padding: 15px;
                    border-radius: 15px;
                }
                .stat-value {
                    font-size: 1.5em;
                    font-weight: bold;
                    color: #FFD700;
                }
                .stat-label {
                    font-size: 0.9em;
                    opacity: 0.9;
                    margin-top: 5px;
                }
                footer {
                    margin-top: 30px;
                    opacity: 0.8;
                    font-size: 0.9em;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🎵 Boo Music Bot</h1>
                
                <div class="status">
                    <div class="status-dot"></div>
                    <span>Bot đang online</span>
                </div>
                
                <div class="info">
                    <p><strong>Version:</strong> 1.0.0</p>
                    <p><strong>Uptime:</strong> ${Math.floor(process.uptime())} giây</p>
                    <p><strong>Server Time:</strong> ${new Date().toLocaleString('vi-VN')}</p>
                </div>
                
                <div class="stats">
                    <div class="stat-box">
                        <div class="stat-value">⚡</div>
                        <div class="stat-label">Fast</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">🎶</div>
                        <div class="stat-label">Music</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">🤖</div>
                        <div class="stat-label">AI</div>
                    </div>
                </div>
                
                <div class="links">
                    <a href="https://discord.gg/cc9U4w6a" class="btn" target="_blank">
                        💬 Discord
                    </a>
                    <a href="https://github.com/Phuc710/dis_xi_trum" class="btn" target="_blank">
                        📘 GitHub
                    </a>
                    <a href="https://phucdev.xo.je" class="btn" target="_blank">
                        🌐 Website
                    </a>
                </div>
                
                <footer>
                    Made with ❤️ by Phucx
                </footer>
            </div>
        </body>
        </html>
    `);
});

// Health check endpoint (cho UptimeRobot, Blind, etc.)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        message: 'Boo Music Bot is running! 🎵'
    });
});

// Ping endpoint
app.get('/ping', (req, res) => {
    res.status(200).json({
        ping: 'pong',
        time: Date.now()
    });
});

// API status endpoint
app.get('/api/status', (req, res) => {
    res.json({
        bot: 'Boo Music Bot',
        version: '1.0.0',
        status: 'online',
        uptime: Math.floor(process.uptime()),
        memory: process.memoryUsage(),
        author: 'Phucx'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: '404 Not Found',
        message: 'Endpoint không tồn tại',
        bot: 'Boo Music Bot'
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    const serverUrl = process.env.RENDER ? `https://${process.env.RENDER_SERVICE_NAME}.onrender.com` : `http://localhost:${PORT}`;
    console.log(`🔗 Listening to Phucx : ${serverUrl}`);
    console.log('\n' + '═'.repeat(50));
    console.log(`🌐 Web Server đã khởi động thành công!`);
    console.log('═'.repeat(50));
    console.log(`🔗 Địa chỉ Server: ${serverUrl}`);
    console.log(`🎵 Tên Bot: Boo Music Bot`);
    console.log(`👨‍💻 Phát triển bởi: Phucx`);
    console.log(`📍 Kiểm tra sức khỏe: ${serverUrl}/health`);
    console.log(`🇻🇳 Dành riêng cho người Việt Nam`);
    console.log('═'.repeat(50) + '\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Nhận tín hiệu SIGTERM, đang tắt server một cách an toàn...');
    console.log('🚀 Cảm ơn bạn đã sử dụng Boo Bot!');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Nhận tín hiệu tắt, đang dừng server an toàn...');
    console.log('🚀 Cảm ơn bạn đã sử dụng Boo Bot!');
    process.exit(0);
});

module.exports = app;

