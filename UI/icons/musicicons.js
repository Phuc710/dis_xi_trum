const path = require('path');

const musicIcons = {
    footerIcon: 'https://cdn.discordapp.com/emojis/865916418909536276.gif', 
    correctIcon: 'attachment://wrong.gif',
    tickIcon: 'attachment://tick.gif',
    playerIcon: 'attachment://itachi-sharingan.gif',
    wrongIcon: 'attachment://wrong.gif',
    pauseresumeIcon:'https://cdn.discordapp.com/emojis/836145735254540339.gif',
    playIcon:'https://cdn.discordapp.com/attachments/1230824451990622299/1236664581364125787/music-play.gif?ex=669c5e64&is=669b0ce4&hm=b081d67248271167b5aec2e07a2c9c848e16bfa5ba4bdb2067221b0d259c1b38&',
    loopIcon: 'https://cdn.discordapp.com/emojis/749272851529334795.gif',
    beatsIcon: 'https://cdn.discordapp.com/emojis/928310693416009828.gif',
    alertIcon : 'https://cdn.discordapp.com/emojis/996431685358981201.gif',
    skipIcon: 'https://cdn.discordapp.com/emojis/938388856095514654.gif',
    stopIcon: 'https://cdn.discordapp.com/emojis/1021628438441902100.gif',
    volumeIcon: 'https://cdn.discordapp.com/emojis/1040824501711159397.gif',
    // Local file paths for status icons
    itachiIconPath: path.join(__dirname, '..', 'musicimages', 'itachi-sharingan.gif'),
    tickIconPath: path.join(__dirname, '..', 'musicimages', 'tick.gif'),
    wrongIconPath: path.join(__dirname, '..', 'musicimages', 'wrong.gif')
};

module.exports = musicIcons;

