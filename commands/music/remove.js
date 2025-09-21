// remove.js - Fixed variable scope issue
const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const { useQueue } = require('discord-player');
const { Translate } = require('../../process_tools');

module.exports = {
    name: 'remove',
    description: "Remove a song from the queue",
    voiceChannel: true,
    options: [
        {
            name: 'song',
            description: 'The name/url of the track you want to remove',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
        {
            name: 'number',
            description: 'The place in the queue the song is in',
            type: ApplicationCommandOptionType.Number,
            required: false,
        }
    ],

    async execute({ inter }) {
        const queue = useQueue(inter.guild);
        if (!queue?.isPlaying()) {
            return inter.editReply({ content: await Translate(`No music currently playing ${inter.member}... try again? ❌`) });
        }

        const number = inter.options.getNumber('number');
        const track = inter.options.getString('song');
        
        if (!track && !number) {
            return inter.editReply({ content: await Translate(`You have to use one of the options to remove a song ❌`) });
        }

        let trackName = '';

        if (track) {
            const toRemove = queue.tracks.toArray().find((t) => t.title === track || t.url === track);
            if (!toRemove) {
                return inter.editReply({ content: await Translate(`Could not find ${track}... try using the url or full name ❌`) });
            }
            trackName = toRemove.title;
            queue.removeTrack(toRemove);
        } else if (number) {
            const index = number - 1;
            const trackToRemove = queue.tracks.toArray()[index];
            if (!trackToRemove) {
                return inter.editReply({ content: await Translate(`This track does not exist ❌`) });
            }
            trackName = trackToRemove.title;
            queue.removeTrack(index);
        }
        
        const embed = new EmbedBuilder()
            .setColor('#2f3136')
            .setAuthor({ name: await Translate(`Removed **${trackName}** from queue ✅`) });

        return inter.editReply({ embeds: [embed] });
    }
}