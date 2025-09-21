const { EmbedBuilder } = require('discord.js');
const { useQueue } = require('discord-player');
const { Translate } = require('../../process_tools');

module.exports = {
    name: 'history',
    description:('See the history of the queue'),
    voiceChannel: false,

    async execute({ inter }) {
        const queue = useQueue(inter.guild);

        if (!queue || queue.history.tracks.size === 0) {
            return inter.editReply({ content: await Translate(`Chưa có nhạc nào được phát.`) });
        }

        const tracks = queue.history.tracks.toArray();
        const limitedTracks = tracks.slice(0, 20);

        const description = limitedTracks
            .map((track, index) => `**${index + 1}.** [${track.title}](${track.url}) by ${track.author}`)
            .join('\r\n\r\n');

        const historyEmbed = new EmbedBuilder()
            .setTitle(`Lịch sử phát nhạc`)
            .setDescription(description)
            .setColor('#2f3136')
            .setTimestamp()
            .setFooter({ text: await Translate('Lịch sử nhạc <:heart:>'), iconURL: inter.member.avatarURL({ dynamic: true }) });

        inter.editReply({ embeds: [historyEmbed] });
    }
}