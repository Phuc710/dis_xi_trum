// playerSkip.js
const { EmbedBuilder } = require('discord.js');
const { Translate } = require("../../process_tools");

module.exports = async (queue, track) => {
    if (!queue.metadata?.channel) return;

    try {
        const embed = new EmbedBuilder()
            .setAuthor({ 
                name: await Translate(`Skipping **${track.title}** due to issue! ⏭️`),
                iconURL: track.thumbnail
            })
            .setColor('#EE4B2B');

        await queue.metadata.channel.send({ embeds: [embed] });
    } catch (error) {
        console.log(`playerSkip error: ${error.message}`);
    }
}