const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'help',
    description: "Hiển thị tất cả lệnh của bot",
    showHelp: false,

    async execute({ client, inter }) {
        const commands = client.commands.filter(x => x.showHelp !== false);

        const musicCmds = commands.filter(cmd => 
            ['play', 'stop', 'pause', 'resume', 'skip', 'queue', 'volume', 'loop', 'shuffle', 'nowplaying', 'clear'].includes(cmd.name)
        );
        const utilityCmds = commands.filter(cmd => 
            !['play', 'stop', 'pause', 'resume', 'skip', 'queue', 'volume', 'loop', 'shuffle', 'nowplaying', 'clear'].includes(cmd.name)
        );

        const embed = new EmbedBuilder()
            .setColor('#FF6B9D')
            .setAuthor({ 
                name: `${client.user.username} - Music Bot 🎵`, 
                iconURL: client.user.displayAvatarURL() 
            })
            .setTitle('📋 **DANH SÁCH LỆNH**')
            .setDescription('Bot Văn Minh hẹ hẹ')

        if (musicCmds.size > 0) {
            embed.addFields([{
                name: `🎵 **LỆNH NHẠC** (${musicCmds.size})`,
                value: musicCmds.map(x => `\`/${x.name}\``).join('\n'),
                inline: true
            }]);
        }

        if (utilityCmds.size > 0) {
            embed.addFields([{
                name: `⚙️ **LỆNH TIỆN ÍCH** (${utilityCmds.size})`,
                value: utilityCmds.map(x => `\`/${x.name}\``).join('\n'),
                inline: true
            }]);
        }

        // Thêm Boo Commands
        embed.addFields([
            {
                name: '🎭 **BOO COMMANDS** (4)',
                value: '`!mood` - change mood\n`!trollpic` - Ảnh troll\n`!boi` - Coi bói\n`!weather` - thời tiết',
                inline: true
            },
            {
                name: '📊 **THỐNG KÊ**',
                value: `🤖 ${client.guilds.cache.size} servers\n👥 ${client.users.cache.size} users\n⚡ ${client.ws.ping}ms`,
                inline: true
            },
            {
                name: '💡 **HƯỚNG DẪN NHANH**',
                value: `**Nhạc:** \`/play [bài hát]\`\n**Boo Chat:** Gọi tên "boo" hoặc tag bot (@boo)`,
                inline: true
            },
        ])
        .setImage('https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExbTNyeGRzcjhodGJrajRiZWk5dnd4cHZhdDFtdDJsNjFnajVrNGZtZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/vLZJfnIqxLla26Gr4i/giphy.gif')
        .setTimestamp()
        .setFooter({ 
            text: `🎼 Music + Boo Agent • Made with ❤️ by Phucx • ${new Date().getFullYear()}`, 
            iconURL: inter.member.displayAvatarURL({ dynamic: true }) 
        });

        // Contact buttons
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('📘 GitHub')
                    .setURL('https://github.com/Phuc710/dis_xi_trum')
                    .setStyle(ButtonStyle.Link),
                new ButtonBuilder()
                    .setLabel('💬 Discord')
                    .setURL('https://discord.gg/cc9U4w6a')
                    .setStyle(ButtonStyle.Link),
                new ButtonBuilder()
                    .setLabel('☕ Donate')
                    .setURL('https://vn.x10.mx')
                    .setStyle(ButtonStyle.Link)
            );

        await inter.editReply({ 
            embeds: [embed], 
            components: [row] 
        });
    }
};