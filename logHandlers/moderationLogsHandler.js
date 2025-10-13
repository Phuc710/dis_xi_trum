const logHandlersIcons = require('../UI/icons/loghandlers');
const { logsCollection } = require('../mongodb');
const { EmbedBuilder } = require('discord.js');

module.exports = async function moderationLogsHandler(client) {
    client.on('guildMemberUpdate', async (oldMember, newMember) => {
        const guildId = newMember.guild.id;

        // Fetch config
        const config = await logsCollection.findOne({ guildId, eventType: 'moderationLogs' });
        if (!config || !config.channelId) return;

        const logChannel = newMember.guild.channels.cache.get(config.channelId);

        // Check for timeout updates
        if (oldMember.communicationDisabledUntilTimestamp !== newMember.communicationDisabledUntilTimestamp) {
            const embed = new EmbedBuilder()
                .setTitle('⏳ Thời Gian Câm Đã Cập Nhật')
                .setColor('#FF9900')
                .setThumbnail(logHandlersIcons.modIcon)
                .addFields(
                    { name: 'Người Dùng', value: `${newMember.user.tag} (${newMember.id})`, inline: true },
                    { name: 'Thời Gian Câm Đến', value: newMember.communicationDisabledUntil
                        ? `<t:${Math.floor(newMember.communicationDisabledUntilTimestamp / 1000)}:F>`
                        : '*Không có*', inline: true },
                )
                .setFooter({ text: 'Hệ Thống Log', iconURL: logHandlersIcons.footerIcon })
                .setTimestamp();

            logChannel.send({ embeds: [embed] });
        }
    });
};

