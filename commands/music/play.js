const { QueryType, useMainPlayer } = require('discord-player');
const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const { Translate } = require('../../process_tools');

module.exports = {
    name: 'play',
    description: "Play a song!",
    voiceChannel: true,
    options: [
        {
            name: 'song',
            description: 'The song you want to play',
            type: ApplicationCommandOptionType.String,
            required: true,
        }
    ],

    async execute({ inter, client }) {
        const player = useMainPlayer();
        const song = inter.options.getString('song');
        
        console.log(`🎵 Play command executed by ${inter.user.tag} for: ${song}`);
        
        // Check if user is in voice channel
        if (!inter.member.voice.channel) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ name: await Translate('❌ Bạn cần vào voice channel trước!') });
            return inter.editReply({ embeds: [errorEmbed] });
        }

        let defaultEmbed = new EmbedBuilder().setColor('#2f3136');

        try {
            // Search for the song
            console.log(`🔍 Searching for: ${song}`);
            const res = await player.search(song, {
                requestedBy: inter.member,
                searchEngine: QueryType.AUTO
            });

            if (!res?.tracks.length) {
                console.log(`❌ No results found for: ${song}`);
                defaultEmbed.setAuthor({ 
                    name: await Translate(`No results found... try again ? <❌>`) 
                });
                return inter.editReply({ embeds: [defaultEmbed] });
            }

            console.log(`✅ Search found ${res.tracks.length} tracks`);
            console.log(`🎵 First track: ${res.tracks[0].title}`);

            // ✅ CRITICAL FIX: Pass search result, not raw song string
            const { track } = await player.play(inter.member.voice.channel, res, {
                nodeOptions: {
                    metadata: {
                        channel: inter.channel,
                        client: inter.guild.members.me,
                        requestedBy: inter.member
                    },
                    volume: client.config.opt.volume,
                    leaveOnEmpty: client.config.opt.leaveOnEmpty,
                    leaveOnEmptyCooldown: client.config.opt.leaveOnEmptyCooldown,
                    leaveOnEnd: client.config.opt.leaveOnEnd,
                    leaveOnEndCooldown: client.config.opt.leaveOnEndCooldown,
                    selfDeaf: true,
                    bufferingTimeout: 15000,
                    skipOnNoStream: true
                }
            });

            console.log(`✅ Track loaded successfully: ${track.title}`);
            const queue = player.nodes.get(inter.guildId);
            console.log(`📊 Current queue size: ${queue?.size || 0}`);
            console.log(`▶️ Is playing: ${queue?.node?.isPlaying() || false}`);

            defaultEmbed.setAuthor({ 
                name: await Translate(`Loading <${track.title}> to the queue... <✅>`) 
            });
            
            await inter.editReply({ embeds: [defaultEmbed] });

        } catch (error) {
            console.error(`❌ Play command error:`, error);
            
            let errorMessage = 'Unknown error occurred';
            
            if (error.message.includes('voice channel')) {
                errorMessage = `I can't join the voice channel... try again ? <❌>`;
            } else if (error.message.includes('permissions')) {
                errorMessage = `I don't have permission to join/speak in this voice channel <❌>`;
            } else if (error.message.includes('search')) {
                errorMessage = `Failed to search for the song... try again ? <❌>`;
            } else {
                errorMessage = `Error: ${error.message} <❌>`;
            }

            defaultEmbed.setAuthor({ 
                name: await Translate(errorMessage) 
            });
            
            return inter.editReply({ embeds: [defaultEmbed] });
        }
    }
}