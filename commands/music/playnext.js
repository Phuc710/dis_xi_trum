const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const { QueryType, useMainPlayer, useQueue } = require('discord-player');
const { Translate } = require('../../process_tools');

module.exports = {
    name: 'playnext',
    description: ("Phát một bài ngay sau bài hiện tại"),
    voiceChannel: true,
    options: [
        {
            name: 'song',
            description: ('Tên hoặc link bài hát bạn muốn phát tiếp theo'),
            type: ApplicationCommandOptionType.String,
            required: true,
        }
    ],

    async execute({ inter }) {
        const player = useMainPlayer();
        const queue = useQueue(inter.guild);

        // Không có nhạc đang phát
        if (!queue?.isPlaying()) {
            const embed = new EmbedBuilder()
                .setColor('#ff4d4d')
                .setTitle("❌ Không có nhạc phát")
                .setDescription(await Translate(`Hiện tại không có bài hát nào đang phát, <${inter.member}>.`))
                .setTimestamp();
            return inter.editReply({ embeds: [embed] });
        }

        const song = inter.options.getString('song');
        const res = await player.search(song, {
            requestedBy: inter.member,
            searchEngine: QueryType.AUTO
        });

        // Không tìm thấy kết quả
        if (!res?.tracks.length) {
            const embed = new EmbedBuilder()
                .setColor('#ff4d4d')
                .setTitle("🔍 Không tìm thấy kết quả")
                .setDescription(await Translate(`Không tìm thấy bài hát nào phù hợp với: **${song}** <${inter.member}>.`))
                .setTimestamp();
            return inter.editReply({ embeds: [embed] });
        }

        // Không hỗ trợ playlist
        if (res.playlist) {
            const embed = new EmbedBuilder()
                .setColor('#ffcc00')
                .setTitle("⚠️ Không hỗ trợ playlist")
                .setDescription(await Translate(`Lệnh này chỉ áp dụng cho 1 bài hát, không áp dụng cho playlist <${inter.member}>.`))
                .setTimestamp();
            return inter.editReply({ embeds: [embed] });
        }

        // Thêm bài vào ngay sau bài hiện tại
        queue.insertTrack(res.tracks[0], 0);

        const playNextEmbed = new EmbedBuilder()
            .setColor('#57F287') // xanh lá
            .setTitle("🎧 Đã thêm bài hát vào hàng chờ")
            .setDescription(await Translate(`**${res.tracks[0].title}** sẽ phát ngay sau bài hiện tại.`))
            .setFooter({ text: `Yêu cầu bởi: ${inter.member.displayName}` })
            .setTimestamp();

        await inter.editReply({ embeds: [playNextEmbed] });
    }
};
