const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { centralMusicCollection } = require('../../mongodb');
const cmdIcons = require('../../UI/icons/commandicons');
const checkPermissions = require('../../utils/checkPermissions');
const phucx = require('../../phucx');

const COMMAND_SECURITY_TOKEN = phucx.SECURITY_TOKEN || 'DEFAULT_TOKEN';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('disable-central')
        .setDescription('Disable and remove the central music system')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    securityToken: COMMAND_SECURITY_TOKEN,

    async execute(interaction, client) {
        // Security validation
        if (!phucx || !phucx.validateCore || !phucx.validateCore()) {
            const embed = new EmbedBuilder()
                .setDescription('❌ System core offline - Command unavailable')
                .setColor('#FF0000');
            return interaction.reply({ embeds: [embed], flags: 64 }).catch(() => {});
        }
        
        interaction.phucxValidated = true;
        interaction.securityToken = COMMAND_SECURITY_TOKEN;
        
        if (interaction.isCommand && interaction.isCommand()) {
            const guild = interaction.guild;
            const serverId = guild.id;
            
            if (!await checkPermissions(interaction)) return;

            // Check if user has manage channels permission
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setDescription('❌ You need **Manage Channels** permission to use this command.');
                return interaction.reply({ embeds: [embed], flags: 64 });
            }

            try {
                // Check if central system exists
                const centralConfig = await centralMusicCollection.findOne({ serverId: serverId });
                
                if (!centralConfig) {
                    const embed = new EmbedBuilder()
                        .setColor('#ffaa00')
                        .setDescription('⚠️ No central music system found for this server.\nUse `/setup-central` to set one up.');
                    return interaction.reply({ embeds: [embed], flags: 64 });
                }

                // Create confirmation buttons
                const confirmRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('confirm_disable_central')
                            .setLabel('Yes, Disable')
                            .setEmoji('✅')
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId('cancel_disable_central')
                            .setLabel('Cancel')
                            .setEmoji('❌')
                            .setStyle(ButtonStyle.Secondary)
                    );

                const confirmEmbed = new EmbedBuilder()
                    .setColor('#ff9900')
                    .setTitle('🚨 Confirm Disable Central System')
                    .setDescription('Are you sure you want to disable the central music system?\n\n**This will:**\n• Remove the central music control panel\n• Stop any currently playing music\n• Delete the configuration from database\n\n**This action cannot be undone.**')
                    .setFooter({ text: 'You have 30 seconds to confirm', iconURL: interaction.client.user.displayAvatarURL() });

                const response = await interaction.reply({
                    embeds: [confirmEmbed],
                    components: [confirmRow],
                    flags: 64
                });

                // Wait for button interaction
                const collectorFilter = i => {
                    return i.user.id === interaction.user.id && 
                           (i.customId === 'confirm_disable_central' || i.customId === 'cancel_disable_central');
                };

                try {
                    const confirmation = await response.awaitMessageComponent({ 
                        filter: collectorFilter, 
                        time: 30000 
                    });

                    if (confirmation.customId === 'confirm_disable_central') {
                        // Disable the central system
                        await centralMusicCollection.deleteOne({ serverId: serverId });

                        // Try to delete the original central panel message
                        try {
                            const channel = guild.channels.cache.get(centralConfig.channelId);
                            if (channel) {
                                const message = await channel.messages.fetch(centralConfig.messageId).catch(() => null);
                                if (message) {
                                    await message.delete().catch(() => {});
                                }
                            }
                        } catch (error) {
                            console.log('Could not delete original central panel message:', error.message);
                        }

                        // Success embed
                        const successEmbed = new EmbedBuilder()
                            .setColor('#00ff00')
                            .setTitle('✅ Central System Disabled')
                            .setDescription('The central music system has been successfully disabled and removed.\n\n**Changes made:**\n• Central control panel deleted\n• Configuration removed from database\n• Music playback stopped\n\nYou can set up a new central system anytime using `/setup-central`.')
                            .setFooter({ text: 'Central system disabled', iconURL: cmdIcons.correctIcon });

                        await confirmation.update({
                            embeds: [successEmbed],
                            components: []
                        });

                    } else if (confirmation.customId === 'cancel_disable_central') {
                        // Cancel embed
                        const cancelEmbed = new EmbedBuilder()
                            .setColor('#00aa00')
                            .setTitle('❌ Action Cancelled')
                            .setDescription('The central music system remains active and unchanged.')
                            .setFooter({ text: 'No changes made', iconURL: cmdIcons.correctIcon });

                        await confirmation.update({
                            embeds: [cancelEmbed],
                            components: []
                        });
                    }

                } catch (error) {
                    // Timeout embed
                    const timeoutEmbed = new EmbedBuilder()
                        .setColor('#666666')
                        .setTitle('⏰ Confirmation Timeout')
                        .setDescription('No response received within 30 seconds. The central music system remains unchanged.')
                        .setFooter({ text: 'Action timed out', iconURL: cmdIcons.dotIcon });

                    await interaction.editReply({
                        embeds: [timeoutEmbed],
                        components: []
                    });
                }

            } catch (error) {
                console.error('Error disabling central music system:', error);
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setDescription('❌ An error occurred while disabling the central music system. Please try again.');
                
                if (interaction.replied) {
                    await interaction.editReply({ embeds: [errorEmbed], components: [] });
                } else {
                    await interaction.reply({ embeds: [errorEmbed], flags: 64 });
                }
            }
        } else {
            // If not used as a slash command, alert the user
            const embed = new EmbedBuilder()
                .setColor('#3498db')
                .setAuthor({ 
                    name: "Alert!", 
                    iconURL: cmdIcons.dotIcon,
                    url: "https://discord.gg/xQF9f9yUEM"
                })
                .setDescription('- This command can only be used through slash commands!\n- Please use `/disable-central`')
                .setTimestamp();
    
            await interaction.reply({ embeds: [embed] });
        }
    }
};

