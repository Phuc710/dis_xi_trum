// emptyChannel.js
const { EmbedBuilder } = require('discord.js');
const { Translate } = require('../../process_tools');

module.exports = async (queue) => {
    if (!queue.metadata?.channel) return;

    // Xoá thread lyrics nếu có
    if (queue.metadata.lyricsThread) {
        try {
            await queue.metadata.lyricsThread.delete();
            queue.setMetadata({ channel: queue.metadata.channel });
        } catch (error) {
            console.log(`Lyrics thread cleanup error: ${error.message}`);
        }
    }

    try {
        const embed = new EmbedBuilder()
            .setTitle("👋 Kênh thoại trống")
            .setDescription(
                await Translate("Không còn ai trong kênh thoại nên bot Cook đi ăn.")
            )
            .setColor('#5865F2') // xanh Discord
            .setFooter({ text: "Dùng /play <tên bài hát> để gọi bot trở lại 🎶" })
            .setTimestamp();

        await queue.metadata.channel.send({ embeds: [embed] });
    } catch (error) {
        console.log(`emptyChannel error: ${error.message}`);
    }
};
