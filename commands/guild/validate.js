const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Economy = require('../../models/economy'); // Path to your economy schema
const LicenseKey = require('../../models/licensekey'); // Path to your license key model
const emoji = require('../../models/emoji');
const color = require('../../models/colors');


// List of predefined products
const predefinedProducts = [
    { name: 'Vehicle Spawner X', id: '1', price: 550 }, 
    { name: 'Moderator Call', id: '2', price: 275 }, 
    { name: 'Lock System V2', id: '3', price: 525 }, 
    { name: 'Support Service', id: '4', price: 525 }, 
    { name: 'Duty Log', id: '5', price: 425 }, 
    { name: 'Death GUI', id: '6', price: 120 }, // Requires 2 validation items
    { name: 'Advanced Team Changer', id: '7', price: 255 }, 
    { name: 'Training Chat Panel', id: '8', price: 225 }, 
    { name: 'Loading Screen', id: '9', price: 50 }, // Validation item
    { name: 'ZMenu', id: '10', price: 1400 }, 
    { name: 'Notification System', id: '11', price: 255 }, 
    { name: 'Shop GUI BF: Theme', id: '12', price: 50 }, // Validation item
    { name: 'Zone GUI', id: '13', price: 70 }, // Validation item
    { name: 'Military GUI', id: '14', price: 900 }, 
    { name: 'Announcement GUI', id: '15', price: 650 }, 
    { name: 'Level System', id: '16', price: 325 }, 
    { name: 'Kick System', id: '17', price: 70 } // Validation item
];



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
                    predefinedProducts.map(product => ({
                        name: product.name,
                        value: product.name // Set the product name as the value
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

        // Check if the product is valid
        const product = predefinedProducts.find(p => p.name === productName);
        if (!product) {
            return interaction.reply({ content: `${emoji.warns} Invalid product name. Please choose a valid product.`, ephemeral: true });
        }

        // Check if the license key for this product is already validated
        const existingLicenseKey = await LicenseKey.findOne({ key: licenseKey });
        if (existingLicenseKey) {
            return interaction.reply({ content: `${emoji.warns} This license key is already in use.`, ephemeral: true });
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
        playerProfile.storeCredits += product.price; // Add credits
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
                { name: `${emoji.cart} Store Credits Awarded`, value: `${product.price} credits` }
            )
            .setFooter({ text: `Validated by ${user.username}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
