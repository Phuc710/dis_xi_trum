const colors = require('../UI/colors/colors');

module.exports = {
    name: 'guildCreate',
    async execute(client, guild) {
        console.log(`${colors.green}[ GUILD JOIN ]${colors.reset} ${colors.green}Bot đã join server: ${guild.name} (ID: ${guild.id})${colors.reset}`);
        
        // Update server count status
        if (client.statusManager) {
            const serverCount = client.guilds.cache.size;
            await client.statusManager.setServerCountStatus(serverCount);
        }
    }
};

// Export guildDelete event as well
module.exports.guildDelete = {
    name: 'guildDelete',
    async execute(client, guild) {
        console.log(`${colors.yellow}[ GUILD LEAVE ]${colors.reset} ${colors.yellow}Bot đã leave server: ${guild.name} (ID: ${guild.id})${colors.reset}`);
        
        // Update server count status
        if (client.statusManager) {
            const serverCount = client.guilds.cache.size;
            await client.statusManager.setServerCountStatus(serverCount);
        }
    }
};