// clear.js 
const { EmbedBuilder } = require('discord.js');
const { Translate } = require('../process_tools');

module.exports = async ({ inter, queue }) => {
    if (!queue?.isPlaying()) {
        return inter.editReply({ content: await Translate(`Hiện tại không có bài nhạc nào đang phát... thử lại nhé ❌`) });
    }
    
    if (!queue.tracks.toArray()[0]) {
        return inter.editReply({ content: await Translate(`Không có bài hát nào trong hàng chờ để xóa... thử lại nhé ❌`) });
    }

    // Clear all tracks except current
    queue.tracks.clear();

    const embed = new EmbedBuilder()
        .setColor('#2f3136')
        .setAuthor({ name: await Translate(`Đã xóa toàn bộ hàng chờ! ✅`) });

    return inter.editReply({ embeds: [embed] });
}