const { EmbedBuilder } = require('discord.js');
const { useQueue } = require('discord-player');
const { Translate } = require('../../process_tools');

module.exports = {
    name: 'skip',
    description: ('Bỏ qua bài hát hiện tại'),
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

        // Thực hiện skip
        const currentTrack = queue.currentTrack;
        const success = queue.node.skip();

        const embed = new EmbedBuilder()
            .setColor(success ? '#57F287' : '#ff4d4d')
            .setTitle(success ? "⏭️ Đã bỏ qua bài hát" : "⚠️ Lỗi khi bỏ qua")
            .setDescription(
                success
                    ? await Translate(`Bài hát **${currentTrack.title}** đã được bỏ qua ✅`)
                    : await Translate(`Đã xảy ra lỗi, <${inter.member}> vui lòng thử lại.`)
            )
            .setTimestamp();

        return inter.editReply({ embeds: [embed] });
    }
};
