/*
 * Help Command - Boo Bot
 * Made with ❤️ by Phucx
 */

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../../config.js');
const cmdIcons = require('../../UI/icons/commandicons');
const { helpBanner } = require('../../UI/banners/SetupBanners');

// Dịch tên category sang tiếng Việt
const CATEGORY_NAMES_VI = {
    'basic': 'Cơ Bản',
    'utility': 'Tiện Ích',
    'moderation': 'Quản Lý',
    'music': 'Âm Nhạc',
    'lavalink': 'Âm Nhạc Lavalink',
    'distube': 'Âm Nhạc Distube',
    'economy': 'Kinh Tế',
    'admin': 'Quản Trị',
    'core': 'Lõi',
    'media': 'Phương Tiện',
    'setups': 'Thiết Lập',
    'other': 'Khác',
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Hiển thị danh sách lệnh và thông tin bot'),

    async execute(interaction) {
      
        await interaction.deferReply();
        
        if (interaction.isCommand && interaction.isCommand()) {
     
            const BOT_ICON = "https://cdn.discordapp.com/emojis/1334648756649590805.png";
            const EMBED_COLOR = "#5865F2"; 
            const FOOTER_TEXT = "Boo Bot • Made with ❤️ by Phucx";
            const COMMANDS_DIR = path.join(__dirname, '../../commands');
            const EXCESS_COMMANDS_DIR = path.join(__dirname, '../../excesscommands');

         
            const CATEGORY_ICONS = {
                utility: "🛠️",
                moderation: "🛡️",
                music: "🎵",
                lavalink: "🎶",
                distube: "🎧",
                economy: "💰",
                admin: "⚙️",
                info: "ℹ️",
                games: "🎲",
                settings: "🔧",
                misc: "📦"
                // Add more category-specific icons as needed
            };
        
            const getEnabledCategories = (configSet) =>
                Object.entries(configSet)
                    .filter(([_, enabled]) => enabled)
                    .map(([name]) => name);

        
            const readCommands = (basePath, categories) => {
                const commandData = {};
                for (const [category, enabled] of Object.entries(categories)) {
                    if (!enabled) continue;
                    const categoryPath = path.join(basePath, category);

                    try {
                        if (!fs.existsSync(categoryPath)) {
                            continue;
                        }

                        const commands = fs.readdirSync(categoryPath)
                            .filter(file => file.endsWith('.js'))
                            .map(file => {
                                try {
                                    const cmd = require(path.join(categoryPath, file));
                                  
                                    let subcommands = [];
                                    if (cmd.data?.toJSON) {
                                        const dataJSON = cmd.data.toJSON();
                                        if (dataJSON.options && Array.isArray(dataJSON.options)) {
                                            for (const option of dataJSON.options) {
                                               
                                                if (option.type === 1) {
                                                    subcommands.push(option.name);
                                                } else if (option.type === 2 && option.options) {
                                                    const groupSubs = option.options
                                                        .filter(opt => opt.type === 1)
                                                        .map(opt => opt.name);
                                                    subcommands.push(`${option.name}: ${groupSubs.join(', ')}`);
                                                }
                                            }
                                        }
                                    }
                                    return {
                                        name: cmd.data?.name || cmd.name || 'unnamed-command',
                                        description: cmd.data?.description || cmd.description || 'No description provided',
                                        subcommands: subcommands
                                    };
                                } catch (error) {
                                    console.error(`Error loading command ${file} in ${category}:`, error);
                                    return null;
                                }
                            })
                            .filter(cmd => cmd !== null);

                        if (commands.length > 0) {
                            commandData[category] = commands;
                        }
                    } catch (error) {
                        console.error(`Error loading ${category} commands:`, error);
                    }
                }
                return commandData;
            };

          
            const createPages = (commandSet, type) => {
                const pages = [];
                const prefixCount = (typeof prefixCommands !== 'undefined') ? Object.values(prefixCommands).reduce((acc, cmds) => acc + cmds.length, 0) : 0;
                const totalCommandsLoaded = Object.values(commandSet).reduce((acc, cmds) => acc + cmds.length, 0);
                let masterCount = 0;
                let subCount = 0;
                for (const category in commandSet) {
                    const cmds = commandSet[category];
                    masterCount += cmds.length;
                    for (const cmd of cmds) {
                        subCount += (cmd.subcommands ? cmd.subcommands.length : 0);
                    }
                }
                const totalCount = masterCount + subCount + prefixCount;

                
                pages.push({
                    title: '✨ BOO BOT - Help',
                    description: [
                        '### BOO đa năng đáp ứng mọi nhu cầu của bạn',
                        '',
                        '> Rất vui khi được phục vụ bạn',
                        '',
                        '**THỐNG KÊ BOT**',
                        `\`🧠\` **Phiên Bản:** 1.2.3`,
                        `\`🛠️\` **Tổng Lệnh:** ${totalCount}`,
                        `\`⚙️\` **Lệnh Đã Tải:** ${totalCommandsLoaded}`,
                        `\`📌\` **Lệnh Chính:** ${masterCount}`,
                        `\`📎\` **Lệnh Phụ:** ${subCount}`,
                        `\`💻\` **Lệnh Prefix:** ${Object.values(config.excessCommands).some(v => v) ? '`Đã Bật`' : '`Đã Tắt`'}`,
                        '',
                    ].join('\n'),
                    author: { name: 'FezyBot • Phucx' },
                    icon: '📚'
                });

              
                for (const [category, commands] of Object.entries(commandSet)) {
                    if (commands.length === 0) continue;

                
                    const totalSubcommands = commands.reduce((acc, cmd) => {
                        return acc + (cmd.subcommands ? cmd.subcommands.length : 0);
                    }, 0);
                    const totalNoOfCommands = commands.length + totalSubcommands;
                    
                
                    const categoryIcon = CATEGORY_ICONS[category.toLowerCase()] || "📁";
                    
                    const commandLines = commands.map(cmd => {
                        let line = `\`${cmd.name}\` • ${cmd.description}`;
                        if (cmd.subcommands && cmd.subcommands.length > 0) {
                          
                            line += `\n> **Lệnh Phụ (${cmd.subcommands.length}):**\n`;
                            cmd.subcommands.forEach(subcmd => {
                                line += `> • \`${subcmd}\`\n`;
                            });
                        }
                        return line;
                    });

                    const categoryNameVI = CATEGORY_NAMES_VI[category.toLowerCase()] || category.charAt(0).toUpperCase() + category.slice(1);
                    
                    pages.push({
                        title: `${categoryIcon} ${categoryNameVI}`,
                        description: [
                            `### ${categoryNameVI.toUpperCase()} • MODULE LỆNH`,
                            '',
                            '**THỐNG KÊ MODULE**',
                            `\`📊\` **Tổng Lệnh:** ${totalNoOfCommands}`,
                            `\`🔍\` **Lệnh Chính:** ${commands.length}`,
                            `\`🔗\` **Lệnh Phụ Tích Hợp:** ${totalSubcommands}`,
                            `\`⌨️\` **Loại Sử Dụng:** ${type === 'slash' ? '`Lệnh Slash`' : `\`Tiền Tố: ${config.prefix}\``}`,
                            ''
                        ].join('\n'),
                        commands: commandLines,
                        author: { name: `${categoryNameVI.toUpperCase()} • MODULE LỆNH` },
                        icon: categoryIcon 
                    });
                }

                return pages;
            };

            const slashCommands = readCommands(COMMANDS_DIR, config.categories);
            const prefixCommands = readCommands(EXCESS_COMMANDS_DIR, config.excessCommands);

            const slashPages = createPages(slashCommands, 'slash');
            const prefixPages = createPages(prefixCommands, 'prefix');

          
            let currentPage = 0;
            let currentSet = slashPages;
            let isPrefix = false;

            const createEmbed = () => {
                const page = currentSet[currentPage];
                const embed = new EmbedBuilder()
                    .setColor(EMBED_COLOR)
                    .setTitle(page.title)
                    .setDescription(page.description)
                    .setAuthor({
                        name: page.author.name,
                        iconURL: BOT_ICON,
                        url: "https://discord.gg/cc9U4w6a"
                    })
                    .setImage(helpBanner)
                    .setFooter({ text: `${FOOTER_TEXT} • Trang ${currentPage + 1}/${currentSet.length}` })
                    .setTimestamp();

        
                if (page.commands && page.commands.length > 0) {
                    const joinedCommands = page.commands.join('\n\n');
                    if (joinedCommands.length > 1024) {
                        const fields = [];
                        let fieldValue = '';
                        let fieldCount = 1;

                        for (const line of page.commands) {
                  
                            if (fieldValue.length + line.length + 2 > 1024) {
                            fields.push({ 
                                name: `Danh Sách Lệnh (Phần ${fieldCount})`, 
                                value: fieldValue.trim() 
                            });
                                fieldCount++;
                                fieldValue = line + '\n\n';
                            } else {
                                fieldValue += line + '\n\n';
                            }
                        }
                        if (fieldValue) {
                            fields.push({ 
                                name: `Danh Sách Lệnh ${fieldCount > 1 ? `(Phần ${fieldCount})` : ''}`, 
                                value: fieldValue.trim() 
                            });
                        }
                        embed.setFields(fields);
                    } else {
                        embed.setFields([{ name: '💎 Các Lệnh Khả Dụng', value: joinedCommands }]);
                    }
                }
                return embed;
            };

           
            const createComponents = () => {
              
                const row1 = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('pageSelect')
                        .setPlaceholder('📋 Chọn danh mục...')
                        .addOptions(currentSet.map((page, i) => {
                            return {
                                label: page.title.replace(/^[^\w\s]\s*/, ''), 
                                value: i.toString(),
                                description: `Xem phần ${page.title.replace(/^[^\w\s]\s*/, '')}`,
                                emoji: page.icon 
                            };
                        }))
                );

              
                const row2 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('previous')
                        .setLabel('Trước')
                        .setEmoji('⬅️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(currentPage === 0),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('Tiếp')
                        .setEmoji('➡️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(currentPage === currentSet.length - 1),
                    new ButtonBuilder()
                        .setCustomId('switchMode')
                        .setLabel(isPrefix ? 'Lệnh Slash' : 'Lệnh Prefix')
                        .setEmoji('🔄')
                        .setStyle(ButtonStyle.Primary)
                );

                return [row1, row2];
            };

        
            const reply = await interaction.editReply({
                embeds: [createEmbed()],
                components: createComponents(),
                fetchReply: true
            });

        
            const collector = reply.createMessageComponentCollector({ time: 180000 }); 

            collector.on('collect', async (i) => {
                try {
                    if (i.user.id !== interaction.user.id) {
                        await i.reply({ 
                            content: `⚠️ Only ${interaction.user.tag} can interact with these controls.`, 
                            flags: 64  
                        }); // InteractionResponseFlags.Ephemeral;
                        return;
                    }

                
                    await i.deferUpdate();

                    if (i.isStringSelectMenu()) {
                        currentPage = parseInt(i.values[0]);
                    } else if (i.isButton()) {
                        switch (i.customId) {
                            case 'previous':
                                currentPage = Math.max(0, currentPage - 1);
                                break;
                            case 'next':
                                currentPage = Math.min(currentSet.length - 1, currentPage + 1);
                                break;
                            case 'switchMode':
                                isPrefix = !isPrefix;
                                currentSet = isPrefix ? prefixPages : slashPages;
                                currentPage = 0;
                                break;
                        }
                    }

                    await i.editReply({
                        embeds: [createEmbed()],
                        components: createComponents()
                    });
                } catch (error) {
                    //console.error('Error handling interaction:', error);
                 
                    try {
                        const errorMethod = i.replied || i.deferred ? i.editReply : i.reply;
                        await errorMethod.call(i, {
                            content: '⚠️ An error occurred while processing your interaction. Please try again.',
                            flags: 64 
                        }); // InteractionResponseFlags.Ephemeral;
                    } catch (secondaryError) {
                        //console.error('Failed to send error response:', secondaryError);
                    }
                }
            });

            collector.on('end', () => {
                try {
                
                    const disabledComponents = createComponents().map(row => {
                        const updatedRow = new ActionRowBuilder();
                        row.components.forEach(component => {
                            if (component.data.type === 2) {
                                updatedRow.addComponents(
                                    ButtonBuilder.from(component.data).setDisabled(true)
                                );
                            } else if (component.data.type === 3) {
                                updatedRow.addComponents(
                                    StringSelectMenuBuilder.from(component.data).setDisabled(true)
                                );
                            }
                        });
                        return updatedRow;
                    });
                    
                    interaction.editReply({ 
                        content: "⏱️ Help command session expired. Use `/help` again to restart."
                    }).catch((error) => {
                        //console.error('Failed to update expired components:', error);
                    });
                } catch (error) {
                    //console.error('Error in collector end handler:', error);
                }
            });
        } else {
            const embed = new EmbedBuilder()
                .setColor('#ff3860')
                .setAuthor({
                    name: "Command Error",
                    iconURL: cmdIcons.dotIcon,
                    url: "https://discord.gg/xQF9f9yUEM"
                })
                .setDescription('> ⚠️ This command can only be used as a slash command!\n> Please use `/help` instead.')
                .setFooter({ text: 'All In One Bot • Error' })
                .setTimestamp();

          
            await interaction.editReply({ 
                embeds: [embed], 
                flags: 64 
            }); // InteractionResponseFlags.Ephemeral
        }
    }
};
