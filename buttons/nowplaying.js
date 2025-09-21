const { EmbedBuilder } = require('discord.js');
const { Translate } = require('../process_tools');

module.exports = async ({ client, inter, queue }) => {
    if (!queue?.isPlaying()) {
        return inter.editReply({ content: await Translate(`No music currently playing... try again ? ❌`) });
    }

    const track = queue.currentTrack;
    if (!track) {
        return inter.editReply({ content: await Translate(`No track is currently playing... try again ? ❌`) });
    }

    // 🔁 Loop modes
    const methods = ['disabled', 'track', 'queue'];

    // ⏳ Duration check
    const trackDuration = track.durationMS === 0
        ? await Translate("infinity (live)")
        : track.duration;

    // 📊 Progress bar
    const progress = queue.node.createProgressBar({ timecodes: true });

    // 👤 Requested by
    const requestedBy = track.requestedBy?.toString?.() || "unknown";

    // 📌 Embed
    const embed = new EmbedBuilder()
        .setAuthor({
            name: track.title,
            iconURL: client.user.displayAvatarURL({ size: 1024, dynamic: true })
        })
        .setThumbnail(track.thumbnail || null)
        .setDescription(
            await Translate(
                `🔊 Volume **${queue.node.volume}%**\n` +
                `⏳ Duration **${trackDuration}**\n` +
                `📊 Progress ${progress}\n` +
                `🔁 Loop mode **${methods[queue.repeatMode]}**\n` +
                `🙋 Requested by ${requestedBy}`
            )
        )
        .setFooter({
            text: await Translate('Music is coming ❤️'),
            iconURL: inter.member.displayAvatarURL({ dynamic: true }) || client.user.displayAvatarURL()
        })
        .setColor('#2f3136')
        .setTimestamp();

    return inter.editReply({ embeds: [embed] });
};
