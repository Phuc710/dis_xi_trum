// error.js
const { EmbedBuilder } = require('discord.js');
const { Translate } = require('../../process_tools');

module.exports = async (queue, error) => {
    if (!queue.metadata?.channel) return;

    try {
        const embed = new EmbedBuilder()
            .setTitle("⚠️ Lỗi không mong muốn")
            .setDescription(
                await Translate("Đã xảy ra lỗi khi xử lý yêu cầu. Vui lòng thử lại hoặc kiểm tra console để biết chi tiết.")
            )
            .setColor('#ff3333')
            .setFooter({ text: "Nếu lỗi vẫn tiếp diễn, hãy báo cho Phucx 👨‍💻" })
            .setTimestamp();

        await queue.metadata.channel.send({ embeds: [embed] });

        console.error(`Bot Error: ${error}`);
    } catch (err) {
        console.error(`Error handler failed: ${err.message}`);
    }
};
