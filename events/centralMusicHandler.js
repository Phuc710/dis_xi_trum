const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { centralMusicCollection } = require('../mongodb');
const phucx = require('../phucx');

module.exports = (client) => {
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton()) return;
        
        // Check if this is a central music button
        if (!interaction.customId.startsWith('central_')) return;
        
        // Check if interaction is still valid (timeout after 3 seconds)
        if (Date.now() - interaction.createdTimestamp > 3000) {
            console.log('Central music interaction expired, skipping...');
            return;
        }

        const guild = interaction.guild;
        const member = interaction.member;
        const serverId = guild.id;

        try {
            // Security validation
            if (!phucx || !phucx.validateCore || !phucx.validateCore()) {
                return interaction.reply({
                    content: '❌ System core offline - Command unavailable',
                    flags: 64
                });
            }
            
            // Get central music configuration
            const centralConfig = await centralMusicCollection.findOne({ serverId: serverId });
            
            if (!centralConfig) {
                return interaction.reply({
                    content: '❌ No central music system found. Use `/setup-central` to set one up.',
                    flags: 64
                });
            }

            // Check if user has permission (allowed role or manage channels)
            const hasPermission = !centralConfig.allowedRoleId || 
                                member.roles.cache.has(centralConfig.allowedRoleId) ||
                                member.permissions.has('MANAGE_CHANNELS');

            if (!hasPermission) {
                return interaction.reply({
                    content: '❌ You don\'t have permission to use the music controls.',
                    flags: 64
                });
            }

            // Check if user is in the configured voice channel
            const voiceChannel = guild.channels.cache.get(centralConfig.voiceChannelId);
            if (!voiceChannel || !member.voice.channel || member.voice.channel.id !== voiceChannel.id) {
                return interaction.reply({
                    content: `❌ You must be in ${voiceChannel} to use music controls.`,
                    flags: 64
                });
            }

            // Get the music player (Riffy or Distube)
            const player = client.riffy ? client.riffy.players.get(serverId) : null;
            const action = interaction.customId.replace('central_', '');

            switch (action) {
                case 'play_pause':
                    if (!player || !player.current) {
                        return interaction.reply({
                            content: '❌ No music is currently playing. Use `/play` to start playing music.',
                            flags: 64
                        });
                    }
                    
                    if (player.paused) {
                        await player.resume();
                        await interaction.reply({
                            content: '▶️ **Resumed** the current track.',
                            flags: 64
                        });
                    } else {
                        await player.pause();
                        await interaction.reply({
                            content: '⏸️ **Paused** the current track.',
                            flags: 64
                        });
                    }
                    break;

                case 'skip':
                    if (!player || !player.current) {
                        return interaction.reply({
                            content: '❌ No music is currently playing.',
                            flags: 64
                        });
                    }
                    
                    await player.stop();
                    await interaction.reply({
                        content: '⏭️ **Skipped** to the next track.',
                        flags: 64
                    });
                    break;

                case 'stop':
                    if (!player) {
                        return interaction.reply({
                            content: '❌ No music player found.',
                            flags: 64
                        });
                    }
                    
                    await player.destroy();
                    await interaction.reply({
                        content: '⏹️ **Stopped** music and cleared the queue.',
                        flags: 64
                    });
                    break;

                case 'queue':
                    if (!player || !player.queue || player.queue.length === 0) {
                        return interaction.reply({
                            content: '📃 The queue is empty.',
                            flags: 64
                        });
                    }
                    
                    const queueList = player.queue.slice(0, 10).map((track, index) => 
                        `**${index + 1}.** ${track.info.title} - \`${track.info.author}\``
                    ).join('\n');
                    
                    const queueEmbed = new EmbedBuilder()
                        .setTitle('🎵 Music Queue')
                        .setDescription(queueList + (player.queue.length > 10 ? `\n\n*...and ${player.queue.length - 10} more tracks*` : ''))
                        .setColor('#00c3ff')
                        .setFooter({ text: `Total: ${player.queue.length} tracks` });
                    
                    await interaction.reply({ embeds: [queueEmbed], flags: 64 });
                    break;

                case 'shuffle':
                    if (!player || !player.queue || player.queue.length < 2) {
                        return interaction.reply({
                            content: '❌ Need at least 2 tracks in queue to shuffle.',
                            flags: 64
                        });
                    }
                    
                    // Simple shuffle implementation
                    for (let i = player.queue.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [player.queue[i], player.queue[j]] = [player.queue[j], player.queue[i]];
                    }
                    
                    await interaction.reply({
                        content: '🔀 **Shuffled** the queue.',
                        flags: 64
                    });
                    break;

                case 'volume_up':
                    if (!player) {
                        return interaction.reply({
                            content: '❌ No music player found.',
                            flags: 64
                        });
                    }
                    
                    const newVolumeUp = Math.min(player.volume + 10, 100);
                    await player.setVolume(newVolumeUp);
                    await interaction.reply({
                        content: `🔊 Volume increased to **${newVolumeUp}%**`,
                        flags: 64
                    });
                    break;

                case 'volume_down':
                    if (!player) {
                        return interaction.reply({
                            content: '❌ No music player found.',
                            flags: 64
                        });
                    }
                    
                    const newVolumeDown = Math.max(player.volume - 10, 0);
                    await player.setVolume(newVolumeDown);
                    await interaction.reply({
                        content: `🔉 Volume decreased to **${newVolumeDown}%**`,
                        flags: 64
                    });
                    break;

                case 'loop':
                    if (!player) {
                        return interaction.reply({
                            content: '❌ No music player found.',
                            flags: 64
                        });
                    }
                    
                    const loopMode = player.loop === 'track' ? 'queue' : player.loop === 'queue' ? 'none' : 'track';
                    player.setLoop(loopMode);
                    
                    const loopText = loopMode === 'track' ? '🔂 Single Track' : 
                                   loopMode === 'queue' ? '🔁 Queue' : '▶️ Disabled';
                    
                    await interaction.reply({
                        content: `🔁 Loop mode: **${loopText}**`,
                        flags: 64
                    });
                    break;

                case 'disconnect':
                    if (!player) {
                        return interaction.reply({
                            content: '❌ No music player found.',
                            flags: 64
                        });
                    }
                    
                    await player.destroy();
                    await interaction.reply({
                        content: '🚪 **Disconnected** from voice channel.',
                        flags: 64
                    });
                    break;

                case 'nowplaying':
                    if (!player || !player.current) {
                        return interaction.reply({
                            content: '❌ No music is currently playing.',
                            flags: 64
                        });
                    }
                    
                    const track = player.current;
                    const nowPlayingEmbed = new EmbedBuilder()
                        .setTitle('🎵 Now Playing')
                        .setDescription(`**${track.info.title}**`)
                        .addFields(
                            {
                                name: '🎤 Nghệ sĩ',
                                value: track.info.author || 'Unknown',
                                inline: true
                            },
                            {
                                name: '👤 Yêu cầu bởi',
                                value: track.requester ? `<@${track.requester.id}>` : 'Unknown',
                                inline: true
                            },
                            {
                                name: '⏰ Thời lượng',
                                value: formatTime(track.info.length),
                                inline: true
                            },
                            {
                                name: '🔊 Âm lượng',
                                value: `${player.volume}%`,
                                inline: true
                            },
                            {
                                name: '🔁 Loop Mode',
                                value: player.loop === 'track' ? '🔂 Track' : player.loop === 'queue' ? '🔁 Queue' : '▶️ None',
                                inline: true
                            },
                            {
                                name: '📃 Queue Position',
                                value: player.queue.length > 0 ? `${player.queue.length} tracks remaining` : 'Empty',
                                inline: true
                            }
                        )
                        .setColor('#00c3ff')
                        .setFooter({ 
                            text: 'Boo Music Bot - Central System', 
                            iconURL: client.user.displayAvatarURL() 
                        })
                        .setTimestamp();
                        
                    if (track.info.artwork || track.info.artworkUrl) {
                        nowPlayingEmbed.setThumbnail(track.info.artwork || track.info.artworkUrl);
                    }
                    
                    await interaction.reply({ embeds: [nowPlayingEmbed], flags: 64 });
                    break;

                default:
                    await interaction.reply({
                        content: '❌ Unknown music control.',
                        flags: 64
                    });
            }

        } catch (error) {
            console.error('Error handling central music interaction:', error);
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '❌ An error occurred while processing your request.',
                        flags: 64
                    });
                }
            } catch (replyError) {
                console.error('Failed to send error message:', replyError);
            }
        }
    });
};

function formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}