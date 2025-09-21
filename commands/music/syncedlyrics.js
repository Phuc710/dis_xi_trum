const { useMainPlayer, useQueue } = require('discord-player');
const { EmbedBuilder } = require('discord.js');
const { Translate } = require('../../process_tools');

module.exports = {
    name: 'syncedlyrics',
    description: 'Đồng bộ lời bài hát với nhạc',
    voiceChannel: true,

    async execute({ inter }) {
        const player = useMainPlayer();
        const queue = useQueue(inter.guild);

        if (!queue?.isPlaying()) {
            const embed = new EmbedBuilder()
                .setColor('#ff4d4d')
                .setTitle("❌ Không có nhạc phát")
                .setDescription(await Translate(`Hiện tại không có bài hát nào đang phát, vui lòng thử lại.`))
                .setTimestamp();
            return inter.editReply({ embeds: [embed] });
        }

        const metadataThread = queue.metadata.lyricsThread;
        if (metadataThread && !metadataThread.archived) {
            const embed = new EmbedBuilder()
                .setColor('#ffcc00')
                .setTitle("🎵 Lyrics đã có sẵn")
                .setDescription(await Translate(`Đã có thread lyrics được tạo sẵn: <#${queue.metadata.lyricsThread.id}>`))
                .setTimestamp();
            return inter.editReply({ embeds: [embed] });
        }

        try {
            const results = await player.lyrics.search({ q: queue.currentTrack.title });
            
            const lyrics = results?.[0];
            if (!lyrics?.plainLyrics) {
                const embed = new EmbedBuilder()
                    .setColor('#ff4d4d')
                    .setTitle("❌ Không tìm thấy lyrics")
                    .setDescription(await Translate(`Không có lời cho bài **${queue.currentTrack.title}**. Vui lòng thử bài khác.`));
                return inter.editReply({ embeds: [embed] });
            }

            const thread = await queue.metadata.channel.threads.create({
                name: `🎶 Lyrics: ${queue.currentTrack.title.slice(0, 80)}` // Giới hạn độ dài tên
            });

            queue.setMetadata({
                channel: queue.metadata.channel,
                lyricsThread: thread
            });

            const syncedLyrics = queue?.syncedLyrics(lyrics);
            syncedLyrics.onChange(async (lyricsText) => {
                // FIX: Kiểm tra lyrics có nội dung không
                if (lyricsText && lyricsText.trim().length > 0) {
                    try {
                        await thread.send({ content: lyricsText.slice(0, 2000) }); // Giới hạn 2000 ký tự
                    } catch (error) {
                        console.log('❌ Lỗi gửi lyrics:', error.message);
                    }
                }
            });
            syncedLyrics?.subscribe();

            const embed = new EmbedBuilder()
                .setColor('#57F287')
                .setTitle("✅ Đồng bộ lyrics thành công")
                .setDescription(await Translate(`Lyrics đã được đồng bộ trong thread: <#${thread.id}>`))
                .setFooter({ text: "Lyrics sẽ hiển thị tự động khi nhạc phát 🎵" })
                .setTimestamp();

            return inter.editReply({ embeds: [embed] });

        } catch (error) {
            console.log('❌ Lỗi syncedlyrics:', error.message);
            const embed = new EmbedBuilder()
                .setColor('#ff4d4d')
                .setTitle("⚠️ Lỗi")
                .setDescription(await Translate("Không thể lấy lyrics. Vui lòng liên hệ Developers!"));
            return inter.editReply({ embeds: [embed] });
        }
    }
};