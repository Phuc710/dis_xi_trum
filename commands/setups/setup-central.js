const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const { centralMusicCollection } = require('../../mongodb');
const { createStatusIconAttachments, getStatusIconUrls } = require('../../utils/statusIcons');
const checkPermissions = require('../../utils/checkPermissions');
const phucx = require('../../phucx');

const COMMAND_SECURITY_TOKEN = phucx.SECURITY_TOKEN || 'DEFAULT_TOKEN';
const statusIconUrls = getStatusIconUrls();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-central')
        .setDescription('Thiết lập hệ thống nhạc tập trung - gõ tên bài hát là bot phát nhạc')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption(option =>
            option.setName('voice-channel')
                .setDescription('Voice channel để phát nhạc')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildVoice))
        .addIntegerOption(option =>
            option.setName('volume')
                .setDescription('Âm lượng mặc định (1-100)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(100))
        .addRoleOption(option =>
            option.setName('allowed-role')
                .setDescription('Role được quyền sử dụng (để trống cho @everyone)')
                .setRequired(false)),

    async execute(interaction, client) {
        
        try {
            const guild = interaction.guild;
            const serverId = guild.id;
            const channelId = interaction.channel.id;
            const voiceChannel = interaction.options.getChannel('voice-channel');
            const volume = interaction.options.getInteger('volume') || 50;
            const allowedRole = interaction.options.getRole('allowed-role');

            // Check if user has manage channels permission
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setDescription('❌ Bạn cần quyền **Manage Channels** để sử dụng lệnh này.')
                    .setFooter({ text: 'Permission required', iconURL: statusIconUrls.wrong });
                return interaction.reply({
                    embeds: [embed],
                    files: createStatusIconAttachments(['wrong']),
                    flags: 64
                });
            }

            try {
                // Create the central music panel embed
                const centralEmbed = new EmbedBuilder()
                    .setAuthor({ 
                        name: '🎵 Boo Music Control Center', 
                        iconURL: 'https://cdn.discordapp.com/emojis/896724352949706762.gif',
                        url: 'https://discord.gg/cc9U4w6a' 
                    })
                    .setDescription([
                        '',
                        '🎵 **Hệ thống nhạc tập trung**',
                        '',
                        `🎤 **Voice Channel:** ${voiceChannel}`,
                        `🔊 **Âm lượng mặc định:** ${volume}%`,
                        `👥 **Role được phép:** ${allowedRole ? allowedRole : '@everyone'}`,
                        '',
                        '💡 **Cách sử dụng:**',
                        '• Gõ **tên bài hát** hoặc **link YouTube**',
                        '• Bot sẽ tự động phát nhạc ngay lập tức',
                        '• ✅ **Reaction xanh** = Phát thành công',
                        '• ❌ **Reaction đỏ** = Có lỗi',
                        '• Thông báo thông minh về bài hát tiếp theo',
                        '• **Không xóa** tin nhắn của bạn nữa!',
                        '',
                        '✨ *Sẵn sàng lấp đầy nơi này với âm nhạc tuyệt vời chưa?*'
                    ].join('\n'))
                    .setColor('#00c3ff')
                    .setFooter({ text: 'PHUCX Music Bot - Central System', iconURL: interaction.client.user.displayAvatarURL() })
                    .setTimestamp();

                // Create control buttons
                const row1 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('central_play_pause')
                            .setLabel('Play/Pause')
                            .setEmoji('⏯️')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('central_skip')
                            .setLabel('Skip')
                            .setEmoji('⏭️')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('central_stop')
                            .setLabel('Stop')
                            .setEmoji('⏹️')
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId('central_queue')
                            .setLabel('Queue')
                            .setEmoji('📃')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('central_shuffle')
                            .setLabel('Shuffle')
                            .setEmoji('🔀')
                            .setStyle(ButtonStyle.Secondary)
                    );

                const row2 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('central_volume_down')
                            .setLabel('Vol-')
                            .setEmoji('🔉')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('central_volume_up')
                            .setLabel('Vol+')
                            .setEmoji('🔊')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('central_loop')
                            .setLabel('Loop')
                            .setEmoji('🔁')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('central_disconnect')
                            .setLabel('Disconnect')
                            .setEmoji('🚪')
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId('central_nowplaying')
                            .setLabel('Now Playing')
                            .setEmoji('🎶')
                            .setStyle(ButtonStyle.Success)
                    );

                // Send the central panel
                const centralMessage = await interaction.reply({
                    embeds: [centralEmbed],
                    components: [row1, row2],
                    fetchReply: true
                });

                // Save configuration to database
                await centralMusicCollection.updateOne(
                    { serverId: serverId },
                    {
                        $set: {
                            serverId: serverId,
                            channelId: channelId,
                            messageId: centralMessage.id,
                            voiceChannelId: voiceChannel.id,
                            defaultVolume: volume,
                            allowedRoleId: allowedRole?.id || null,
                            status: true,
                            createdAt: new Date(),
                            ownerId: guild.ownerId
                        }
                    },
                    { upsert: true }
                );

                // Send success message
                const successEmbed = new EmbedBuilder()
                    .setTitle('🎵 Hệ Thống Nhạc Tập Trung Đã Sẵn Sàng!')
                    .setDescription(
                        `**Hệ thống nhạc tập trung đã được thiết lập!**\n\n` +
                        `🎯 **Cách sử dụng:**\n` +
                        `• Gõ tên bài hát hoặc link YouTube\n` +
                        `• Bot sẽ tự động phát nhạc\n` +
                        `• ✅ Reaction xanh = Phát thành công\n` +
                        `• ❌ Reaction đỏ = Lỗi\n` +
                        `• Thông báo thông minh về bài hát tiếp theo\n` +
                        `• Không xóa tin nhắn của bạn nữa!\n\n` +
                        `🎵 **Voice Channel:** ${voiceChannel}\n` +
                        `🔊 **Âm lượng:** ${volume}%\n` +
                        `👥 **Role được phép:** ${allowedRole ? allowedRole : '@everyone'}\n` +
                        `📍 **Control Panel:** Ở trên tin nhắn này`
                    )
                    .setColor('#00ff00')
                    .setFooter({ text: 'Hệ thống đã hoạt động', iconURL: statusIconUrls.tick });

                await interaction.followUp({
                    embeds: [successEmbed],
                    files: createStatusIconAttachments(['tick']),
                    flags: 64
                });

            } catch (innerError) {
                console.error('Error setting up central music system:', innerError);
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setDescription('❌ An error occurred while setting up the central music system. Please try again.')
                    .setFooter({ text: 'Action failed', iconURL: statusIconUrls.wrong });

                const errorPayload = {
                    embeds: [errorEmbed],
                    files: createStatusIconAttachments(['wrong']),
                    flags: 64
                };

                if (!interaction.replied) {
                    await interaction.reply(errorPayload);
                } else {
                    await interaction.followUp(errorPayload);
                }
            }
        } catch (error) {
            console.error('General error in setup-central command:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription('❌ An unexpected error occurred. Please try again later.')
                .setFooter({ text: 'Action failed', iconURL: statusIconUrls.wrong });

            const errorPayload = {
                embeds: [errorEmbed],
                files: createStatusIconAttachments(['wrong']),
                flags: 64
            };
            
            if (!interaction.replied) {
                await interaction.reply(errorPayload);
            } else {
                await interaction.followUp(errorPayload);
            }
        }
    }
};
