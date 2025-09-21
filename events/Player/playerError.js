// playerError.js
const { EmbedBuilder } = require('discord.js');
const { Translate } = require("../../process_tools");

module.exports = async (queue, error) => {
    if (!queue.metadata?.channel) return;

    try {
        const embed = new EmbedBuilder()
            .setAuthor({ 
                name: await Translate(`Player error occurred! Check console.`)
            })
            .setColor('#EE4B2B');

        await queue.metadata.channel.send({ embeds: [embed] });
        console.error(`Player Error: ${error.message}`);
    } catch (err) {
        console.error(`Player error handler failed: ${err.message}`);
    }
}