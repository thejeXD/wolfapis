const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const LicenseKey = require('../../models/licensekey'); // Path to your license key model
const emoji = require('../../models/emoji');
const color = require('../../models/colors');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('view')
        .setDescription('View license keys of a user or view all active licenses.')
        // User subcommand
        .addSubcommand(subcommand =>
            subcommand
                .setName('user')
                .setDescription('View license keys of a specific user.')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user whose license keys you want to view')
                        .setRequired(false)
                )
        )
        // All subcommand
        .addSubcommand(subcommand =>
            subcommand
                .setName('all')
                .setDescription('View all active license keys.')
        ),
    async execute(interaction) {
        const user = interaction.user;
        const requiredRole = '859637986235514880'; // Replace with the actual role ID

        if (!interaction.member.roles.cache.has(requiredRole)) {
            return interaction.reply({ content: `${emoji.warns} You do not have the required role to use this command.`, ephemeral: true });
        }

        // Handling the 'user' subcommand
        if (interaction.options.getSubcommand() === 'user') {
            const player = interaction.options.getUser('user') || interaction.user;
            const licenseKeys = await LicenseKey.find({ userId: player.id });

            if (licenseKeys.length === 0) {
                return interaction.reply({ content: '❌ No license keys found for this user.', ephemeral: true });
            }

            const fields = licenseKeys.map(key => ({
                name: key.product,
                value: !key.valid ? `${key.key} ${emoji.warns} **Revoked**` : key.key, // Check for revoked status
                inline: true
            }));

            const embed = new EmbedBuilder()
                .setColor(16752790)
                .setTitle(`${emoji.member3} ${player.username}'s Profile`)
                .setThumbnail(player.avatarURL()) // User's avatar
                .setDescription(`${emoji.key} Here are the license keys for the player:`)
                .addFields(fields)
                .setFooter({ text: `Requested by ${user.username}` })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Handling the 'all' subcommand
        if (interaction.options.getSubcommand() === 'all') {
            const activeLicenseKeys = await LicenseKey.find({ valid: true }); // Get only active licenses

            if (activeLicenseKeys.length === 0) {
                return interaction.reply({ content: '❌ No active license keys found.', ephemeral: true });
            }

            const fields = activeLicenseKeys.map(key => ({
                name: key.product,
                value: key.key,
                inline: true
            }));

            const embed = new EmbedBuilder()
                .setColor(16752790)
                .setTitle('🛠 Active License Keys')
                .setDescription('Here are all active license keys:')
                .addFields(fields)
                .setFooter({ text: `Requested by ${user.username}` })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};
