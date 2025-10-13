const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const colors = require('../../UI/colors/colors');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Quản lý trạng thái bot')
        .addSubcommand(subcommand =>
            subcommand
                .setName('server-count')
                .setDescription('Cập nhật trạng thái hiển thị số server'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('custom')
                .setDescription('Đặt trạng thái tùy chỉnh')
                .addStringOption(option =>
                    option.setName('activity')
                        .setDescription('Hoạt động hiển thị')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Loại hoạt động')
                        .setRequired(false)
                        .addChoices(
                            { name: 'Playing', value: 'Playing' },
                            { name: 'Listening', value: 'Listening' },
                            { name: 'Watching', value: 'Watching' },
                            { name: 'Competing', value: 'Competing' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Xem thông tin trạng thái hiện tại'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();

        if (!client.statusManager) {
            return interaction.reply({
                content: '❌ StatusManager chưa được khởi tạo!',
                ephemeral: true
            });
        }

        try {
            switch (subcommand) {
                case 'server-count':
                    const serverCount = client.guilds.cache.size;
                    await client.statusManager.setServerCountStatus(serverCount);
                    
                    const serverEmbed = new EmbedBuilder()
                        .setTitle('✅ Cập nhật trạng thái thành công')
                        .setDescription(`Đã cập nhật trạng thái hiển thị số server: **${serverCount} servers**`)
                        .setColor('#00FF00')
                        .setTimestamp();
                    
                    await interaction.reply({ embeds: [serverEmbed], ephemeral: true });
                    break;

                case 'custom':
                    const activity = interaction.options.getString('activity');
                    const type = interaction.options.getString('type') || 'Playing';
                    
                    await client.statusManager.setCustomStatus(activity, type);
                    
                    const customEmbed = new EmbedBuilder()
                        .setTitle('✅ Trạng thái tùy chỉnh đã được đặt')
                        .addFields(
                            { name: 'Hoạt động', value: activity, inline: true },
                            { name: 'Loại', value: type, inline: true }
                        )
                        .setColor('#FF6B6B')
                        .setTimestamp();
                    
                    await interaction.reply({ embeds: [customEmbed], ephemeral: true });
                    break;

                case 'info':
                    const isPlaying = client.statusManager.getIsPlaying();
                    const currentActivity = client.user.presence?.activities[0];
                    
                    const infoEmbed = new EmbedBuilder()
                        .setTitle('📊 Thông tin trạng thái bot')
                        .addFields(
                            { name: '🎵 Đang phát nhạc', value: isPlaying ? 'Có' : 'Không', inline: true },
                            { name: '🔢 Số server', value: client.guilds.cache.size.toString(), inline: true },
                            { name: '👥 Số user', value: client.guilds.cache.reduce((a, g) => a + g.memberCount, 0).toString(), inline: true },
                            { name: '📺 Trạng thái hiện tại', value: currentActivity ? `${currentActivity.name} (${currentActivity.type})` : 'Không có', inline: false }
                        )
                        .setColor('#00C3FF')
                        .setThumbnail(client.user.displayAvatarURL())
                        .setTimestamp();
                    
                    await interaction.reply({ embeds: [infoEmbed], ephemeral: true });
                    break;
            }
        } catch (error) {
            console.error(`${colors.red}[ LỖI STATUS CMD ]${colors.reset}`, error);
            
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Lỗi')
                .setDescription('Đã xảy ra lỗi khi thực hiện lệnh!')
                .setColor('#FF0000')
                .setTimestamp();
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },
};