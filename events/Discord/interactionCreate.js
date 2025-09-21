const { EmbedBuilder, InteractionType, MessageFlags } = require('discord.js');
const { useQueue } = require('discord-player');
const { Translate } = require('../../process_tools');

module.exports = async (client, inter) => {
    await inter.deferReply({ flags: [MessageFlags.Ephemeral] });

    if (inter.type === InteractionType.ApplicationCommand) {
        const DJ = client.config.opt.DJ;
        const command = client.commands.get(inter.commandName);

        // Embed báo lỗi chung
        const errorEmbed = new EmbedBuilder()
            .setColor('#ff4d4d')
            .setAuthor({ name: "⚠️ Lỗi" })
            .setFooter({ text: "Vui lòng thử lại." })
            .setTimestamp();

        if (!command) {
            errorEmbed.setDescription(await Translate("❌ | Lệnh không tồn tại! Hãy liên hệ Developer."));
            inter.editReply({ embeds: [errorEmbed] });
            return client.slash?.delete(inter.commandName);
        }

        if (command.permissions && !inter.member.permissions.has(command.permissions)) {
            errorEmbed.setDescription(await Translate("❌ | Bạn không có quyền để dùng lệnh này."));
            return inter.editReply({ embeds: [errorEmbed] });
        }

        if (
            DJ.enabled &&
            DJ.commands.includes(command) &&
            !inter.member._roles.includes(inter.guild.roles.cache.find(x => x.name === DJ.roleName)?.id)
        ) {
            errorEmbed.setDescription(
                await Translate(`❌ | Lệnh này chỉ dành cho thành viên có role \`${DJ.roleName}\``)
            );
            return inter.editReply({ embeds: [errorEmbed] });
        }

        if (command.voiceChannel) {
            if (!inter.member.voice.channel) {
                errorEmbed.setDescription(await Translate("❌ | Bạn cần tham gia kênh thoại trước khi dùng lệnh này."));
                return inter.editReply({ embeds: [errorEmbed] });
            }

            if (
                inter.guild.members.me.voice.channel &&
                inter.member.voice.channel.id !== inter.guild.members.me.voice.channel.id
            ) {
                errorEmbed.setDescription(await Translate("❌ | Bạn phải ở cùng kênh thoại với bot."));
                return inter.editReply({ embeds: [errorEmbed] });
            }
        }

        // Thực thi lệnh
        command.execute({ inter, client });
    } 
    
    else if (inter.type === InteractionType.MessageComponent) {
        const customId = inter.customId;
        if (!customId) return;

        const queue = useQueue(inter.guild);
        const path = `../../buttons/${customId}.js`;

        try {
            delete require.cache[require.resolve(path)];
            const button = require(path);
            if (button) return button({ client, inter, customId, queue });
        } catch (error) {
            console.log(`Button error: ${error.message}`);
        }
    }
};
