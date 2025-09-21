const { EmbedBuilder } = require('discord.js');
const { Translate } = require('../process_tools');

module.exports = async ({ client, inter, queue }) => {
    // ❌ Không có nhạc
    if (!queue?.isPlaying()) {
        return inter.editReply({ content: await Translate(`No music currently playing... try again ? ❌`) });
    }

    // Kiểm tra danh sách hàng chờ
    const tracksArray = Array.isArray(queue.tracks) ? queue.tracks : queue.tracks.toArray?.() || [];
    if (!tracksArray.length) {
        return inter.editReply({ content: await Translate(`No music in the queue after the current one... try again ? ❌`) });
    }

    // 🔁 Loop modes
    const methods = ['', '🔁', '🔂'];
    const songs = tracksArray.length;
    const nextSongs = songs > 5
        ? await Translate(`And **${songs - 5}** other song(s)...`)
        : await Translate(`In the playlist **${songs}** song(s)...`);

    // Format danh sách track
    const tracks = tracksArray.map((track, i) =>
        `**${i + 1}** - ${track.title} | ${track.author} (requested by: ${track.requestedBy?.displayName || "unknown"})`
    );

    // Track hiện tại
    const current = queue.currentTrack
        ? `${queue.currentTrack.title} | ${queue.currentTrack.author} (🎶 requested by: ${queue.currentTrack.requestedBy?.displayName || "unknown"})`
        : await Translate("No track is currently playing ❌");

    // Embed hiển thị queue
    const embed = new EmbedBuilder()
        .setColor('#2f3136')
        .setThumbnail(inter.guild.iconURL({ size: 2048, dynamic: true }))
        .setAuthor({
            name: await Translate(`Server queue - ${inter.guild.name} ${methods[queue.repeatMode] || ''}`),
            iconURL: client.user.displayAvatarURL({ size: 1024, dynamic: true })
        })
        .setDescription(
            `🎵 **Current:**\n${current}\n\n` +
            `${tracks.slice(0, 5).join('\n')}\n\n${nextSongs}`
        )
        .setTimestamp()
        .setFooter({
            text: await Translate('Music is coming ❤️'),
            iconURL: inter.member.displayAvatarURL({ dynamic: true }) || client.user.displayAvatarURL()
        });

    return inter.editReply({ embeds: [embed] });
};
