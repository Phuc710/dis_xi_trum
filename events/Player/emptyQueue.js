// events/Player/emptyQueue.js - Optional customization
const { EmbedBuilder } = require('discord.js');

module.exports = async (queue) => {
    console.log(`📭 emptyQueue triggered`);
    
    if (!queue.metadata?.channel) return;
    
    // Optional: Only show message if explicitly enabled in config
    if (!client.config.app.showEmptyQueueMessage) return;

    try {
        const embed = new EmbedBuilder()
            .setAuthor({ 
                name: '🎵 Playlist ended',
                iconURL: client.user.displayAvatarURL()
            })
            .setDescription('✨ Đã phát xong tất cả bài hát. Cảm ơn bạn đã nghe nhạc!')
            .setColor('#4CAF50')
            .setFooter({ 
                text: `${new Date().toLocaleTimeString('vi-VN')} CH`
            });

        await queue.metadata.channel.send({ embeds: [embed] });
    } catch (error) {
        console.log(`emptyQueue error: ${error.message}`);
    }
};
