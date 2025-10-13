const { commandLogsCollection } = require('../mongodb');
const { EmbedBuilder } = require('discord.js');

module.exports = async function commandExecutionHandler(client) {
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;
    const user = interaction.user || {};
    const guild = interaction.guild || {};
    const channel = interaction.channel || {};

   
    const logData = {
      commandName: commandName || 'unknown',
      userId: user.id || 'unknown',
      userName: user.tag || 'unknown',
      guildId: guild.id || null,
      channelId: channel.id || 'unknown',
      timestamp: new Date(),
      isConfig: false,
    };

    try {
      await commandLogsCollection.insertOne(logData);
    } catch (err) {
      console.error('❌ Failed to log command execution:', err);
    }

   
    if (!guild.id) return;

    try {
      const config = await commandLogsCollection.findOne({ guildId: guild.id, isConfig: true });
      if (!config?.enabled || !config?.channelId) return;

      const logChannel = client.channels.cache.get(config.channelId);
      if (!logChannel) return;

      const embed = new EmbedBuilder()
        .setTitle('📜 Lệnh Được Thực Hiện')
        .setColor('#3498db')
        .addFields(
          { name: 'Người Dùng', value: user.tag || 'Không Xác Định', inline: true },
          { name: 'Lệnh', value: `/${commandName}`, inline: true },
          { name: 'Kênh', value: channel.id ? `<#${channel.id}>` : 'Không Xác Định', inline: true }
        )
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });
    } catch (error) {
      //console.error('❌ Error sending command log embed:', error);
    }
  });
};

