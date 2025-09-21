const { EmbedBuilder } = require('discord.js');
const { useQueue } = require('discord-player');
const { Translate } = require('../../process_tools');

module.exports = {
    name: 'back',
    description: "Phát lại bài hát trước đó",
    voiceChannel: true,

    async execute({ inter }) {
        const queue = useQueue(inter.guild);

        // ❌ Không có nhạc đang phát
        if (!queue?.isPlaying()) {
            const embed = new EmbedBuilder()
                .setColor('#ff4d4d')
                .setTitle("❌ Không có nhạc")
                .setDescription(await Translate(`Hiện tại không có bài hát nào đang phát, ${inter.member}.`));
            return inter.editReply({ embeds: [embed] });
        }

        // ❌ Không có bài trước đó
        if (!queue.history.previousTrack) {
            const embed = new EmbedBuilder()
                .setColor('#ffcc00')
                .setTitle("⚠️ Không có bài trước")
                .setDescription(await Translate(`Không có bài hát nào được phát trước đó, ${inter.member}.`));
            return inter.editReply({ embeds: [embed] });
        }

        // ⏮️ Quay lại bài trước
        await queue.history.back();
        const track = queue.currentTrack;

        const backEmbed = new EmbedBuilder()
            .setColor('#2f3136')
            .setTitle("⏮️ Đang phát lại bài trước")
            .setDescription(`**${track.title}** - *${track.author}*`)
            .setThumbnail(track.thumbnail)
            .setFooter({ text: await Translate(`Yêu cầu bởi ${inter.member.displayName}`), iconURL: inter.member.displayAvatarURL() })
            .setTimestamp();

        return inter.editReply({ embeds: [backEmbed] });
    }
};
