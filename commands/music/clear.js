const { EmbedBuilder } = require('discord.js');
const { useQueue } = require('discord-player');
const { Translate } = require('../../process_tools');

module.exports = {
    name: 'clear',
    description: ('Xóa tất cả nhạc trong hàng chờ'),
    voiceChannel: true,

    async execute({ inter }) {
        const queue = useQueue(inter.guild);
        if (!queue?.isPlaying()) {
            const errorMessage = await Translate(`Không có nhạc nào đang phát <${inter.member}>... thử lại? <❌>`);
            return inter.editReply({ content: errorMessage });
        }

        if (queue.tracks.size <= 1) { 
            const errorMessage = await Translate(`Không có nhạc nào trong hàng chờ sau bài hát hiện tại <${inter.member}>... thử lại? <❌>`);
            return inter.editReply({ content: errorMessage });
        }
        queue.tracks.clear();
        const clearEmbed = new EmbedBuilder()
            .setAuthor({ 
                name: await Translate(`Hàng chờ vừa được dọn sạch <🗑️>`) 
            })
            .setColor('#2f3136');
        inter.editReply({ embeds: [clearEmbed] });
    }
}