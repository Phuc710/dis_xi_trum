const { EmbedBuilder } = require('discord.js');
const { Translate } = require('../process_tools');

const maxVol = client.config.opt.maxVol;

module.exports = async ({ inter, queue }) => {
    // ❌ Không có nhạc
    if (!queue?.isPlaying()) {
        const embed = new EmbedBuilder()
            .setColor('#ff4d4d')
            .setTitle("❌ Không có nhạc")
            .setDescription(await Translate(`Hiện tại không có bài hát nào đang phát, ${inter.member}.`));
        return inter.editReply({ embeds: [embed] });
    }

    const vol = Math.floor(queue.node.volume - 25);

    // ❌ Không thể giảm dưới 0
    if (vol < 0) {
        const embed = new EmbedBuilder()
            .setColor('#ffcc00')
            .setTitle("⚠️ Âm lượng tối thiểu")
            .setDescription(await Translate(`Không thể giảm âm lượng dưới **0%**, ${inter.member}.`));
        return inter.editReply({ embeds: [embed] });
    }

    // ⚠️ Không thay đổi
    if (queue.node.volume === vol) {
        const embed = new EmbedBuilder()
            .setColor('#ffcc00')
            .setTitle("⚠️ Không thay đổi")
            .setDescription(await Translate(`Âm lượng hiện tại đã là **${vol}%**, ${inter.member}.`));
        return inter.editReply({ embeds: [embed] });
    }

    // ✅ Thành công
    const success = queue.node.setVolume(vol);

    const embed = new EmbedBuilder()
        .setColor(success ? '#2f3136' : '#ff4d4d')
        .setTitle(success ? "🔉 Âm lượng giảm" : "❌ Lỗi")
        .setDescription(success 
            ? await Translate(`Âm lượng đã được chỉnh thành **${vol}/${maxVol}%**.`) 
            : await Translate(`Có lỗi xảy ra, ${inter.member}, vui lòng thử lại.`)
        )
        .setTimestamp();

    return inter.editReply({ embeds: [embed] });
};
