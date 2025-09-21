const { EmbedBuilder } = require('discord.js');
const { useQueue } = require('discord-player');
const { Translate } = require('../../process_tools');

module.exports = {
    name: 'stop',
    description: ('Dừng phát nhạc và xoá danh sách'),
    voiceChannel: true,

    async execute({ inter }) {
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

        // Xoá hàng chờ & dừng nhạc
        queue.delete();

        const embed = new EmbedBuilder()
            .setColor('#57F287') // xanh lá thành công
            .setTitle("⏹️ Nhạc đã dừng")
            .setDescription(await Translate(`Danh sách phát đã bị xoá. Hẹn gặp lại bạn lần sau, <${inter.member}>! ✅`))
            .setFooter({ text: "Dùng /play <tên bài hát> để nghe nhạc lại 🎶" })
            .setTimestamp();

        return inter.editReply({ embeds: [embed] });
    }
};
