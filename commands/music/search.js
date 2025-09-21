// search.js - Fixed variable naming conflict
const { ApplicationCommandOptionType, EmbedBuilder, MessageFlags } = require('discord.js');
const { QueryType, useMainPlayer } = require('discord-player');
const { Translate } = require('../../process_tools');

module.exports = {
    name: 'search',
    description: 'Search a song',
    voiceChannel: true,
    options: [
        {
            name: 'song',
            description: 'The song you want to search',
            type: ApplicationCommandOptionType.String,
            required: true,
        }
    ],

    async execute({ client, inter }) {
        const player = useMainPlayer();
        const song = inter.options.getString('song');

        const res = await player.search(song, {
            requestedBy: inter.member,
            searchEngine: QueryType.AUTO
        });

        if (!res?.tracks.length) {
            return inter.editReply({ content: await Translate(`No results found ${inter.member}... try again? ❌`) });
        }

        const queue = player.nodes.create(inter.guild, {
            metadata: { channel: inter.channel },
            spotifyBridge: client.config.opt.spotifyBridge,
            volume: client.config.opt.volume || 75,
            leaveOnEnd: client.config.opt.leaveOnEnd,
            leaveOnEmpty: client.config.opt.leaveOnEmpty
        });
        
        const maxTracks = res.tracks.slice(0, 10);

        const embed = new EmbedBuilder()
            .setColor('#2f3136')
            .setAuthor({ 
                name: await Translate(`Results for: ${song}`), 
                iconURL: client.user.displayAvatarURL({ size: 1024, dynamic: true }) 
            })
            .setDescription(
                maxTracks.map((track, i) => `**${i + 1}**. ${track.title} | ${track.author}`).join('\n') +
                `\n\nSelect choice between **1** and **${maxTracks.length}** or **cancel**`
            )
            .setTimestamp()
            .setFooter({ 
                text: await Translate('Made with {Phucx❤️}'), 
                iconURL: inter.member.avatarURL({ dynamic: true }) 
            });

        await inter.editReply({ embeds: [embed] });

        const collector = inter.channel.createMessageCollector({
            time: 15000,
            max: 1,
            errors: ['time'],
            filter: m => m.author.id === inter.member.id
        });

        collector.on('collect', async (message) => {
            collector.stop();
            
            if (message.content.toLowerCase() === 'cancel') {
                return inter.followUp({ content: await Translate(`Search cancelled ✅`), flags: [MessageFlags.Ephemeral] });
            }

            const value = parseInt(message.content);
            if (!value || value <= 0 || value > maxTracks.length) {
                return inter.followUp({ 
                    content: await Translate(`Invalid response, try a value between **1** and **${maxTracks.length}** or **cancel** ❌`), 
                    flags: [MessageFlags.Ephemeral] 
                });
            }

            try {
                if (!queue.connection) await queue.connect(inter.member.voice.channel);
                await inter.followUp({ content: await Translate(`Loading your search... 🎧`), flags: [MessageFlags.Ephemeral] });
                queue.addTrack(res.tracks[value - 1]);
                if (!queue.isPlaying()) await queue.node.play();
            } catch (error) {
                console.log(`Search play error: ${error.message}`);
                await player.deleteQueue(inter.guildId);
                return inter.followUp({ 
                    content: await Translate(`Can't join the voice channel ❌`), 
                    flags: [MessageFlags.Ephemeral] 
                });
            }
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                return inter.followUp({ 
                    content: await Translate(`Search timed out ❌`), 
                    flags: [MessageFlags.Ephemeral] 
                });
            }
        });
    }
}