const maxVol = client.config.opt.maxVol || 100;
const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const { useQueue } = require('discord-player');
const { Translate } = require('../../process_tools');

module.exports = {
    name: 'volume',
    description: ('Điều chỉnh âm lượng phát nhạc'),
    voiceChannel: true,
    options: [
        {
            name: 'volume',
            description: ('Âm lượng mới (1 - ' + maxVol + ')'),
            type: ApplicationCommandOptionType.Number,
            required: true,
            minValue: 1,
            maxValue: maxVol
        }
    ],

    async execute({ inter }) {
        const queue = useQueue(inter.guild);

        // Không có nhạc
        if (!queue?.isPlaying()) {
            const embed = new EmbedBuilder()
                .setColor('#ff4d4d')
                .setTitle("❌ Không có nhạc phát")
                .setDescription(await Translate(`Hiện tại không có bài hát nào đang phát, <${inter.member}> vui lòng thử lại.`))
                .setTimestamp();
            return inter.editReply({ embeds: [embed] });
        }

        const vol = inter.options.getNumber('volume');

        // Volume không thay đổi
        if (queue.node.volume === vol) {
            const embed = new EmbedBuilder()
                .setColor('#ffcc00')
                .setTitle("⚠️ Âm lượng không thay đổi")
                .setDescription(await Translate(`Âm lượng hiện tại đã là **${vol}%**, <${inter.member}>.`))
                .setTimestamp();
            return inter.editReply({ embeds: [embed] });
        }

        // Thay đổi volume
        const success = queue.node.setVolume(vol);

        const embed = new EmbedBuilder()
            .setColor(success ? '#57F287' : '#ff4d4d')
            .setTitle(success ? "🔊 Âm lượng đã thay đổi" : "❌ Lỗi")
            .setDescription(
                success
                    ? await Translate(`Âm lượng đã được chỉnh thành **${vol}/${maxVol}%**`)
                    : await Translate(`Đã xảy ra lỗi, <${inter.member}> vui lòng thử lại.`)
            )
            .setTimestamp();

        return inter.editReply({ embeds: [embed] });
    }
};
