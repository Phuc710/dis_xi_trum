const { logsCollection } = require('../mongodb');
const { EmbedBuilder } = require('discord.js');
const logHandlersIcons = require('../UI/icons/loghandlers');
module.exports = async function memberUnbanHandler(client) {
    client.on('guildBanRemove', async (ban) => {
        const config = await logsCollection.findOne({ guildId: ban.guild.id, eventType: 'memberUnban' });
        if (!config || !config.channelId) return;

        const logChannel = client.channels.cache.get(config.channelId);
        if (logChannel) {
            const embed = new EmbedBuilder()
                .setTitle('🔓 Thành Viên Được Phục Hồi')
                .setColor('#00FF00')
                .addFields(
                    { name: 'Người Dùng', value: `${ban.user.tag} (${ban.user.id})`, inline: true },
                )
                .setThumbnail(ban.user.displayAvatarURL())
                .setFooter({ text: 'Hệ Thống Log', iconURL: logHandlersIcons.footerIcon })
                .setTimestamp();

            logChannel.send({ embeds: [embed] });
        }
    });
};

