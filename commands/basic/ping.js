const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check bot latency and response time'),

    async execute(interaction) {
        try {
            // Immediate response to avoid timeout
            await interaction.reply({
                content: '🏓 Pinging...',
                fetchReply: true
            });

            const sent = await interaction.fetchReply();
            const latency = sent.createdTimestamp - interaction.createdTimestamp;
            const apiLatency = Math.round(interaction.client.ws.ping);

            const embed = new EmbedBuilder()
                .setTitle('🏓 Pong!')
                .setColor('#00ff00')
                .addFields(
                    { name: '📡 Bot Latency', value: `\`${latency}ms\``, inline: true },
                    { name: '💓 API Latency', value: `\`${apiLatency}ms\``, inline: true },
                    { name: '✅ Status', value: 'Bot is online and responding!', inline: false }
                )
                .setFooter({ text: 'Boo Bot • Ping Test' })
                .setTimestamp();

            await interaction.editReply({
                content: null,
                embeds: [embed]
            });
        } catch (error) {
            console.error('Ping command error:', error);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ An error occurred while checking ping.',
                    flags: 64
                });
            } else {
                await interaction.editReply({
                    content: '❌ An error occurred while checking ping.'
                });
            }
        }
    }
};
