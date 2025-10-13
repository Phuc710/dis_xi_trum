const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const musicIcons = require('../../UI/icons/musicicons');
const SpotifyWebApi = require('spotify-web-api-node');
const { getData } = require('spotify-url-info')(fetch);
const config = require('../../config.js');

const spotifyApi = new SpotifyWebApi({
    clientId: config.spotifyClientId,
    clientSecret: config.spotifyClientSecret,
});

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('🎵 Phát nhạc - All-in-one music command')
        .addSubcommand(subcommand =>
            subcommand
                .setName('song')
                .setDescription('Phát bài hát hoặc playlist')
                .addStringOption(option =>
                    option.setName('query')
                        .setDescription('Tên bài hát, URL YouTube/Spotify')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('pause')
                .setDescription('Tạm dừng nhạc'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('resume')
                .setDescription('Tiếp tục phát nhạc'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('skip')
                .setDescription('Bỏ qua bài hiện tại'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('stop')
                .setDescription('Dừng nhạc và xóa queue'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('queue')
                .setDescription('Xem hàng đợi nhạc'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('nowplaying')
                .setDescription('Xem bài đang phát'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('volume')
                .setDescription('Điều chỉnh âm lượng')
                .addIntegerOption(option =>
                    option.setName('level')
                        .setDescription('Mức âm lượng 0-100')
                        .setRequired(true)
                        .setMinValue(0)
                        .setMaxValue(100)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('shuffle')
                .setDescription('Trộn ngẫu nhiên hàng đợi'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('loop')
                .setDescription('Chế độ lặp nhạc')
                .addStringOption(option =>
                    option.setName('mode')
                        .setDescription('Chọn chế độ lặp')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Tắt lặp', value: 'none' },
                            { name: 'Lặp bài hiện tại', value: 'track' },
                            { name: 'Lặp hàng đợi', value: 'queue' }
                        ))),

    async execute(interaction) {
        try {
            await interaction.deferReply();
            const subcommand = interaction.options.getSubcommand();
            const user = interaction.user;
            const member = interaction.member;
            const { channel } = member.voice;
            const client = interaction.client;
            const guildId = interaction.guild.id;

            // Helper functions
            const checkVoiceChannel = async () => {
                if (!channel) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription('❌ Bạn phải ở trong voice channel để sử dụng lệnh này.');
                    
                    const reply = await interaction.editReply({ embeds: [errorEmbed] });
                    setTimeout(() => reply.delete().catch(() => {}), 3000);
                    return false;
                }
                return true;
            };

            const getOrCreatePlayer = async () => {
                let player = client.riffy.players.get(guildId);
                
                if (!player) {
                    try {
                        player = await client.riffy.createConnection({
                            guildId,
                            voiceChannel: channel.id,
                            textChannel: interaction.channel.id,
                            deaf: true
                        });
                    } catch (error) {
                        console.error('Error creating player:', error);
                        await interaction.editReply({ content: '❌ Không thể kết nối đến voice channel.' });
                        return null;
                    }
                }
                return player;
            };

            const checkPlayerExists = async () => {
                const player = client.riffy.players.get(guildId);
                if (!player) {
                    const reply = await interaction.editReply({ content: '❌ Không có nhạc đang phát. Dùng `/play song` để bắt đầu!' });
                    setTimeout(() => reply.delete().catch(() => {}), 3000);
                    return false;
                }
                return player;
            };

            // Handle subcommands
            switch (subcommand) {
                case 'song': {
                    if (!await checkVoiceChannel()) return;
                    
                    const query = interaction.options.getString('query');
                    let player = await getOrCreatePlayer();
                    if (!player) return;

            // Xử lý Spotify links
            if (query.includes('spotify.com')) {
                try {
                    const spotifyData = await getData(query);
                    const token = await spotifyApi.clientCredentialsGrant();
                    spotifyApi.setAccessToken(token.body.access_token);
            
                    let trackList = [];
            
                    if (spotifyData.type === 'track') {
                        const searchQuery = `${spotifyData.name} - ${spotifyData.artists.map(a => a.name).join(', ')}`;
                        trackList.push(searchQuery);
                    } else if (spotifyData.type === 'playlist') {
                        const playlistId = query.split('/playlist/')[1].split('?')[0];
                        let offset = 0;
                        const limit = 100;
                        let fetched = [];
            
                        do {
                            const data = await spotifyApi.getPlaylistTracks(playlistId, { limit, offset });
                            fetched = data.body.items.filter(item => item.track).map(item =>
                                `${item.track.name} - ${item.track.artists.map(a => a.name).join(', ')}`
                            );
                            trackList.push(...fetched);
                            offset += limit;
                        } while (fetched.length === limit);
                    }

                    if (trackList.length === 0) {
                        await interaction.editReply({ 
                            content: "❌ Không tìm thấy track nào trong Spotify link này." 
                        });
                        return;
                    }
            
                    let added = 0;
                    for (const trackQuery of trackList) {
                        const result = await client.riffy.resolve({ query: trackQuery, requester: user });
                        if (result && result.tracks && result.tracks.length > 0) {
                            const resolvedTrack = result.tracks[0];
                            resolvedTrack.requester = {
                                id: user.id,
                                username: user.username,
                                avatarURL: user.displayAvatarURL()
                            };
                            player.queue.add(resolvedTrack);
                            added++;
                        }
                    }
            
                    const embed = new EmbedBuilder()
                        .setColor('#1DB954')
                        .setTitle(`🎵 Spotify ${spotifyData.type === 'track' ? 'Track' : 'Playlist'} Đã Thêm`)
                        .setDescription(`✅ Đã thêm ${added} track(s) từ Spotify vào hàng đợi.`)
                        .setFooter({ text: `Yêu cầu bởi: ${user.username}`, iconURL: user.displayAvatarURL() });
            
                    const reply = await interaction.editReply({ embeds: [embed] });
                    setTimeout(() => reply.delete().catch(() => {}), 3000);
            
                    if (!player.playing && !player.paused) player.play();
                } catch (spotifyError) {
                    console.error('Spotify error:', spotifyError);
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('❌ Lỗi Spotify')
                        .setDescription('Không thể xử lý Spotify link. Vui lòng kiểm tra thông tin Spotify hoặc thử link khác.')
                        .setFooter({ text: 'PHUCX Music Bot', iconURL: musicIcons.alertIcon });
                    
                    const reply = await interaction.editReply({ embeds: [errorEmbed] });
                    setTimeout(() => reply.delete().catch(() => {}), 5000);
                    return;
                }
            }  
            // Xử lý YouTube links
            else if (query.includes('youtube.com') || query.includes('youtu.be')) {
                let isPlaylist = query.includes('list=');
                let isMix = query.includes('list=RD');
        
                if (isMix) {
                    const mixEmbed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('❌ Nội Dung Không Hỗ Trợ')
                        .setDescription('YouTube mixes hiện tại không được hỗ trợ.\nVui lòng sử dụng track hoặc playlist khác.')
                        .setFooter({ text: 'PHUCX Music Bot', iconURL: musicIcons.alertIcon });
                
                    const reply = await interaction.editReply({ embeds: [mixEmbed] });
                    setTimeout(() => reply.delete().catch(() => {}), 3000);
                    return;
                }
                
                const resolve = await client.riffy.resolve({ query, requester: user });
                if (!resolve || !resolve.tracks || resolve.tracks.length === 0) {
                    const noResultsEmbed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('❌ Không Tìm Thấy Kết Quả')
                        .setDescription('Không thể tìm thấy track nào phù hợp với truy vấn của bạn.\nThử sửa đổi tìm kiếm.')
                        .setFooter({ text: 'PHUCX Music Bot', iconURL: musicIcons.alertIcon });
                
                    const reply = await interaction.editReply({ embeds: [noResultsEmbed] });
                    setTimeout(() => reply.delete().catch(() => {}), 3000);
                    return;
                }
                
                if (isPlaylist) {
                    for (const track of resolve.tracks) {
                        track.requester = {
                            id: user.id,
                            username: user.username,
                            avatarURL: user.displayAvatarURL()
                        };
                        player.queue.add(track);
                    }
        
                    const embed = new EmbedBuilder()
                        .setColor('#DC92FF')
                        .setAuthor({ name: 'Playlist Đã Thêm', iconURL: musicIcons.correctIcon })
                        .setFooter({ text: `Yêu cầu bởi: ${user.username}`, iconURL: user.displayAvatarURL() })
                        .setDescription(`✅ Đã thêm **PlayList** tracks vào hàng đợi.`);
        
                    const reply = await interaction.editReply({ 
                        embeds: [embed],
                        files: [{ attachment: musicIcons.wrongIconPath, name: 'wrong.gif' }]
                    });
                    setTimeout(() => reply.delete().catch(() => {}), 3000);
                } else {
                    const track = resolve.tracks[0];
                    track.requester = {
                        id: user.id,
                        username: user.username,
                        avatarURL: user.displayAvatarURL()
                    };
                    player.queue.add(track);
        
                    const embed = new EmbedBuilder()
                        .setColor('#DC92FF')
                        .setAuthor({ name: 'Track Đã Thêm', iconURL: musicIcons.correctIcon })
                        .setFooter({ text: `Yêu cầu bởi: ${user.username}`, iconURL: user.displayAvatarURL() })
                        .setDescription(`🎵 Đã thêm **${track.info.title}** vào hàng đợi.`);
        
                    const reply = await interaction.editReply({ 
                        embeds: [embed],
                        files: [{ attachment: musicIcons.wrongIconPath, name: 'wrong.gif' }]
                    });
                    setTimeout(() => reply.delete().catch(() => {}), 3000);
                }
        
                if (!player.playing && !player.paused) player.play();
            }
            // Xử lý tìm kiếm thông thường
            else {
                const resolve = await client.riffy.resolve({ query, requester: user });
                
                if (!resolve || !resolve.tracks || resolve.tracks.length === 0) {
                    const noResultsEmbed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('❌ Không Tìm Thấy Kết Quả')
                        .setDescription('Không thể tìm thấy track nào phù hợp với truy vấn của bạn.\nThử sửa đổi tìm kiếm.')
                        .setFooter({ text: 'PHUCX Music Bot', iconURL: musicIcons.alertIcon });
                
                    const reply = await interaction.editReply({ embeds: [noResultsEmbed] });
                    setTimeout(() => reply.delete().catch(() => {}), 3000);
                    return;
                }

                const track = resolve.tracks[0];
                track.requester = {
                    id: user.id,
                    username: user.username,
                    avatarURL: user.displayAvatarURL()
                };
                player.queue.add(track);

                const embed = new EmbedBuilder()
                    .setColor('#DC92FF')
                    .setAuthor({ name: 'Track Đã Thêm', iconURL: musicIcons.correctIcon })
                    .setFooter({ text: `Yêu cầu bởi: ${user.username}`, iconURL: user.displayAvatarURL() })
                    .setDescription(`🎵 Đã thêm **${track.info.title}** vào hàng đợi.`);

                const reply = await interaction.editReply({ 
                    embeds: [embed],
                    files: [{ attachment: musicIcons.wrongIconPath, name: 'wrong.gif' }]
                });
                setTimeout(() => reply.delete().catch(() => {}), 3000);

                if (!player.playing && !player.paused) player.play();
            }
                    break;
                }

                case 'pause': {
                    const player = await checkPlayerExists();
                    if (!player) return;
                    
                    if (player.paused) {
                        const reply = await interaction.editReply({ content: '⏸️ Nhạc đã được tạm dừng rồi.' });
                        setTimeout(() => reply.delete().catch(() => {}), 3000);
                        return;
                    }
                    
                    player.pause(true);
                    const reply = await interaction.editReply({ content: '⏸️ Đã tạm dừng nhạc.' });
                    setTimeout(() => reply.delete().catch(() => {}), 3000);
                    break;
                }

                case 'resume': {
                    const player = await checkPlayerExists();
                    if (!player) return;
                    
                    if (!player.paused) {
                        const reply = await interaction.editReply({ content: '▶️ Nhạc chưa bị tạm dừng.' });
                        setTimeout(() => reply.delete().catch(() => {}), 3000);
                        return;
                    }
                    
                    player.pause(false);
                    const reply = await interaction.editReply({ content: '▶️ Tiếp tục phát nhạc.' });
                    setTimeout(() => reply.delete().catch(() => {}), 3000);
                    break;
                }

                case 'skip': {
                    const player = await checkPlayerExists();
                    if (!player) return;
                    
                    if (player.queue.length === 0) {
                        const reply = await interaction.editReply({ content: '⏭️ Không có bài tiếp theo để bỏ qua.' });
                        setTimeout(() => reply.delete().catch(() => {}), 3000);
                        return;
                    }
                    
                    const currentTrack = player.current?.info?.title || 'Bài hát không xác định';
                    player.stop();
                    const reply = await interaction.editReply({ content: `⏭️ Đã bỏ qua: **${currentTrack}**` });
                    setTimeout(() => reply.delete().catch(() => {}), 3000);
                    break;
                }

                case 'stop': {
                    const player = await checkPlayerExists();
                    if (!player) return;
                    
                    player.destroy();
                    const reply = await interaction.editReply({ content: '⏹️ Đã dừng nhạc và xóa hàng đợi.' });
                    setTimeout(() => reply.delete().catch(() => {}), 3000);
                    break;
                }

                case 'queue': {
                    const player = await checkPlayerExists();
                    if (!player) return;
                    
                    const queue = player.queue;
                    if (!queue || queue.length === 0) {
                        const reply = await interaction.editReply({ content: '📭 Hàng đợi đang trống.' });
                        setTimeout(() => reply.delete().catch(() => {}), 3000);
                        return;
                    }
                    
                    const maxDisplay = 10;
                    const displayQueue = queue.slice(0, maxDisplay);
                    const formattedQueue = displayQueue.map((track, i) => {
                        const requester = track.requester?.username || 'Không xác định';
                        return `${i + 1}. **${track.info.title}**\n   👤 ${requester}`;
                    }).join('\n\n');
                    
                    const queueEmbed = new EmbedBuilder()
                        .setColor('#DC92FF')
                        .setTitle('🎶 Hàng Đợi Hiện Tại')
                        .setDescription(formattedQueue)
                        .setFooter({ 
                            text: queue.length > maxDisplay 
                                ? `Hiển thị ${maxDisplay}/${queue.length} bài hát` 
                                : `Tổng cộng ${queue.length} bài hát`
                        });
                    
                    await interaction.editReply({ embeds: [queueEmbed] });
                    break;
                }

                case 'nowplaying': {
                    const player = await checkPlayerExists();
                    if (!player) return;
                    
                    const currentTrack = player.current;
                    if (!currentTrack) {
                        const reply = await interaction.editReply({ content: '❌ Không có bài hát đang phát.' });
                        setTimeout(() => reply.delete().catch(() => {}), 3000);
                        return;
                    }
                    
                    const npEmbed = new EmbedBuilder()
                        .setColor('#00D4FF')
                        .setTitle('🎵 Đang Phát')
                        .setDescription(`**${currentTrack.info.title}**`)
                        .addFields(
                            { name: '🎤 Tác giả', value: `\`${currentTrack.info.author || 'Không xác định'}\``, inline: true },
                            { name: '👤 Yêu cầu bởi', value: `<@${currentTrack.requester?.id || user.id}>`, inline: true }
                        );
                    
                    if (currentTrack.info.artwork) {
                        npEmbed.setThumbnail(currentTrack.info.artwork);
                    }
                    
                    const reply = await interaction.editReply({ embeds: [npEmbed] });
                    setTimeout(() => reply.delete().catch(() => {}), 10000);
                    break;
                }

                case 'volume': {
                    const player = await checkPlayerExists();
                    if (!player) return;
                    
                    const volume = interaction.options.getInteger('level');
                    player.setVolume(volume);
                    const reply = await interaction.editReply({ content: `🔊 Âm lượng đã được đặt thành **${volume}%**` });
                    setTimeout(() => reply.delete().catch(() => {}), 3000);
                    break;
                }

                case 'shuffle': {
                    const player = await checkPlayerExists();
                    if (!player) return;
                    
                    if (player.queue.length < 2) {
                        const reply = await interaction.editReply({ content: '❌ Cần ít nhất 2 bài hát trong hàng đợi để trộn.' });
                        setTimeout(() => reply.delete().catch(() => {}), 3000);
                        return;
                    }
                    
                    player.queue.shuffle();
                    const reply = await interaction.editReply({ content: '🔀 Đã trộn ngẫu nhiên hàng đợi!' });
                    setTimeout(() => reply.delete().catch(() => {}), 3000);
                    break;
                }

                case 'loop': {
                    const player = await checkPlayerExists();
                    if (!player) return;
                    
                    const mode = interaction.options.getString('mode');
                    
                    try {
                        player.setLoop(mode);
                        const modeText = mode === 'none' ? 'Tắt lặp' : 
                                        mode === 'track' ? 'Lặp bài hiện tại' : 'Lặp hàng đợi';
                        const reply = await interaction.editReply({ content: `🔁 Chế độ lặp: **${modeText}**` });
                        setTimeout(() => reply.delete().catch(() => {}), 3000);
                    } catch (error) {
                        console.error('Error setting loop mode:', error);
                        const reply = await interaction.editReply({ content: '❌ Không thể thiết lập chế độ lặp.' });
                        setTimeout(() => reply.delete().catch(() => {}), 3000);
                    }
                    break;
                }
            }
        } catch (error) {
            console.error('Error in play command:', error);
        
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Đã Xảy Ra Lỗi')
                .setDescription('Có gì đó sai khi xử lý yêu cầu của bạn.\n\n**Mẹo:**\n- Thử thay đổi Lavalink trong config.\n- Kiểm tra URL track/playlist.')
                .setFooter({ text: 'PHUCX Music Bot', iconURL: musicIcons.alertIcon })
                .setTimestamp();
        
            const reply = await interaction.editReply({ embeds: [errorEmbed] });
        
            setTimeout(() => {
                reply.delete().catch(() => {});
            }, 6000);
        }
    }
};
