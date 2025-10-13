const { EmbedBuilder } = require('discord.js');
const phucx = require('../phucx');
const musicIcons = require('../UI/icons/musicicons');
const { centralMusicCollection } = require('../mongodb');

module.exports = (client) => {
    client.on('messageCreate', async (message) => {
        try {
            // Bỏ qua bot messages và DM
            if (message.author.bot || !message.guild) return;

            const serverId = message.guild.id;
            const channelId = message.channel.id;

            // Kiểm tra xem channel này có được setup central music không
            const config = await centralMusicCollection.findOne({ serverId: serverId });
            if (!config || !config.status || config.channelId !== channelId) return;
            
            // Kiểm tra permissions nếu có allowed role
            if (config.allowedRoleId) {
                if (!message.member.roles.cache.has(config.allowedRoleId)) {
                    return;
                }
            }

            // Kiểm tra xem tin nhắn có phải là music request không
            const messageContent = message.content.trim();
            
            // Bỏ qua tin nhắn quá ngắn hoặc chỉ là emoji/commands
            if (messageContent.length < 2 || 
                messageContent.startsWith('/') || 
                messageContent.startsWith('!') ||
                messageContent.startsWith('?') ||
                /^[\s\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}\p{Extended_Pictographic}]+$/u.test(messageContent)) {
                return;
            }

            // Kiểm tra security
            if (!phucx || !phucx.validateCore || !phucx.validateCore()) {
                return;
            }

            // Kiểm tra user có trong voice channel không
            const member = message.member;
            if (!member.voice.channel) {
                await message.react('❌');
                const errorEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setDescription('❌ Bạn phải ở trong voice channel để sử dụng hệ thống nhạc tập trung.');
                
                const reply = await message.reply({ embeds: [errorEmbed] });
                setTimeout(() => reply.delete().catch(() => {}), 5000);
                return;
            }

            // Nếu có voice channel được cấu hình, kiểm tra user có đúng channel không
            if (config.voiceChannelId && member.voice.channel.id !== config.voiceChannelId) {
                await message.react('❌');
                const configuredChannel = message.guild.channels.cache.get(config.voiceChannelId);
                const errorEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setDescription(`❌ Bạn phải ở trong ${configuredChannel} để sử dụng hệ thống nhạc tập trung.`);
                
                const reply = await message.reply({ embeds: [errorEmbed] });
                setTimeout(() => reply.delete().catch(() => {}), 5000);
                return;
            }
            
            // Nếu không có voice channel cấu hình, dùng voice channel của user hoặc voice channel đã setup
            const targetVoiceChannel = config.voiceChannelId ? 
                message.guild.channels.cache.get(config.voiceChannelId) : 
                member.voice.channel;

            // Thêm reaction "đang xử lý"
            await message.react('⏳');

            try {
                // Lấy hoặc tạo player
                let player = client.riffy.players.get(serverId);
                
                if (!player) {
                    try {
                        player = await client.riffy.createConnection({
                            guildId: serverId,
                            voiceChannel: targetVoiceChannel.id,
                            textChannel: channelId,
                            deaf: true
                        });
                    } catch (error) {
                        console.error('Error creating player:', error);
                        await message.reactions.removeAll().catch(() => {});
                        await message.react('❌');
                        return;
                    }
                }

                // Resolve track từ query
                const resolve = await client.riffy.resolve({ 
                    query: messageContent, 
                    requester: message.author 
                });

                if (!resolve || !resolve.tracks || resolve.tracks.length === 0) {
                    await message.reactions.removeAll().catch(() => {});
                    await message.react('❌');
                    
                    const noResultsEmbed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription('❌ Không tìm thấy bài hát nào phù hợp với yêu cầu của bạn.');
                    
                    const reply = await message.reply({ embeds: [noResultsEmbed] });
                    setTimeout(() => reply.delete().catch(() => {}), 5000);
                    return;
                }

                // Thêm track vào queue
                const track = resolve.tracks[0];
                track.requester = {
                    id: message.author.id,
                    username: message.author.username,
                    avatarURL: message.author.displayAvatarURL()
                };

                player.queue.add(track);

                // Xóa reaction "đang xử lý" và thêm reaction thành công
                await message.reactions.removeAll().catch(() => {});
                await message.react('✅');

                // Tạo embed thông báo thông minh
                const trackEmbed = new EmbedBuilder()
                    .setTitle('🎵 Bài Hát Đã Được Thêm')
                    .setDescription(`**${track.info.title}**`)
                    .addFields(
                        {
                            name: '🎤 Nghệ sĩ',
                            value: track.info.author || 'Unknown',
                            inline: true
                        },
                        {
                            name: '👤 Yêu cầu bởi',
                            value: `<@${message.author.id}>`,
                            inline: true
                        },
                        {
                            name: '⏰ Thời lượng',
                            value: formatDuration(track.info.length),
                            inline: true
                        },
                        {
                            name: '🔊 Âm lượng',
                            value: `${player.volume || 50}%`,
                            inline: true
                        },
                        {
                            name: '🎶 Trạng thái',
                            value: player.queue.length > 1 ? 
                                `Vị trí trong hàng đợi: #${player.queue.length}` : 
                                '🎶 **Đang phát ngay bây giờ!**',
                            inline: false
                        },
                        {
                            name: '💡 Mẹo',
                            value: '🎶 **Thích không? Gõ thêm tên bài hát để tiếp tục!**',
                            inline: false
                        }
                    )
                    .setColor('#00c3ff')
                    .setFooter({ 
                        text: 'Boo Music Bot - Central System', 
                        iconURL: client.user.displayAvatarURL() 
                    })
                    .setTimestamp();

                if (track.info.artwork) {
                    trackEmbed.setThumbnail(track.info.artwork);
                }

                // Gửi thông báo (tự xóa sau 10 giây)
                const trackMessage = await message.reply({ embeds: [trackEmbed] });
                setTimeout(() => trackMessage.delete().catch(() => {}), 10000);

                // Bắt đầu phát nếu chưa phát
                if (!player.playing && !player.paused) {
                    player.play();
                }

            } catch (error) {
                console.error('Error in central music auto-play:', error);
                await message.reactions.removeAll().catch(() => {});
                await message.react('❌');
                
                const errorEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setDescription('❌ Có lỗi xảy ra khi xử lý yêu cầu nhạc của bạn.');
                
                const reply = await message.reply({ embeds: [errorEmbed] });
                setTimeout(() => reply.delete().catch(() => {}), 5000);
            }

        } catch (error) {
            console.error('Error in centralMusicAutoPlay:', error);
        }
    });
};

// Helper function để format thời gian
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
}

