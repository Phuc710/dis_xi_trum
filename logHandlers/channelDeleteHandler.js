const { logsCollection } = require('../mongodb');
const { EmbedBuilder, ChannelType } = require('discord.js');
const logHandlersIcons = require('../UI/icons/loghandlers');
module.exports = async function channelDeleteHandler(client) {
    client.on('channelDelete', async (channel) => {
        const config = await logsCollection.findOne({ guildId: channel.guild.id, eventType: 'channelDelete' });
        if (!config || !config.channelId) return;

        const logChannel = client.channels.cache.get(config.channelId);
        if (logChannel) {
  
            const channelType = {
                [ChannelType.GuildText]: 'Kênh Văn Bản',
                [ChannelType.GuildVoice]: 'Kênh Giọng Nói',
                [ChannelType.GuildCategory]: 'Danh Mục',
                [ChannelType.GuildAnnouncement]: 'Kênh Thông Báo',
                [ChannelType.GuildStageVoice]: 'Kênh Sân Khấu',
                [ChannelType.GuildForum]: 'Kênh Diễn Đàn',
                [ChannelType.PublicThread]: 'Luồng Công Khai',
                [ChannelType.PrivateThread]: 'Luồng Riêng Tư',
                [ChannelType.GuildDirectory]: 'Kênh Danh Bạ',
            }[channel.type] || 'Loại Không Xác Định';

            const embed = new EmbedBuilder()
                .setTitle('🗑️ Kênh Đã Bị Xóa')
                .setThumbnail(logHandlersIcons.staffIcon)
                .setColor('#FF0000')
                .addFields(
                    { name: 'Kênh', value: `${channel.name} (${channel.id})`, inline: true },
                    { name: 'Loại', value: channelType, inline: true },
                )
                .setFooter({ text: 'Hệ Thống Log', iconURL: logHandlersIcons.footerIcon })
                .setTimestamp();

            logChannel.send({ embeds: [embed] });
        }
    });
};

