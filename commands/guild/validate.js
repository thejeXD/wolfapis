const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Economy = require('../../models/economy'); // Path to your economy schema
const LicenseKey = require('../../models/licensekey'); // Path to your license key model
const emoji = require('../../models/emoji');
const color = require('../../models/colors');
const Product = require('../../models/products'); // Path to your product model


module.exports = {
    data: new SlashCommandBuilder()
        .setName('validate_license')
        .setDescription('Validate a product license key and grant store credits to the player.')
        .addUserOption(option => option.setName('player').setDescription('The player to validate the license for').setRequired(true))
        .addStringOption(option => 
            option.setName('product')
                .setDescription('The product for which the license is being validated')
                .setRequired(true)
                .addChoices(
                    ...Product.map(item => ({
                        name: item.name,
                        value: item.name
                    }))
                )
        )
        .addStringOption(option => option.setName('key').setDescription('The license key to validate').setRequired(true)),

    async execute(interaction) {
        const user = interaction.user;
        const player = interaction.options.getUser('player');
        const productName = interaction.options.getString('product');
        const licenseKey = interaction.options.getString('key');

        // Check if the user has the required role
        const requiredRole = '859637986235514880'; // Replace with the actual role ID
        if (!interaction.member.roles.cache.has(requiredRole)) {
            return interaction.reply({ content: `${emoji.warns} You do not have the required role to use this command.`, ephemeral: true });
        }

        // Fetch product from the product module
        const product = Product.find(item => item.name === productName);
        if (!product) {
            return interaction.reply({ content: `${emoji.warns} Invalid product name. Please choose a valid product.`, ephemeral: true });
        }

        // Check if the license key for this product is already validated
        const existingLicenseKey = await LicenseKey.findOne({ key: licenseKey });
        if (existingLicenseKey) {
            return interaction.reply({ content: `${emoji.warns} This license key is already in use.`, ephemeral: true });
        }

        const verifyKey = licenseKey.length;
        if (verifyKey < 10) {
            return interaction.reply({ content: `${emoji.warns} License Key invalid! Too short to validate`, ephemeral: true });
        }
 
        // Check if the player has already validated this product with the given license key
        const existingProduct = await LicenseKey.findOne({ userId: player.id, product: product.name });
        if (existingProduct) {
            return interaction.reply({ content: `${emoji.warns} This product has already been validated.`, ephemeral: true });
        }

        // Check if the player has already validated this product before (to avoid duplicates)
        let playerProfile = await Economy.findOne({ userId: player.id });
        if (!playerProfile) {
            playerProfile = await Economy.create({ userId: player.id }); // Create a new profile if not found
        }

        // Ensure validatedProducts array exists
        if (!playerProfile.validatedProducts) {
            playerProfile.validatedProducts = [];
        }

        // Check if the product is already in the validated products list (fix to avoid duplicates)
        if (playerProfile.validatedProducts.includes(product.name)) {
            return interaction.reply({ content: `${emoji.warns} This product has already been validated for this player.`, ephemeral: true });
        }

        // Validate and store the license key
        const creditBack = product.price * 0.3;
        playerProfile.storeCredits += creditBack; // Add credits
        playerProfile.validatedProducts.push(product.name); // Add product to validatedProducts (no duplicates)

        // Create a new license key record
        const newLicense = new LicenseKey({
            key: licenseKey,
            userId: player.id, // Store userId instead of playerId
            product: product.name, // Store product name
            valid: true
        });

        // Save the new license and player profile
        await newLicense.save();
        await playerProfile.save();

        // Log the validation to a specific channel
        const logChannel = interaction.guild.channels.cache.get('1331305976762208307'); // Replace with your log channel ID
        if (logChannel) {
            const embed = new EmbedBuilder()
                .setColor(6732650) // Set color for the embed
                .setTitle(`${emoji.logs} ${emoji.key} License Key Validated!`)
                .setThumbnail(user.avatarURL()) // User's avatar
                .addFields(
                    { name: 'Player', value: `<@${player.id}> | ${player.id}`, inline: true },
                    { name: 'Product', value: product.name, inline: true },
                    { name: 'License Key', value: `${emoji.warns} ${licenseKey}`, inline: false },
                    { name: 'Validated by', value: `<@${user.id}> | ${user.id}`, inline: true }
                )
                .setTimestamp(); // Adds a timestamp to the embed
            logChannel.send({ embeds: [embed] });
        }

        // Create the response embed
        const embed = new EmbedBuilder()
            .setColor(6732650)
            .setTitle(`${emoji.like} Success!`)
            .setDescription(`License Key Validated!`)
            .addFields(
                { name: `${emoji.member3} Player`, value: `<@${player.id}> | ${player.id}` },
                { name: `${emoji.key} Product`, value: product.name },
                { name: `${emoji.cart} Store Credits Awarded`, value: `${creditBack} credits` }
            )
            .setFooter({ text: `Validated by ${user.username}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
