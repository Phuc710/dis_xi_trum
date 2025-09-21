const { EmbedBuilder, InteractionType, MessageFlags } = require('discord.js');

module.exports = async (client, message) => {
    // Cho Boo xử lý trước
    if (global.booBot) {
        const booHandled = await global.booBot.handleMessage(message);
        if (booHandled) return; // Boo đã xử lý, không cần làm gì thêm
    }
    
    // Music bot không xử lý message, chỉ xử lý slash commands
    // Nếu cần thêm message handling cho music bot thì thêm ở đây
};