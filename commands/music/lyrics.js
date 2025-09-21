const { EmbedBuilder } = require('discord.js');
const { useMainPlayer, useQueue } = require('discord-player');
const { Translate } = require('../../process_tools');

module.exports = {
    name: 'lyrics',
    description: ('Xem lời bài hát của track hiện tại'),
    voiceChannel: true,

    async execute({ inter }) {
        const player = useMainPlayer();
        const queue = useQueue(inter.guild);

        // Kiểm tra có nhạc không
        if (!queue?.isPlaying()) {
            const embed = new EmbedBuilder()
                .setColor('#ff4d4d')
                .setTitle("❌ Không có nhạc phát")
                .setDescription(await Translate(`Hiện tại không có bài hát nào đang phát, <${inter.member}>.`))
                .setTimestamp();
            return inter.editReply({ embeds: [embed] });
        }

        // Tìm lyrics
        let results;
        try {
            results = await player.lyrics.search({
                q: queue.currentTrack.title
            });
        } catch (err) {
            console.error(err);
            const embed = new EmbedBuilder()
                .setColor('#ff4d4d')
                .setTitle("⚠️ Lỗi")
                .setDescription(await Translate(`Không thể tải lời bài hát. Vui lòng liên hệ Developer!`));
            return inter.editReply({ embeds: [embed] });
        }

        const lyrics = results?.[0];
        if (!lyrics?.plainLyrics) {
            const embed = new EmbedBuilder()
                .setColor('#ffcc00')
                .setTitle("🔍 Không tìm thấy lời")
                .setDescription(await Translate(`Không tìm thấy lời cho **${queue.currentTrack.title}** <${inter.member}>.`))
                .setTimestamp();
            return inter.editReply({ embeds: [embed] });
        }

        // Giới hạn ký tự (Discord max 2000)
        const trimmedLyrics = lyrics.plainLyrics.substring(0, 1997);

        const embed = new EmbedBuilder()
            .setColor('#57F287')
            .setTitle(await Translate(`📖 Lời bài hát: ${queue.currentTrack.title}`))
            .setAuthor({ name: lyrics.artistName || "Không rõ nghệ sĩ" })
            .setDescription(trimmedLyrics.length === 1997 ? `${trimmedLyrics}...` : trimmedLyrics)
            .setFooter({
                text: `Yêu cầu bởi: ${inter.member.displayName}`,
                iconURL: inter.member.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp();

        return inter.editReply({ embeds: [embed] });
    }
};
