const { QueueRepeatMode } = require('discord-player');
const { Translate } = require('../process_tools');

module.exports = async ({ inter, queue }) => {
    const methods = ['disabled', 'track', 'queue', 'autoplay'];

    if (!queue?.isPlaying()) {
        return inter.editReply({ content: await Translate(`Hiện tại không có bài nhạc nào đang phát... thử lại nhé <❌>`) });
    }

    // Xoay vòng chế độ loop: OFF → TRACK → QUEUE → AUTOPLAY → OFF
    let newMode;
    if (queue.repeatMode === QueueRepeatMode.AUTOPLAY) {
        newMode = QueueRepeatMode.OFF;
    } else {
        newMode = queue.repeatMode + 1;
    }

    queue.setRepeatMode(newMode);

    return inter.editReply({
        content: await Translate(`Chế độ lặp thành công: <**${methods[newMode]}**> ✅`)
    });
};
