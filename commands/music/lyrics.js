const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const musicIcons = require('../../UI/icons/musicicons');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lyrics')
        .setDescription('Hiển thị lời bài hát đang phát hoặc tìm lời bài hát')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Tên bài hát để tìm lời (để trống để lấy bài đang phát)')
                .setRequired(false)),

    async execute(interaction) {
        try {
            await interaction.deferReply();
            const client = interaction.client;
            const guildId = interaction.guild.id;
            const query = interaction.options.getString('query');

            // Kiểm tra player có tồn tại không
            const player = client.riffy?.players?.get(guildId);
            
            let trackName, artistName, duration;

            if (query) {
                // Nếu có query, tìm lời bài hát theo tên
                const parts = query.split(' - ');
                if (parts.length >= 2) {
                    artistName = parts[0].trim();
                    trackName = parts.slice(1).join(' - ').trim();
                } else {
                    trackName = query.trim();
                    artistName = '';
                }
                duration = 0; // Không có thời lượng cho tìm kiếm thủ công
            } else {
                // Nếu không có query, lấy bài đang phát
                if (!player || !player.current || !player.current.info) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('❌ Không Có Bài Hát Đang Phát')
                        .setDescription('Không có bài hát nào đang phát.\nSử dụng `/play` để phát nhạc hoặc nhập tên bài hát vào option `query`.')
                        .setFooter({ text: 'PHUCX Music Bot', iconURL: musicIcons.alertIcon });
                
                    const reply = await interaction.editReply({ embeds: [errorEmbed] });
                    setTimeout(() => reply.delete().catch(() => {}), 5000);
                    return;
                }
                
                trackName = player.current.info.title;
                artistName = player.current.info.author;
                duration = Math.floor(player.current.info.length / 1000);
            }

            // Lấy lời bài hát
            const lyrics = await this.getLyrics(trackName, artistName, duration);
            
            if (!lyrics) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('❌ Không Tìm Thấy Lời Bài Hát')
                    .setDescription(`Không thể tìm thấy lời bài hát cho: **${trackName}**${artistName ? ` - ${artistName}` : ''}\n\n**Mẹo:**\n- Thử nhập tên bài hát chính xác hơn\n- Bao gồm tên nghệ sĩ\n- Kiểm tra chính tả`)
                    .setFooter({ text: 'PHUCX Music Bot', iconURL: musicIcons.alertIcon });
                
                const reply = await interaction.editReply({ embeds: [errorEmbed] });
                setTimeout(() => reply.delete().catch(() => {}), 8000);
                return;
            }

            const lines = lyrics.split('\n').map(line => line.trim()).filter(Boolean);
            
            // Tạo embed với lời bài hát - design mới
            const lyricsEmojis = ['🎵', '🎶', '🎼', '🎤', '🎸', '🎹'];
            const randomLyricsEmoji = lyricsEmojis[Math.floor(Math.random() * lyricsEmojis.length)];
            
            const embed = new EmbedBuilder()
                .setTitle(`${randomLyricsEmoji} Lyrics: ${trackName} 🎭`)
                .setDescription(artistName ? `🎤 **Artist:** \`${artistName}\`\n🎵 **Let's sing along!** 🎵` : '🎵 **Ready to sing along!** 🎵')
                .setColor('#FF6B9D')
                .setFooter({ 
                    text: `🎤 Sing it loud! • Requested by ${interaction.user.username}`, 
                    iconURL: interaction.user.displayAvatarURL() 
                });

            // Nếu có player và đang phát bài này, hiển thị live lyrics
            if (!query && player && player.current && player.current.info.title === trackName) {
                embed.setDescription(`**Nghệ sĩ:** ${artistName}\n\n🔄 **Live Lyrics** - Đang đồng bộ với bài hát...`);
                
                const stopButton = new ButtonBuilder()
                    .setCustomId("stopLyrics")
                    .setLabel("Dừng Live Lyrics")
                    .setStyle(ButtonStyle.Danger);
                
                const fullButton = new ButtonBuilder()
                    .setCustomId("fullLyrics")
                    .setLabel("Xem Toàn Bộ")
                    .setStyle(ButtonStyle.Primary);
                
                const row = new ActionRowBuilder().addComponents(fullButton, stopButton);
                
                const message = await interaction.editReply({ embeds: [embed], components: [row] });
                
                // Bắt đầu live lyrics
                this.startLiveLyrics(client, guildId, message, lines, player, trackName, artistName);
            } else {
                // Hiển thị toàn bộ lời bài hát với format đẹp
                const formattedLyrics = this.formatLyricsForDisplay(lines);
                
                // Kiểm tra độ dài và chia nhỏ nếu cần
                if (formattedLyrics.length > 4096) {
                    const chunks = this.chunkText(formattedLyrics, 4096);
                    embed.setDescription(`**Nghệ sĩ:** ${artistName}\n\n${chunks[0]}`);
                    
                    const deleteButton = new ButtonBuilder()
                        .setCustomId("deleteLyrics")
                        .setLabel("Xóa")
                        .setStyle(ButtonStyle.Danger);
                    
                    const nextButton = new ButtonBuilder()
                        .setCustomId("nextLyrics")
                        .setLabel("Trang Tiếp")
                        .setStyle(ButtonStyle.Primary);
                    
                    const row = new ActionRowBuilder().addComponents(nextButton, deleteButton);
                    
                    const message = await interaction.editReply({ embeds: [embed], components: [row] });
                    
                    // Lưu trữ chunks để điều hướng
                    message.lyricsChunks = chunks;
                    message.currentChunk = 0;
                    message.artistName = artistName;
                    
                    this.setupLyricsNavigation(message);
                } else {
                    embed.setDescription(`**Nghệ sĩ:** ${artistName}\n\n${formattedLyrics}`);
                    
                    const deleteButton = new ButtonBuilder()
                        .setCustomId("deleteLyrics")
                        .setLabel("Xóa")
                        .setStyle(ButtonStyle.Danger);
                    
                    const row = new ActionRowBuilder().addComponents(deleteButton);
                    
                    await interaction.editReply({ embeds: [embed], components: [row] });
                }
            }
        } catch (error) {
            console.error('Error in lyrics command:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Đã Xảy Ra Lỗi')
                .setDescription('Có lỗi xảy ra khi thực hiện lệnh. Vui lòng thử lại sau.')
                .setFooter({ text: 'PHUCX Music Bot', iconURL: musicIcons.alertIcon });
            
            const reply = await interaction.editReply({ embeds: [errorEmbed] });
            setTimeout(() => reply.delete().catch(() => {}), 3000);
        }
    },

    async getLyrics(trackName, artistName, duration) {
        try {
            // Làm sạch tên bài hát
            trackName = trackName
                .replace(/\b(Official|Audio|Video|Lyrics|Theme|Soundtrack|Music|Full Version|HD|4K|Visualizer|Radio Edit|Live|Remix|Mix|Extended|Cover|Parody|Performance|Version|Unplugged|Reupload)\b/gi, "") 
                .replace(/\s*[-_/|]\s*/g, " ") 
                .replace(/\s+/g, " ") 
                .trim();
    
            // Làm sạch tên nghệ sĩ
            artistName = artistName
                .replace(/\b(Topic|VEVO|Records|Label|Productions|Entertainment|Ltd|Inc|Band|DJ|Composer|Performer)\b/gi, "")
                .replace(/ x /gi, " & ") 
                .replace(/\s+/g, " ") 
                .trim();
    
            // Thử tìm với thời lượng
            let response = await axios.get(`https://lrclib.net/api/get`, {
                params: { track_name: trackName, artist_name: artistName, duration },
                timeout: 5000 
            });
    
            if (response.data.syncedLyrics || response.data.plainLyrics) {
                return this.cleanLyrics(response.data.syncedLyrics || response.data.plainLyrics);
            }
    
            // Thử tìm không có thời lượng
            response = await axios.get(`https://lrclib.net/api/get`, {
                params: { track_name: trackName, artist_name: artistName },
                timeout: 5000
            });
    
            return this.cleanLyrics(response.data.syncedLyrics || response.data.plainLyrics);
        } catch (error) {
            console.error("❌ Lyrics fetch error:", error.response?.data?.message || error.message);
            return null;
        }
    },

    cleanLyrics(lyrics) {
        if (!lyrics) return null;
        
        // Loại bỏ timestamps và làm sạch lyrics
        let cleanedLyrics = lyrics
            // Loại bỏ timestamps [mm:ss.xxx]
            .replace(/\[\d{2}:\d{2}\.\d{3}\]/g, '')
            // Loại bỏ timestamps [mm:ss]
            .replace(/\[\d{2}:\d{2}\]/g, '')
            // Loại bỏ timestamps [m:ss]
            .replace(/\[\d{1,2}:\d{2}\]/g, '')
            // Loại bỏ timestamps [ss]
            .replace(/\[\d{1,2}\]/g, '')
            // Loại bỏ các ký tự đặc biệt khác
            .replace(/\[.*?\]/g, '')
            // Loại bỏ dòng trống thừa
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            // Loại bỏ khoảng trắng thừa
            .replace(/^\s+|\s+$/gm, '')
            .trim();
        
        return cleanedLyrics;
    },

    formatLyricsForDisplay(lines) {
        if (!lines || lines.length === 0) return '';
        
        const formattedLines = lines.map((line, index) => {
            // Bỏ qua dòng trống
            if (!line.trim()) return '';
            
            const trimmedLine = line.trim();
            
            // Thêm emoji cho các dòng đặc biệt với animation
            let emoji = '';
            let prefix = '';
            
            if (trimmedLine.toLowerCase().includes('chorus') || trimmedLine.toLowerCase().includes('điệp khúc')) {
                emoji = '🎵 ';
                prefix = '**[CHORUS]** ';
            } else if (trimmedLine.toLowerCase().includes('verse') || trimmedLine.toLowerCase().includes('khổ')) {
                emoji = '🎤 ';
                prefix = '**[VERSE]** ';
            } else if (trimmedLine.toLowerCase().includes('bridge') || trimmedLine.toLowerCase().includes('cầu')) {
                emoji = '🌉 ';
                prefix = '**[BRIDGE]** ';
            } else if (trimmedLine.toLowerCase().includes('outro') || trimmedLine.toLowerCase().includes('kết')) {
                emoji = '🎭 ';
                prefix = '**[OUTRO]** ';
            } else if (trimmedLine.toLowerCase().includes('intro') || trimmedLine.toLowerCase().includes('mở đầu')) {
                emoji = '🎪 ';
                prefix = '**[INTRO]** ';
            } else if (trimmedLine.length > 0) {
                // Animation emojis cho các dòng thường
                const emojis = ['💫', '✨', '🌟', '💖', '💝', '💕', '💗', '💘', '🔥', '⚡', '🎊', '🎉'];
                emoji = emojis[index % emojis.length] + ' ';
            }
            
            // Format với blockquote, prefix và emoji
            const formattedLine = prefix ? `${prefix}${trimmedLine}` : trimmedLine;
            return `> ${emoji}${formattedLine}`;
        }).filter(line => line !== '');
        
        return formattedLines.join('\n');
    },

    startLiveLyrics(client, guildId, message, lines, player, trackName, artistName) {
        const lyricIntervals = client.lyricIntervals || new Map();
        client.lyricIntervals = lyricIntervals;
        
        // Dọn dẹp interval cũ nếu có
        if (lyricIntervals.has(guildId)) {
            clearInterval(lyricIntervals.get(guildId));
            lyricIntervals.delete(guildId);
        }
        
        const songDuration = Math.floor(player.current.info.length / 1000);
        
        const updateLyrics = async () => {
            try {
                if (!client.riffy?.players?.has(guildId) || !player.current) {
                    if (lyricIntervals.has(guildId)) {
                        clearInterval(lyricIntervals.get(guildId));
                        lyricIntervals.delete(guildId);
                    }
                    return;
                }
                
                const currentTime = Math.floor(player.position / 1000);
                const totalLines = lines.length;
                
                const linesPerSecond = totalLines / songDuration;
                const currentLineIndex = Math.floor(currentTime * linesPerSecond);
                
                const start = Math.max(0, currentLineIndex - 3);
                const end = Math.min(totalLines, currentLineIndex + 4);
                const visibleLines = lines.slice(start, end).join('\n');
                
                const formattedVisibleLines = this.formatLyricsForDisplay(lines.slice(start, end));
                
                const embed = new EmbedBuilder()
                    .setTitle(`🎵 Live Lyrics: ${trackName}`)
                    .setDescription(`**Nghệ sĩ:** ${artistName}\n\n${formattedVisibleLines}`)
                    .setColor('#DC92FF');
                
                try {
                    const msg = await message.edit({ embeds: [embed] });
                } catch (err) {
                    if (lyricIntervals.has(guildId)) {
                        clearInterval(lyricIntervals.get(guildId));
                        lyricIntervals.delete(guildId);
                    }
                }
            } catch (err) {
                console.error("Error updating lyrics:", err);
                if (lyricIntervals.has(guildId)) {
                    clearInterval(lyricIntervals.get(guildId));
                    lyricIntervals.delete(guildId);
                }
            }
        };
        
        const interval = setInterval(updateLyrics, 3000);
        lyricIntervals.set(guildId, interval);
        
        updateLyrics();
        
        const collector = message.createMessageComponentCollector({ time: 600000 });
        
        collector.on('collect', async i => {
            await i.deferUpdate();
            
            if (i.customId === "stopLyrics") {
                if (lyricIntervals.has(guildId)) {
                    clearInterval(lyricIntervals.get(guildId));
                    lyricIntervals.delete(guildId);
                }
                await message.delete().catch(() => {});
            } else if (i.customId === "fullLyrics") {
                if (lyricIntervals.has(guildId)) {
                    clearInterval(lyricIntervals.get(guildId));
                    lyricIntervals.delete(guildId);
                }
                
                const formattedLyrics = this.formatLyricsForDisplay(lines);
                const embed = new EmbedBuilder()
                    .setTitle(`🎵 Lời Bài Hát: ${trackName}`)
                    .setDescription(`**Nghệ sĩ:** ${artistName}\n\n${formattedLyrics}`)
                    .setColor('#DC92FF');
                
                const deleteButton = new ButtonBuilder()
                    .setCustomId("deleteLyrics")
                    .setLabel("Xóa")
                    .setStyle(ButtonStyle.Danger);
                
                const deleteRow = new ActionRowBuilder().addComponents(deleteButton);
                
                await message.edit({ embeds: [embed], components: [deleteRow] });
            } else if (i.customId === "deleteLyrics") {
                await message.delete().catch(() => {});
            }
        });
        
        collector.on('end', () => {
            if (lyricIntervals.has(guildId)) {
                clearInterval(lyricIntervals.get(guildId));
                lyricIntervals.delete(guildId);
            }
            message.delete().catch(() => {});
        });
    },

    setupLyricsNavigation(message) {
        const collector = message.createMessageComponentCollector({ time: 300000 });
        
        collector.on('collect', async i => {
            await i.deferUpdate();
            
            if (i.customId === "nextLyrics") {
                message.currentChunk++;
                const chunks = message.lyricsChunks;
                
                if (message.currentChunk >= chunks.length) {
                    message.currentChunk = 0; // Quay về trang đầu
                }
                
                const embed = new EmbedBuilder()
                    .setTitle(`🎵 Lời Bài Hát (Trang ${message.currentChunk + 1}/${chunks.length})`)
                    .setDescription(`**Nghệ sĩ:** ${message.artistName}\n\n${chunks[message.currentChunk]}`)
                    .setColor('#DC92FF');
                
                const prevButton = new ButtonBuilder()
                    .setCustomId("prevLyrics")
                    .setLabel("Trang Trước")
                    .setStyle(ButtonStyle.Secondary);
                
                const nextButton = new ButtonBuilder()
                    .setCustomId("nextLyrics")
                    .setLabel("Trang Tiếp")
                    .setStyle(ButtonStyle.Primary);
                
                const deleteButton = new ButtonBuilder()
                    .setCustomId("deleteLyrics")
                    .setLabel("Xóa")
                    .setStyle(ButtonStyle.Danger);
                
                const row = new ActionRowBuilder().addComponents(prevButton, nextButton, deleteButton);
                
                await message.edit({ embeds: [embed], components: [row] });
            } else if (i.customId === "prevLyrics") {
                message.currentChunk--;
                const chunks = message.lyricsChunks;
                
                if (message.currentChunk < 0) {
                    message.currentChunk = chunks.length - 1; // Đi đến trang cuối
                }
                
                const embed = new EmbedBuilder()
                    .setTitle(`🎵 Lời Bài Hát (Trang ${message.currentChunk + 1}/${chunks.length})`)
                    .setDescription(`**Nghệ sĩ:** ${message.artistName}\n\n${chunks[message.currentChunk]}`)
                    .setColor('#DC92FF');
                
                const prevButton = new ButtonBuilder()
                    .setCustomId("prevLyrics")
                    .setLabel("Trang Trước")
                    .setStyle(ButtonStyle.Secondary);
                
                const nextButton = new ButtonBuilder()
                    .setCustomId("nextLyrics")
                    .setLabel("Trang Tiếp")
                    .setStyle(ButtonStyle.Primary);
                
                const deleteButton = new ButtonBuilder()
                    .setCustomId("deleteLyrics")
                    .setLabel("Xóa")
                    .setStyle(ButtonStyle.Danger);
                
                const row = new ActionRowBuilder().addComponents(prevButton, nextButton, deleteButton);
                
                await message.edit({ embeds: [embed], components: [row] });
            } else if (i.customId === "deleteLyrics") {
                await message.delete().catch(() => {});
            }
        });
    },

    chunkText(text, maxLength) {
        const chunks = [];
        const lines = text.split('\n');
        let currentChunk = '';
        
        for (const line of lines) {
            if (currentChunk.length + line.length + 1 > maxLength) {
                if (currentChunk) {
                    chunks.push(currentChunk.trim());
                    currentChunk = line;
                } else {
                    // Nếu một dòng quá dài, chia nhỏ nó
                    chunks.push(line.substring(0, maxLength));
                    currentChunk = line.substring(maxLength);
                }
            } else {
                currentChunk += (currentChunk ? '\n' : '') + line;
            }
        }
        
        if (currentChunk) {
            chunks.push(currentChunk.trim());
        }
        
        return chunks;
    }
};
