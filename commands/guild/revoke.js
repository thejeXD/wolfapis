const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const LicenseKey = require('../../models/licensekey'); // Path to your license key model
const Economy = require('../../models/economy'); // Path to your economy schema
const emoji = require('../../models/emoji');
const color = require('../../models/colors');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('revoke')
        .setDescription('Revoke a product license key or remove the product from the player\'s profile.')
        .addUserOption(option =>
            option.setName('player')
                .setDescription('The player to revoke license for')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Specify whether to remove product or key')
                .setRequired(true)
                .addChoices(
                    { name: 'Product Only', value: 'product' },
                    { name: 'License Key', value: 'key' }
                )
        )
        .addStringOption(option =>
            option.setName('key')
                .setDescription('The license key to revoke')
                .setRequired(true)
        ),
    
    async execute(interaction) {
        const user = interaction.user;
        const player = interaction.options.getUser('player');
        const revokeType = interaction.options.getString('type');
        const key = interaction.options.getString('key');

        // Check if the user has the required role
        const requiredRole = '859637986235514880'; // Replace with your role ID
        if (!interaction.member.roles.cache.has(requiredRole)) {
            return interaction.reply({ content: `${emoji.warns} You do not have the required role to use this command.`, ephemeral: true });
        }

        // Find the license key in the database
        const license = await LicenseKey.findOne({ key });  
        if (!license) {
            return interaction.reply({ content: '❌ License key not found.', ephemeral: true });
        }

        // Check if the player ID matches the one in the license key
        if (license.userId !== player.id) {
            return interaction.reply({ content: `❌ The specified player doesn't match the license key's owner.`, ephemeral: true });
        }

        // Handle revocation based on the type
        if (revokeType === 'product') {
            // Remove the product from the player's profile, but keep the license key
            const playerProfile = await Economy.findOne({ userId: license.userId });
            license.valid = false;

            if (playerProfile) {
                // Ensure validatedProducts array exists
                if (!playerProfile.validatedProducts) {
                    playerProfile.validatedProducts = [];
                }

                // Check if the product is in the validatedProducts array and remove it
                const productIndex = playerProfile.validatedProducts.indexOf(license.product);
                if (productIndex !== -1) {
                    // Remove the product from the validated products list
                    playerProfile.validatedProducts.splice(productIndex, 1);
                    await playerProfile.save();
                    await license.save();

                    // Logging the revocation
                    const logChannel = interaction.guild.channels.cache.get('1331305976762208307'); // Replace with your log channel ID
                    if (logChannel) {
                        const embed = new EmbedBuilder()
                            .setColor(color.green) // Set color for the embed
                            .setTitle(`${emoji.logs} Product Revoked!`)
                            .setThumbnail(user.avatarURL()) // User's avatar
                            .addFields(
                                { name: 'Player', value: `<@${player.id}> | ${player.id}`, inline: true },
                                { name: 'Product', value: license.product, inline: true },
                                { name: 'Revoked by', value: `<@${user.id}> | ${user.id}`, inline: true }
                            )
                            .setTimestamp(); // Adds a timestamp to the embed
                        logChannel.send({ embeds: [embed] });
                    }

                    // Send confirmation message
                    return interaction.reply({ content: `✅ Product **${license.product}** has been removed from the player's profile. License key remains valid.`, ephemeral: true });
                } else {
                    return interaction.reply({ content: `❌ Product **${license.product}** not found in player's profile.`, ephemeral: true });
                }
            }
        }

        // Handle key revocation
        if (revokeType === 'key') {
            // Remove the license key from the database
            await LicenseKey.deleteOne({ key });

            // Remove the product from the player's profile
            const playerProfile = await Economy.findOne({ userId: license.userId });
            if (playerProfile) {
                if (!playerProfile.validatedProducts) {
                    playerProfile.validatedProducts = [];
                }

                const productIndex = playerProfile.validatedProducts.indexOf(license.product);
                if (productIndex !== -1) {
                    playerProfile.validatedProducts.splice(productIndex, 1);
                    await playerProfile.save();
                }
            }

            // Logging the revocation
            const logChannel = interaction.guild.channels.cache.get('1331305976762208307'); // Replace with your log channel ID
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setColor(color.blue) // Set color for the embed
                    .setTitle(`${emoji.logs} License Key Revoked!`)
                    .setThumbnail(user.avatarURL()) // User's avatar
                    .addFields(
                        { name: 'Player', value: `<@${player.id}> | ${player.id}`},
                        { name: 'Product', value: license.product},
                        { name: 'Product Key', value: license.key},
                        { name: 'Revoked by', value: `<@${user.id}> | ${user.id}`}
                    )
                    .setTimestamp(); // Adds a timestamp to the embed
                logChannel.send({ embeds: [embed] });
            }

            // Send confirmation message
            return interaction.reply({ content: `✅ License key **${key}** and the associated product **${license.product}** have been revoked.`, ephemeral: true });
        }

        return interaction.reply({ content: '❌ Invalid revoke type.', ephemeral: true });
    },
};
