// loop.js - Fixed and beautified
const { QueueRepeatMode, useQueue } = require('discord-player');
const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const { Translate } = require('../../process_tools');

module.exports = {
    name: 'loop',
    description: 'Bật / tắt chế độ lặp lại bài hát hoặc cả hàng chờ',
    voiceChannel: true,
    options: [
        {
            name: 'action',
            description: 'Chọn chế độ lặp bạn muốn',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: '🔁 Lặp Queue', value: 'enable_loop_queue' },
                { name: '🔂 Lặp Bài Hát', value: 'enable_loop_song' },
                { name: '🎵 Autoplay', value: 'enable_autoplay' },
                { name: '🔴 Tắt Loop', value: 'disable_loop' },
            ],
        }
    ],

    async execute({ inter }) {
        const queue = useQueue(inter.guild);

        // ❌ Không có nhạc
        if (!queue?.isPlaying()) {
            const embed = new EmbedBuilder()
                .setColor('#ff4d4d')
                .setTitle("❌ Không có nhạc")
                .setDescription(await Translate(`Hiện tại không có bài hát nào đang phát, ${inter.member}.`));
            return inter.editReply({ embeds: [embed] });
        }

        const action = inter.options.getString('action');
        const embed = new EmbedBuilder().setColor('#2f3136');

        switch (action) {
            case 'enable_loop_queue': {
                if (queue.repeatMode === QueueRepeatMode.TRACK) {
                    return inter.editReply({ 
                        content: await Translate(`Bạn phải tắt chế độ lặp bài hát trước (/loop disable) ❌`) 
                    });
                }
                queue.setRepeatMode(QueueRepeatMode.QUEUE);
                embed.setTitle("🔁 Loop Queue Bật")
                     .setDescription(await Translate("Toàn bộ queue sẽ phát lặp lại liên tục."));
                break;
            }
            case 'enable_loop_song': {
                if (queue.repeatMode === QueueRepeatMode.QUEUE) {
                    return inter.editReply({ 
                        content: await Translate(`Bạn phải tắt chế độ lặp queue trước (/loop disable) ❌`) 
                    });
                }
                queue.setRepeatMode(QueueRepeatMode.TRACK);
                embed.setTitle("🔂 Loop Bài Hát Bật")
                     .setDescription(await Translate(`Bài hát hiện tại sẽ phát lặp lại liên tục.`));
                break;
            }
            case 'enable_autoplay': {
                queue.setRepeatMode(QueueRepeatMode.AUTOPLAY);
                embed.setTitle("🎵 Autoplay Bật")
                     .setDescription(await Translate("Bot sẽ tự động phát thêm nhạc liên quan sau khi queue kết thúc."));
                break;
            }
            case 'disable_loop': {
                if (queue.repeatMode === QueueRepeatMode.OFF) {
                    return inter.editReply({ 
                        content: await Translate(`Loop hiện tại đã tắt ❌`) 
                    });
                }
                queue.setRepeatMode(QueueRepeatMode.OFF);
                embed.setTitle("🔴 Loop Tắt")
                     .setDescription(await Translate("Không còn chế độ lặp nào được bật."));
                break;
            }
        }

        return inter.editReply({ embeds: [embed] });
    }
};
