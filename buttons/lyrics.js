const { EmbedBuilder } = require('discord.js');
const { useMainPlayer } = require('discord-player');
const { Translate } = require('../process_tools');

module.exports = async ({ inter, queue }) => {
    const player = useMainPlayer();

    if (!queue?.isPlaying()) {
        return inter.editReply({
            content: await Translate(`No music currently playing <${inter.member}>... try again ? <❌>`)
        });
    }

    const results = await player.lyrics
        .search({ q: queue.currentTrack.title })
        .catch(async (e) => {
            console.error(e);
            return null;
        });

    const lyrics = results?.[0];
    if (!lyrics?.plainLyrics) {
        return inter.editReply({
            content: await Translate(`No lyrics found for <${queue.currentTrack.title}>... try again ? <❌>`)
        });
    }

    // ✂️ Cắt lyrics tối đa 4000 ký tự để an toàn
    const trimmedLyrics = lyrics.plainLyrics.length > 4000
        ? lyrics.plainLyrics.substring(0, 3997) + "..."
        : lyrics.plainLyrics;

    const embed = new EmbedBuilder()
        .setTitle(await Translate(`Lyrics for <${queue.currentTrack.title}>`))
        .setAuthor({
            name: lyrics.artistName || await Translate("Unknown Artist")
        })
        .setDescription(trimmedLyrics)
        .setFooter({
            text: await Translate('Music is coming ❤️'),
            iconURL: inter.member.displayAvatarURL?.({ dynamic: true }) ||
                     inter.client.user.displayAvatarURL()
        })
        .setTimestamp()
        .setColor('#2f3136');

    return inter.editReply({ embeds: [embed] });
};
