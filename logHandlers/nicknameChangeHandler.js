const logHandlersIcons = require('../UI/icons/loghandlers');
const { logsCollection } = require('../mongodb');
const { EmbedBuilder } = require('discord.js');

module.exports = async function nicknameChangeHandler(client) {
    client.on('guildMemberUpdate', async (oldMember, newMember) => {
        const guildId = newMember.guild.id;

        // Fetch config
        const config = await logsCollection.findOne({ guildId, eventType: 'nicknameChange' });
        if (!config || !config.channelId) return;

        const logChannel = newMember.guild.channels.cache.get(config.channelId);

        if (logChannel && oldMember.nickname !== newMember.nickname) {
            const embed = new EmbedBuilder()
                .setTitle('📝 Biệt Danh Đã Thay Đổi')
                .setColor('#00FFFF')
                .setThumbnail(logHandlersIcons.nickIcon)
                .addFields(
                    { name: 'Người Dùng', value: `${newMember.user.tag} (${newMember.id})`, inline: true },
                    { name: 'Biệt Danh Cũ', value: oldMember.nickname || '*Không có*', inline: true },
                    { name: 'Biệt Danh Mới', value: newMember.nickname || '*Không có*', inline: true },
                )
                .setFooter({ text: 'Hệ Thống Log', iconURL: logHandlersIcons.footerIcon })
                .setTimestamp();

            logChannel.send({ embeds: [embed] });
        }
    });
};

