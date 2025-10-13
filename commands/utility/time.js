/*
 * Time Command - Boo Bot
 * Made by Phucx
 */

const { SlashCommandBuilder } = require('@discordjs/builders');
const { setTimeout } = require('timers/promises');
const cmdIcons = require('../../UI/icons/commandicons');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('time')
        .setDescription('Manage timers and reminders.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('timer')
                .setDescription('Set a timer for a specified duration.')
                .addIntegerOption(option =>
                    option.setName('minutes')
                        .setDescription('Duration in minutes')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reminder')
                .setDescription('Set a reminder with a message.')
                .addIntegerOption(option =>
                    option.setName('minutes')
                        .setDescription('Time until reminder (in minutes)')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('Reminder message')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        const { EmbedBuilder } = require('discord.js');

        if (!interaction.isChatInputCommand()) {
            const embed = new EmbedBuilder()
                .setColor('#3498db')
                .setAuthor({ 
                    name: "Alert!", 
                    iconURL: cmdIcons.dotIcon,
                    url: "https://discord.gg/cc9U4w6a"
                })
                .setDescription('- This command can only be used through slash commands!\n- Please use `/time`')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            return;
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'timer') {
            const minutes = interaction.options.getInteger('minutes');

            if (minutes <= 0 || minutes > 1440) { // Max 24 hours
                return interaction.reply({ content: 'Please enter a valid duration between 1 and 1440 minutes (24 hours).', flags: 64 });
            }

            await interaction.reply({ content: `⏰ Timer set for ${minutes} minute(s). I'll notify you when it's done!` });

            // Wait for the specified time
            await setTimeout(minutes * 60 * 1000);

            // Send the notification
            await interaction.followUp({ content: `⏰ ${interaction.user}, your ${minutes}-minute timer is up!` });

        } else if (subcommand === 'reminder') {
            const minutes = interaction.options.getInteger('minutes');
            const message = interaction.options.getString('message');

            if (minutes <= 0 || minutes > 10080) { // Max 1 week
                return interaction.reply({ content: 'Please enter a valid time between 1 and 10080 minutes (1 week).', flags: 64 });
            }

            await interaction.reply({ content: `📝 Reminder set! I'll remind you about "${message}" in ${minutes} minute(s).` });

            // Wait for the specified time
            await setTimeout(minutes * 60 * 1000);

            // Send the reminder
            await interaction.followUp({ content: `📝 ${interaction.user}, this is your reminder: "${message}"` });
        }
    },
};
