const { ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require("discord.js");
const { Translate } = require("../../process_tools");

module.exports = async (queue, track) => {
    console.log(`🎬 playerStart triggered - Track: ${track.title}`);
    console.log(`📊 Queue size: ${queue.size}`);
    console.log(`▶️ Is playing: ${queue.node.isPlaying()}`);
    
    if (!queue.metadata?.channel) return;
    if (!client.config.app.loopMessage && queue.repeatMode !== 0) return;

    const EmojiState = client.config.app.enableEmojis;
    const emojis = client.config.emojis;

    try {
        const embed = new EmbedBuilder()
          .setAuthor({ 
              name: await Translate(`🎵 Now playing **${track.title}** in **${queue.channel.name}**`), 
              iconURL: track.thumbnail 
          })
          .setDescription('💿 Đang phát nhạc...')
          .setColor('#2f3136');

        const back = new ButtonBuilder()
            .setLabel(EmojiState ? emojis.back : 'Back')
            .setCustomId('back')
            .setStyle('Primary');

        const skip = new ButtonBuilder()
            .setLabel(EmojiState ? emojis.skip : 'Skip')
            .setCustomId('skip')
            .setStyle('Primary');

        const resumepause = new ButtonBuilder()
            .setLabel(EmojiState ? emojis.ResumePause : 'Pause/Resume')
            .setCustomId('resume&pause')
            .setStyle('Danger');

        const loop = new ButtonBuilder()
            .setLabel(EmojiState ? emojis.loop : 'Loop')
            .setCustomId('loop')
            .setStyle('Danger');

        const lyrics = new ButtonBuilder()
            .setLabel(EmojiState ? emojis.lyrics : 'Lyrics')
            .setCustomId("lyrics")
            .setStyle("Success");

        const clear = new ButtonBuilder()
            .setLabel(EmojiState ? emojis.clear : 'Clear')
            .setCustomId('clear')
            .setStyle('Danger');
            
        const volumedown = new ButtonBuilder()
            .setLabel(EmojiState ? emojis.volumeDown : 'Vol-')
            .setCustomId('volumedown')
            .setStyle('Primary');
            
        const volumeup = new ButtonBuilder()
            .setLabel(EmojiState ? emojis.volumeUp : 'Vol+')
            .setCustomId('volumeup')
            .setStyle('Primary');

        const row1 = new ActionRowBuilder().addComponents(back, loop, resumepause,skip );
        const row2 = new ActionRowBuilder().addComponents(lyrics, volumedown, volumeup, clear);
        
        await queue.metadata.channel.send({ embeds: [embed], components: [row1, row2] });
    } catch (error) {
        console.log(`playerStart error: ${error.message}`);
    }
};
