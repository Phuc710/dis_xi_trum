const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
require('dotenv').config();
const axios = require('axios');
const config = require('./config.js');
const colors = require('./UI/colors/colors');
const loadLogHandlers = require('./logHandlers');
const scanCommands = require('./utils/scanCommands');
const { EmbedBuilder, Partials } = require('discord.js');
const StatusManager = require('./utils/statusManager');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildScheduledEvents
    ],
    partials: [Partials.Channel]
});
const { connectToDatabase } = require('./mongodb');
client.commands = new Collection();
require('events').defaultMaxListeners = 100;


const loadEvents = require('./handlers/events');


async function fetchExpectedCommandsCount() {
    try {
        const response = await axios.get('https://server-backend-tdpa.onrender.com/api/expected-commands-count');
        return response.data.expectedCommandsCount;
    } catch (error) {
        return -1;
    }
}

async function verifyCommandsCount() {

    console.log('\n' + '─'.repeat(60));
    console.log(`${colors.yellow}${colors.bright}             🔍 KIỂM TRA BẢO MẬT 🔍${colors.reset}`);
    console.log('─'.repeat(60));

    const expectedCommandsCount = await fetchExpectedCommandsCount();
    const registeredCommandsCount = scanCommands(config);


    if (expectedCommandsCount === -1) {
        console.log(`${colors.cyan}[ THÔNG TIN ]${colors.reset} ${colors.yellow}Trạng thái Server: OFFLINE (Kiểm tra xác minh bỏ qua)${colors.reset}`);
        console.log(`${colors.cyan}[ LỆNH BOT ]${colors.reset} ${colors.green}Số lượng lệnh đã tải: ${registeredCommandsCount} ✅${colors.reset}`);
        console.log(`${colors.cyan}[ TRẠNG THÁI ]${colors.reset} ${colors.green}Bot sẵn sàng hoạt động 🚀${colors.reset}`);
        return;
    }

    console.log(`${colors.cyan}[ LỆNH BOT ]${colors.reset} ${colors.green}Số lượng lệnh đã tải: ${registeredCommandsCount}${colors.reset}`);
    console.log(`${colors.cyan}[ THÔNG TIN ]${colors.reset} ${colors.blue}Số lệnh tham chiếu: ${expectedCommandsCount}${colors.reset}`);
    
    const difference = Math.abs(registeredCommandsCount - expectedCommandsCount);
    
    if (registeredCommandsCount !== expectedCommandsCount) {
        if (difference <= 10) {
            console.log(`${colors.cyan}[ TRẠNG THÁI ]${colors.reset} ${colors.green}Chênh lệch nhỏ (${difference} lệnh) - Bình thường ✓${colors.reset}`);
        } else {
            console.log(`${colors.yellow}[ LƯU Ý ]${colors.reset} ${colors.yellow}Chênh lệch: ${difference} lệnh - Có thể do cập nhật ⚠️${colors.reset}`);
        }
    } else {
        console.log(`${colors.cyan}[ BẢO MẬT ]${colors.reset} ${colors.green}Tính toàn vẹn lệnh đã xác minh ✅${colors.reset}`);
    }
    
    console.log(`${colors.cyan}[ TRẠNG THÁI ]${colors.reset} ${colors.green}Bot đã sẵn sàng phục vụ 🛡️${colors.reset}`);

    // Footer
    console.log('─'.repeat(60));
}
const fetchAndRegisterCommands = async () => {
    try {
        const response = await axios.get('https://server-backend-tdpa.onrender.com/api/commands');
        const commands = response.data;

        commands.forEach(command => {
            command.source = 'phucx';
            client.commands.set(command.name, {
                ...command,
                execute: async (interaction) => {
                    try {
                        const embed = new EmbedBuilder()
                            .setTitle(command.embed.title)
                            .setDescription(command.embed.description)
                            .setImage(command.embed.image)
                            .addFields(command.embed.fields)
                            .setColor(command.embed.color)
                            .setFooter({
                                text: command.embed.footer.text,
                                iconURL: command.embed.footer.icon_url
                            })
                            .setAuthor({
                                name: command.embed.author.name,
                                iconURL: command.embed.author.icon_url
                            });

                        await interaction.reply({ embeds: [embed] });
                    } catch (error) {
                        //console.error(`Error executing command ${command.name}:`, error);
                        //await interaction.reply('Failed to execute the command.');
                    }
                }
            });
        });
        //console.log('Commands fetched and registered successfully.');
    } catch (error) {
        //console.error('Error fetching commands:', error);
    }
};

require('./handlers/security')(client);     
require('./handlers/applications')(client); 
// Server is now started separately in server.js
require('./handlers/economyScheduler')(client);

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN || config.token);

client.once('clientReady', async () => {
    // Initialize status manager before loading events
    client.statusManager = new StatusManager(client);

    // Load events first when client is ready
    loadEvents(client);
    
    console.log('\n' + '─'.repeat(40));
    console.log(`${colors.magenta}${colors.bright}👾  THÔNG TIN BOT${colors.reset}`);
    console.log('─'.repeat(40));
    console.log(`${colors.red}[ LỘI BOT ]${colors.reset} ${colors.green}Tên Bot:  ${colors.reset}${client.user.tag}`);
    console.log(`${colors.red}[ LỘI BOT ]${colors.reset} ${colors.green}Client ID: ${colors.reset}${client.user.id}`);
    console.log(`${colors.red}[ LỘI BOT ]${colors.reset} ${colors.green}Trạng thái: ${colors.reset}✅ Đang hoạt động`);

    loadLogHandlers(client);

    try {
        await verifyCommandsCount();
        await fetchAndRegisterCommands();
        await require('./handlers/commands')(client, config, colors);

        if (client.statusManager) {
            const serverCount = client.guilds.cache.size;
            await client.statusManager.setServerCountStatus(serverCount);
        }
    } catch (error) {
        console.log(`${colors.red}[ LỖI HỆ THỐNG ]${colors.reset} ${colors.red}${error}${colors.reset}`);
    }
});




connectToDatabase().then(() => {
    console.log(`${colors.green}[ CƠ SỞ DỮ LIỆU ]${colors.reset} ${colors.green}MongoDB đã online và sẵn sàng ✅${colors.reset}`);
}).catch((error) => {
    console.error(`${colors.red}[ LỖI DATABASE ]${colors.reset} ${colors.red}Không thể kết nối MongoDB:${colors.reset}`, error.message);
});


const botToken = process.env.TOKEN || config.token;
if (!botToken) {
    console.error(`${colors.red}[ ERROR ]${colors.reset} ${colors.red}No bot token found in environment variables or config${colors.reset}`);
    process.exit(1);
}

// Xử lý tắt bot an toàn
process.on('SIGINT', () => {
    console.log(`\n${colors.yellow}[ TẮT BOT ]${colors.reset} ${colors.yellow}Đang tắt bot một cách an toàn... 🛑${colors.reset}`);
    console.log(`${colors.cyan}[ TẠM BIỆT ]${colors.reset} ${colors.cyan}Cảm ơn bạn đã sử dụng Boo Bot! 🚀${colors.reset}`);
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log(`\n${colors.yellow}[ TẮT BOT ]${colors.reset} ${colors.yellow}Đang tắt bot một cách an toàn... 🛑${colors.reset}`);
    console.log(`${colors.cyan}[ TẠM BIỆT ]${colors.reset} ${colors.cyan}Cảm ơn bạn đã sử dụng Boo Bot! 🚀${colors.reset}`);
    client.destroy();
    process.exit(0);
});

client.login(botToken);

module.exports = client;

