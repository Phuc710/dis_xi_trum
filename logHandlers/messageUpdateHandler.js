const logHandlersIcons = require('../UI/icons/loghandlers');
const { logsCollection } = require('../mongodb');
const { EmbedBuilder } = require('discord.js');
module.exports = async function messageUpdateHandler(client) {
    client.on('messageUpdate', async (oldMessage, newMessage) => {
        if (!oldMessage.guild || oldMessage.partial || newMessage.partial) return;

        const config = await logsCollection.findOne({ guildId: oldMessage.guild.id, eventType: 'messageUpdate' });
        if (!config || !config.channelId) return;

        const logChannel = client.channels.cache.get(config.channelId);
        if (logChannel) {
            const embed = new EmbedBuilder()
                .setTitle('✏️ Tin Nhắn Đã Chỉnh Sửa')
                .setColor('#FFFF00')
                .setThumbnail(logHandlersIcons.msgIcon)
                .addFields(
                    { name: 'Tác Giả', value: oldMessage.author?.tag || 'Không Xác Định', inline: true },
                    { name: 'Kênh', value: `<#${oldMessage.channel.id}>`, inline: true },
                    { name: 'Nội Dung Cũ', value: oldMessage.content || '*Không có nội dung*' },
                    { name: 'Nội Dung Mới', value: newMessage.content || '*Không có nội dung*' },
                )
                .setFooter({ text: 'Hệ Thống Log', iconURL: logHandlersIcons.footerIcon })
                .setTimestamp();

            logChannel.send({ embeds: [embed] });
        }
    });
};

