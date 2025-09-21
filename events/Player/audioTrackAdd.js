const { EmbedBuilder } = require('discord.js');
const { Translate } = require('../../process_tools');

module.exports = async (queue, track) => {
    console.log(`🎵 audioTrackAdd triggered - Track: ${track.title}`);
    console.log(`📊 Queue size: ${queue.size}`);
    console.log(`📺 Channel exists: ${!!queue.metadata?.channel}`);
    
    if (!queue.metadata?.channel || !client.config.app.extraMessages) return;

    try {
        const embed = new EmbedBuilder()
            .setAuthor({ 
                name: await Translate(`🎵 Đã thêm vào queue!`),
                iconURL: client.user.displayAvatarURL()
            })
            .setThumbnail(track.thumbnail)
            .addFields(
                { 
                    name: '🎵 Bài hát', 
                    value: track.title || 'Unknown', 
                    inline: true 
                },
                { 
                    name: '👤 Nghệ sĩ', 
                    value: track.author || 'Unknown', 
                    inline: true 
                },
                { 
                    name: '⏱️ Thời lượng', 
                    value: track.duration || 'Unknown', 
                    inline: true 
                },
                { 
                    name: '🔗 Nguồn', 
                    value: track.source || 'youtube', 
                    inline: false 
                }
            )
            .setFooter({ 
                text: `Yêu cầu bởi ${track.requestedBy?.displayName || 'Unknown'} • ${new Date().toLocaleTimeString('vi-VN')} CH`,
                iconURL: track.requestedBy?.displayAvatarURL() || null
            })
            .setColor('#00ac22');

        await queue.metadata.channel.send({ embeds: [embed] });
    } catch (error) {
        console.log(`audioTrackAdd error: ${error.message}`);
    }
}