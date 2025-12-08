const axios = require('axios');
const lavalinkConfig = require('./lavalink');

// Màu cho console
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bright: '\x1b[1m'
};

async function testLavalinkNode(node) {
    const protocol = node.secure ? 'https' : 'http';
    const url = `${protocol}://${node.host}:${node.port}/version`;

    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': node.password
            },
            timeout: 5000 // 5 giây timeout
        });

        return {
            ...node,
            status: 'LIVE',
            version: response.data,
            statusCode: response.status
        };
    } catch (error) {
        return {
            ...node,
            status: 'DEAD',
            error: error.message,
            errorCode: error.code
        };
    }
}

async function testAllNodes() {
    console.log(`\n${colors.bright}${colors.cyan}╔════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}║        🔍 LAVALINK NODES CONNECTION TEST 🔍           ║${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}╚════════════════════════════════════════════════════════╝${colors.reset}\n`);

    if (!lavalinkConfig.enabled) {
        console.log(`${colors.red}❌ Lavalink is DISABLED in config!${colors.reset}\n`);
        return;
    }

    const nodes = lavalinkConfig.lavalink;
    console.log(`${colors.yellow}Testing ${nodes.length} Lavalink nodes...${colors.reset}\n`);

    const results = [];

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        console.log(`${colors.cyan}[${i + 1}/${nodes.length}]${colors.reset} Testing node "${node.name}"...`);

        const result = await testLavalinkNode(node);
        results.push(result);

        if (result.status === 'LIVE') {
            console.log(`${colors.green}✅ LIVE${colors.reset} - ${node.host}:${node.port} (${node.secure ? 'HTTPS' : 'HTTP'}) - Version: ${result.version}`);
        } else {
            console.log(`${colors.red}❌ DEAD${colors.reset} - ${node.host}:${node.port} - Error: ${result.error}`);
        }
        console.log('');
    }

    // Tổng kết
    const liveNodes = results.filter(r => r.status === 'LIVE');
    const deadNodes = results.filter(r => r.status === 'DEAD');

    console.log(`${colors.bright}═══════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bright}SUMMARY:${colors.reset}`);
    console.log(`${colors.green}✅ Live Nodes: ${liveNodes.length}${colors.reset}`);
    console.log(`${colors.red}❌ Dead Nodes: ${deadNodes.length}${colors.reset}`);
    console.log(`${colors.bright}═══════════════════════════════════════════════════════${colors.reset}\n`);

    // Xuất ra danh sách node còn sống
    if (liveNodes.length > 0) {
        console.log(`${colors.bright}${colors.green}📋 LIVE NODES CONFIGURATION:${colors.reset}\n`);
        console.log(`${colors.cyan}module.exports = {`);
        console.log(`  enabled: true,`);
        console.log(`  lavalink: [`);

        liveNodes.forEach((node, index) => {
            console.log(`    {`);
            console.log(`      name: "${node.name}",`);
            console.log(`      password: "${node.password}",`);
            console.log(`      host: "${node.host}",`);
            console.log(`      port: ${node.port},`);
            console.log(`      secure: ${node.secure}`);
            console.log(`    }${index < liveNodes.length - 1 ? ',' : ''}`);
        });

        console.log(`  ]`);
        console.log(`};${colors.reset}\n`);
    } else {
        console.log(`${colors.red}${colors.bright}⚠️  NO LIVE NODES FOUND!${colors.reset}`);
        console.log(`${colors.yellow}Vui lòng kiểm tra lại cấu hình Lavalink hoặc tìm server Lavalink khác.${colors.reset}\n`);
    }

    // Chi tiết từng node
    console.log(`${colors.bright}${colors.cyan}📊 DETAILED RESULTS:${colors.reset}\n`);
    results.forEach((result, index) => {
        const statusColor = result.status === 'LIVE' ? colors.green : colors.red;
        const statusIcon = result.status === 'LIVE' ? '✅' : '❌';

        console.log(`${statusColor}${statusIcon} Node ${index + 1}: "${result.name}"${colors.reset}`);
        console.log(`   Host: ${result.host}:${result.port}`);
        console.log(`   Protocol: ${result.secure ? 'HTTPS' : 'HTTP'}`);
        console.log(`   Status: ${statusColor}${result.status}${colors.reset}`);

        if (result.status === 'LIVE') {
            console.log(`   Version: ${result.version}`);
            console.log(`   HTTP Status: ${result.statusCode}`);
        } else {
            console.log(`   Error: ${result.error}`);
            if (result.errorCode) {
                console.log(`   Error Code: ${result.errorCode}`);
            }
        }
        console.log('');
    });
}

// Chạy test
testAllNodes().catch(error => {
    console.error(`${colors.red}${colors.bright}Fatal Error:${colors.reset}`, error);
    process.exit(1);
});
