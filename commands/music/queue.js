const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { useQueue } = require('discord-player');
const { Translate } = require('../../process_tools');

module.exports = {
    name: 'queue',
    description: 'Get the songs in the queue',
    voiceChannel: true,

    async execute({ client, inter }) {
        const queue = useQueue(inter.guild);

        if (!queue) {
            const noQueueEmbed = new EmbedBuilder()
                .setColor('#ff6b6b')
                .setTitle('🎵 Không có nhạc đang phát')
                .setDescription('Hiện tại không có nhạc nào đang phát. Sử dụng `/play` để bắt đầu!')
                .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
                .setFooter({ text: `Requested by ${inter.member.displayName}`, iconURL: inter.member.avatarURL({ dynamic: true }) })
                .setTimestamp();
            
            return inter.editReply({ embeds: [noQueueEmbed] });
        }

        if (!queue.tracks.toArray()[0]) {
            const emptyQueueEmbed = new EmbedBuilder()
                .setColor('#ffa726')
                .setTitle('📭 Queue trống')
                .setDescription('Không có bài hát nào trong queue sau bài hiện tại.')
                .addFields(
                    { 
                        name: '🎵 Đang phát', 
                        value: `**${queue.currentTrack.title}**\n*${queue.currentTrack.author}*`, 
                        inline: false 
                    }
                )
                .setThumbnail(queue.currentTrack.thumbnail)
                .setFooter({ text: `Requested by ${inter.member.displayName}`, iconURL: inter.member.avatarURL({ dynamic: true }) })
                .setTimestamp();
            
            return inter.editReply({ embeds: [emptyQueueEmbed] });
        }

        // Get queue info
        const methods = ['🔀', '🔁', '🔂'];
        const repeatModeText = ['Shuffle', 'Queue Loop', 'Track Loop'];
        const songs = queue.tracks.size;
        const currentTrack = queue.currentTrack;
        
        // Calculate total duration
        const totalDuration = queue.tracks.toArray().reduce((total, track) => {
            const duration = track.durationMS || 0;
            return total + duration;
        }, 0);
        
        const formatDuration = (ms) => {
            const hours = Math.floor(ms / 3600000);
            const minutes = Math.floor((ms % 3600000) / 60000);
            const seconds = Math.floor((ms % 60000) / 1000);
            if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        };

        // Create track list with better formatting
        const tracks = queue.tracks.toArray().slice(0, 10).map((track, i) => {
            const duration = track.duration || 'N/A';
            const requester = track.requestedBy?.displayName || 'Unknown';
            const trackNumber = `\`${(i + 1).toString().padStart(2, '0')}\``;
            return `${trackNumber} **${track.title}**\n    *${track.author}* • \`${duration}\` • ${requester}`;
        });

        // Main embed
        const embed = new EmbedBuilder()
            .setColor('#4CAF50')
            .setTitle(`🎵 Server Queue - ${inter.guild.name}`)
            .setThumbnail(inter.guild.iconURL({ size: 256, dynamic: true }))
            .addFields(
                {
                    name: '▶️ Đang phát ngay bây giờ',
                    value: `**${currentTrack.title}**\n*${currentTrack.author}* • \`${currentTrack.duration}\`\nYêu cầu bởi: ${currentTrack.requestedBy?.displayName || 'Unknown'}`,
                    inline: false
                },
                {
                    name: `📋 Tiếp theo trong queue (${songs} bài)`,
                    value: tracks.length > 0 ? tracks.join('\n\n') : 'Không có bài nào',
                    inline: false
                }
            )
            .setFooter({ 
                text: `${methods[queue.repeatMode]} ${repeatModeText[queue.repeatMode]} • Tổng thời gian: ${formatDuration(totalDuration)}`,
                iconURL: client.user.displayAvatarURL({ size: 64 })
            })
            .setTimestamp();

        // Add thumbnail from current track
        if (currentTrack.thumbnail) {
            embed.setImage(currentTrack.thumbnail);
        }

        // Show more info if queue is long
        if (songs > 10) {
            embed.addFields({
                name: '📈 Thống kê',
                value: `• **${songs}** bài trong queue\n• **${songs - 10}** bài không hiển thị\n• Tổng thời lượng: \`${formatDuration(totalDuration)}\``,
                inline: true
            });
        }

        // Create buttons for queue control
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('queue_previous')
                .setLabel('Previous Page')
                .setEmoji('⏮️')
                .setStyle('Secondary')
                .setDisabled(true), // For now, since we're showing first page
            
            new ButtonBuilder()
                .setCustomId('queue_refresh')
                .setLabel('Refresh')
                .setEmoji('🔄')
                .setStyle('Primary'),
            
            new ButtonBuilder()
                .setCustomId('queue_next')
                .setLabel('Next Page')
                .setEmoji('⏭️')
                .setStyle('Secondary')
                .setDisabled(songs <= 10),
            
            new ButtonBuilder()
                .setCustomId('queue_shuffle')
                .setLabel('Shuffle')
                .setEmoji('🔀')
                .setStyle('Success'),
            
            new ButtonBuilder()
                .setCustomId('queue_clear')
                .setLabel('Clear')
                .setEmoji('🗑️')
                .setStyle('Danger')
        );

        await inter.editReply({ embeds: [embed], components: [row] });
    }
}