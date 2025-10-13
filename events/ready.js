const { ActivityType } = require('discord.js');
const colors = require('../UI/colors/colors');
const config = require('../config'); // Sử dụng config.js
const StatusManager = require('../utils/statusManager');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log('\n' + '─'.repeat(45));
        console.log(`${colors.magenta}${colors.bright}🔗  TRẠNG THÁI HOẠT ĐỘNG BOT${colors.reset}`);
        console.log('─'.repeat(45));

        // Initialize single StatusManager instance
        if (!client.statusManager) {
            client.statusManager = new StatusManager(client);
            client.statusManager.start();
        }
        // Khởi tạo hệ thống invite tracking
        console.log(`${colors.cyan}[ INVITE SYSTEM ]${colors.reset} ${colors.cyan}Đang khởi tạo hệ thống theo dõi invite...${colors.reset}`);
        client.invites = new Map();
        let successfulGuilds = 0;
        let totalGuilds = client.guilds.cache.size;

        for (const [guildId, guild] of client.guilds.cache) {
            try {
                await new Promise(res => setTimeout(res, 300)); // Giảm delay
                const invites = await guild.invites.fetch();
                client.invites.set(
                    guildId,
                    new Map(invites.map(inv => [
                        inv.code,
                        {
                            inviterId: inv.inviter?.id || null,
                            uses: inv.uses
                        }
                    ]))
                );
                successfulGuilds++;
            } catch (err) {
                // Chỉ log vào debug mode
                if (process.env.NODE_ENV === 'development') {
                    console.warn(`${colors.yellow}[ DEBUG ]${colors.reset} ${colors.yellow}Không thể lấy invite cho ${guild.name}: ${err.message}${colors.reset}`);
                }
            }
        }
        
        console.log(`${colors.green}[ INVITE SYSTEM ]${colors.reset} ${colors.green}Đã khởi tạo thành công cho ${successfulGuilds}/${totalGuilds} server${colors.reset}`);

        // Status rotation is now handled by StatusManager

        console.log(`${colors.green}[ LÕI BOT ]${colors.reset} ${colors.green}Chu kỳ hoạt động bot đang chạy ✅${colors.reset}`);
        console.log(`${colors.cyan}[ THÔNG TIN ]${colors.reset} ${colors.cyan}Bot sẵn sàng phục vụ cộng đồng Việt Nam! 🇻🇳${colors.reset}`);
    }
};
