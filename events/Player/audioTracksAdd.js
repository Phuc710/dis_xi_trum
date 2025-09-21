// audioTracksAdd.js - Fixed version
const { EmbedBuilder } = require('discord.js');
const { Translate } = require('../../process_tools');

module.exports = async (queue, tracks) => {
    if (!queue.metadata?.channel || !client.config.app.extraMessages) return;
    
    try {
        const trackCount = tracks.length;
        const firstTrack = tracks[0]; // Lấy track đầu tiên để hiển thị
        
        const embed = new EmbedBuilder()
            .setAuthor({ 
                name: await Translate(`📂 Đã thêm ${trackCount} bài hát vào queue!`),
                iconURL: client.user.displayAvatarURL()
            })
            .setThumbnail(firstTrack?.thumbnail || null)
            .addFields(
                { 
                    name: '📊 Số lượng', 
                    value: `${trackCount} bài hát`, 
                    inline: true 
                },
                { 
                    name: '🎵 Playlist/Album', 
                    value: firstTrack?.playlist?.title || 'Multiple tracks', 
                    inline: true 
                },
                { 
                    name: '🔗 Nguồn', 
                    value: 'youtube', 
                    inline: true 
                }
            )
            .setFooter({ 
                text: `Yêu cầu bởi ${firstTrack?.requestedBy?.displayName || 'Unknown'} • ${new Date().toLocaleTimeString('vi-VN')} CH`,
                iconURL: firstTrack?.requestedBy?.displayAvatarURL() || null
            })
            .setColor('#00df07');

        await queue.metadata.channel.send({ embeds: [embed] });
    } catch (error) {
        console.log(`audioTracksAdd error: ${error.message}`);
    }
}