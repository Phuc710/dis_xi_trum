const { logsCollection } = require('../mongodb');
const { EmbedBuilder } = require('discord.js');
const logHandlersIcons = require('../UI/icons/loghandlers');
module.exports = async function messageDeleteHandler(client) {
    client.on('messageDelete', async (message) => {
        if (!message.guild || message.partial) return;

        const config = await logsCollection.findOne({ guildId: message.guild.id, eventType: 'messageDelete' });
        if (!config || !config.channelId) return;

        const logChannel = client.channels.cache.get(config.channelId);
        if (logChannel) {
            const embed = new EmbedBuilder()
                .setTitle('🗑️ Tin Nhắn Đã Xóa')
                .setColor('#FF0000')
                .setThumbnail(logHandlersIcons.msgIcon)
                .addFields(
                    { name: 'Tác Giả', value: message.author?.tag || 'Không Xác Định', inline: true },
                    { name: 'Kênh', value: `<#${message.channel.id}>`, inline: true },
                    { name: 'Nội Dung', value: message.content || '*Không có nội dung*' },
                )
                .setFooter({ text: 'Hệ Thống Log', iconURL: logHandlersIcons.footerIcon })
                .setTimestamp();

            logChannel.send({ embeds: [embed] });
        }
    });
};

