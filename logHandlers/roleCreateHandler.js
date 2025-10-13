const logHandlersIcons = require('../UI/icons/loghandlers');
const { logsCollection } = require('../mongodb');
const { EmbedBuilder } = require('discord.js');
module.exports = async function roleCreateHandler(client) {
    client.on('roleCreate', async (role) => {
        const config = await logsCollection.findOne({ guildId: role.guild.id, eventType: 'roleCreate' });
        if (!config || !config.channelId) return;

        const logChannel = client.channels.cache.get(config.channelId);
        if (logChannel) {
            const embed = new EmbedBuilder()
                .setTitle('🟢 Vai Trò Được Tạo')
                .setColor('#00FF00')
                .setThumbnail(logHandlersIcons.badgeIcon)
                .addFields(
                    { name: 'Vai Trò', value: `${role.name} (${role.id})`, inline: true },
                    { name: 'Màu Sắc', value: role.hexColor, inline: true },
                )
                .setFooter({ text: 'Hệ Thống Log', iconURL: logHandlersIcons.footerIcon })
                .setTimestamp();

            logChannel.send({ embeds: [embed] });
        }
    });
};

