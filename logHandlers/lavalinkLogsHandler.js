const lavalinkConfig = require('../lavalink');

module.exports = function lavalinkLogsHandler(client) {
    // Only initialize if Lavalink is enabled
    if (!lavalinkConfig.enabled) {
        console.log('\x1b[31m[ LAVALINK LOGS ]\x1b[0m Lavalink logging disabled (Lavalink not enabled)');
        return;
    }

    console.log('\x1b[36m[ LAVALINK LOGS ]\x1b[0m Lavalink logging handler initialized ✅');

    // Log all configured nodes at startup
    client.once('clientReady', () => {
        console.log('\n' + '─'.repeat(60));
        console.log('\x1b[35m\x1b[1m            🎵 LAVALINK NODES CONFIGURATION 🎵\x1b[0m');
        console.log('─'.repeat(60));

        const nodes = Array.isArray(lavalinkConfig.lavalink) 
            ? lavalinkConfig.lavalink 
            : [lavalinkConfig.lavalink];

        nodes.forEach((node, index) => {
            console.log(`\x1b[36m[ NODE ${index + 1} ]\x1b[0m \x1b[32m${node.name}\x1b[0m`);
            console.log(`\x1b[36m[ HOST ]\x1b[0m \x1b[33m${node.host}:${node.port}\x1b[0m`);
            console.log(`\x1b[36m[ SECURE ]\x1b[0m \x1b[${node.secure ? '32m✅ Yes' : '31m❌ No'}\x1b[0m`);
            console.log(`\x1b[36m[ PASSWORD ]\x1b[0m \x1b[90m${'*'.repeat(node.password.length)}\x1b[0m`);
            console.log('─'.repeat(30));
        });

        console.log(`\x1b[36m[ TOTAL NODES ]\x1b[0m \x1b[32m${nodes.length} node(s) configured\x1b[0m`);
        console.log('─'.repeat(60));
    });

    // Monitor Riffy events once it's initialized
    client.on('riffyReady', () => {
        if (!client.riffy) return;

        // Log node statistics periodically
        setInterval(() => {
            if (client.riffy && client.riffy.nodes) {
                const connectedNodes = client.riffy.nodes.filter(node => node.connected);
                const totalNodes = client.riffy.nodes.length;
                const totalPlayers = client.riffy.players.size;

                if (connectedNodes.length > 0) {
                    console.log(`\x1b[34m[ LAVALINK STATUS ]\x1b[0m Connected: \x1b[32m${connectedNodes.length}/${totalNodes}\x1b[0m | Active Players: \x1b[33m${totalPlayers}\x1b[0m`);
                    
                    connectedNodes.forEach((node) => {
                        const stats = node.stats;
                        if (stats) {
                            console.log(`\x1b[36m[ ${node.name} ]\x1b[0m CPU: \x1b[33m${(stats.cpu.systemLoad * 100).toFixed(1)}%\x1b[0m | RAM: \x1b[33m${(stats.memory.used / 1024 / 1024).toFixed(0)}MB\x1b[0m | Players: \x1b[33m${stats.playingPlayers}/${stats.players}\x1b[0m`);
                        }
                    });
                } else if (totalNodes > 0) {
                    console.log(`\x1b[31m[ LAVALINK WARNING ]\x1b[0m No nodes connected! (0/${totalNodes})`);
                }
            }
        }, 5 * 60 * 1000); // Log every 5 minutes
    });

    // Log player activities
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton() || !interaction.customId.includes('_')) return;
        
        const action = interaction.customId.split('_').slice(0, -1).join('_');
        const musicActions = ['volume_up', 'volume_down', 'pause', 'resume', 'skip', 'stop', 'clear_queue', 'show_queue', 'loop'];
        
        if (musicActions.includes(action)) {
            console.log(`\x1b[36m[ MUSIC CONTROL ]\x1b[0m User \x1b[33m${interaction.user.username}\x1b[0m used \x1b[32m${action}\x1b[0m in guild \x1b[35m${interaction.guildId}\x1b[0m`);
        }
    });

    // Log command usage for music commands
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isChatInputCommand()) return;

        if (interaction.commandName === 'music') {
            const subcommand = interaction.options.getSubcommand();
            const query = interaction.options.getString('query') || 'N/A';
            console.log(`\x1b[36m[ MUSIC COMMAND ]\x1b[0m User \x1b[33m${interaction.user.username}\x1b[0m used \x1b[32m/music ${subcommand}\x1b[0m | Query: \x1b[36m${query.substring(0, 50)}${query.length > 50 ? '...' : ''}\x1b[0m`);
        }
    });

    // Log voice state changes for the bot
    client.on('voiceStateUpdate', (oldState, newState) => {
        if (newState.member.id === client.user.id) {
            if (!oldState.channelId && newState.channelId) {
                console.log(`\x1b[32m[ VOICE JOIN ]\x1b[0m Bot joined voice channel \x1b[33m${newState.channel.name}\x1b[0m in guild \x1b[35m${newState.guild.name}\x1b[0m`);
            } else if (oldState.channelId && !newState.channelId) {
                console.log(`\x1b[31m[ VOICE LEAVE ]\x1b[0m Bot left voice channel \x1b[33m${oldState.channel.name}\x1b[0m in guild \x1b[35m${oldState.guild.name}\x1b[0m`);
            } else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
                console.log(`\x1b[33m[ VOICE MOVE ]\x1b[0m Bot moved from \x1b[36m${oldState.channel.name}\x1b[0m to \x1b[36m${newState.channel.name}\x1b[0m in guild \x1b[35m${newState.guild.name}\x1b[0m`);
            }
        }
    });

    // Error logging for Lavalink
    process.on('unhandledRejection', (error) => {
        if (error.message && (error.message.includes('lavalink') || error.message.includes('riffy'))) {
            console.error(`\x1b[31m[ LAVALINK UNHANDLED ERROR ]\x1b[0m ${error.message}`);
            console.error(`\x1b[90m${error.stack}\x1b[0m`);
        }
    });

    console.log('\x1b[36m[ LAVALINK LOGS ]\x1b[0m All Lavalink event listeners registered 🎵');
};