// disconnect.js
const { EmbedBuilder } = require('discord.js');
const { Translate } = require('../../process_tools');

module.exports = async (queue) => {
    if (!queue.metadata?.channel) return;

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
            .setTitle("👋 Rời kênh thoại")
            .setDescription(await Translate("Bot đã rời khỏi kênh thoại."))
            .setColor('#ff4d4d')
            .setFooter({ text: "Hẹ hẹ Boy !!! 🎶" })
            .setTimestamp();

        await queue.metadata.channel.send({ embeds: [embed] });
    } catch (error) {
        console.log(`disconnect error: ${error.message}`);
    }
};
