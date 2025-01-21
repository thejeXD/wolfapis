const { SlashCommandBuilder, EmbedBuilder, userMention } = require('discord.js');
const Economy = require('../../models/economy'); // Path to your economy schema
const LicenseKey = require('../../models/licensekey'); // Path to your license key schema
const crypto = require('crypto'); // For generating unique license keys
const emoji = require('../../models/emoji');
const color = require('../../models/colors');

const cooldowns = new Map();

const shopItems = [
    { name: 'Vehicle Spawner X', price: 1000 }, // Requires 2-3 validations
    { name: 'Moderator Call', price: 750 }, // 1-2 validations
    { name: 'Lock System V2', price: 1300 }, // 2 validations
    { name: 'Support Service', price: 900 }, // 2 validations
    { name: 'Duty Log', price: 800 }, // 2 validations
    { name: 'Death GUI', price: 350 }, // Requires 2 high-tier validations
    { name: 'Advanced Team Changer', price: 600 }, // 1-2 validations
    { name: 'Training Chat Panel', price: 500 }, // 1-2 validations
    { name: 'Loading Screen', price: 350 }, // 1 validation
    { name: 'ZMenu', price: 2000 }, // 4-5 validations
    { name: 'Notification System', price: 600 }, // 1-2 validations
    { name: 'Shop GUI BF: Theme', price: 250 }, // 1 validation
    { name: 'Zone GUI', price: 300 }, // 1 validation
    { name: 'Military GUI', price: 1800 }, // 3-4 validations
    { name: 'Announcement GUI', price: 1400 }, // 2-3 validations
    { name: 'Level System', price: 800 }, // 2 validations
    { name: 'Kick System', price: 400 } // 1 validation
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('View the shop and purchase items using store credits.')
        .addStringOption(option =>
            option.setName('item')
                .setDescription('The item to purchase')
                .setRequired(true)
                .addChoices(
                    ...shopItems.map(item => ({
                        name: `${item.name} : ${item.price}`,
                        value: item.name
                    }))
                )
        ),
    async execute(interaction) {
        const user = interaction.user;
        const itemName = interaction.options.getString('item');
        const item = shopItems.find(i => i.name === itemName);

        // Check if the user is on cooldown
        const cooldownAmount = 60 * 1000; // 60 seconds cooldown
        const now = Date.now();

        // If the user is on cooldown, send a message and return early
        if (cooldowns.has(user.id)) {
            const expirationTime = cooldowns.get(user.id) + cooldownAmount;
            if (now < expirationTime) {
                const timeLeft = Math.round((expirationTime - now) / 1000); // time left in seconds
                return interaction.reply({
                    content: `❌ You need to wait **${timeLeft} seconds** before using this command again.`,
                    ephemeral: true
                });
            }
        }

        // Set the cooldown for the user
        cooldowns.set(user.id, now);
        setTimeout(() => cooldowns.delete(user.id), cooldownAmount); // Delete the cooldown after it expires

        // Get the player's economy profile
        const playerProfile = await Economy.findOne({ userId: user.id });
        if (!playerProfile) {
            return interaction.reply({ content: '❌ Your profile is not set up. Please run the command /profile to create a profie and try again!', ephemeral: true });
        }

        // Check if the player has enough store credits
        if (playerProfile.storeCredits < item.price) {
            return interaction.reply({ content: `❌ You do not have enough store credits to purchase the **${item.name}**.`, ephemeral: true });
        }

        // Check if the player already has the item in validatedProducts
        if (playerProfile.validatedProducts.includes(itemName)) {
            return interaction.reply({ content: `❌ You have already purchased the **${itemName}**.`, ephemeral: true });
        }

        // Check if the player has their DMs open
        try {
            await user.send(`${emoji.like} Thank you for your purchase!`); // Send a test message
        } catch (error) {
            // If the DM fails, return and void the purchase
            return interaction.reply({
                content: '❌ Your DMs are off. Please enable DMs to receive your license key.',
                ephemeral: true
            });
        }

        // Proceed with the purchase if DMs are open

        // Deduct the store credits for the purchase
        playerProfile.storeCredits -= item.price;

        // Generate a unique license key for the item
        const licenseKey = crypto.randomBytes(16).toString('hex'); // Create a unique 32-character hex license key

        // Add the item to the player's validatedProducts
        if (!playerProfile.validatedProducts.includes(item.name)) {
            playerProfile.validatedProducts.push(item.name);
        }

        // Save the updated player profile
        await playerProfile.save();

        // Create and save the license key in the LicenseKey schema
        const newLicenseKey = new LicenseKey({
            key: licenseKey,
            product: item.name,
            userId: user.id,
            valid: true
        });

        await newLicenseKey.save();

        // Send the license key to the player's DM
        const dmEmbed = new EmbedBuilder()
            .setColor(color.green)
            .setTitle(`${emoji.like} Purchase Successful!`)
            .setDescription(`You have successfully purchased the **${item.name}** for **${item.price} Store Credits**.`)
            .addFields(
                { name: `${emoji.key} License Key`, value: `\`${licenseKey}\``, inline: false }
            )
            .setFooter({ text: 'Please screenshot this and open a ticket to get your product' });

        await user.send({ embeds: [dmEmbed] });

        // Respond with a confirmation message
        const embed = new EmbedBuilder()
            .setColor(color.green)
            .setTitle(`${emoji.like} Thank you ${userMention} for your purchase!`)
            .setDescription(`You have successfully purchased the **${item.name}** for **${item.price} Store Credits**.`)
            .addFields(
                { name: 'Remaining Credits', value: `${playerProfile.storeCredits} Store Credits`, inline: true },
                { name: 'Purchased Item', value: item.name, inline: true },
                { name: 'License Key', value: `||Check my direct message!||`, inline: false }
            )
            .setFooter({ text: 'Enjoy your new item!' });

        // Send a success message with item details
        await interaction.reply({ embeds: [embed] });

        // Optionally, log the transaction to a channel
        const logChannel = interaction.guild.channels.cache.get('1331263718633377842'); // Replace with your log channel ID
        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setColor(color.blue)
                .setTitle(`${emoji.management} New Purchase`)
                .setDescription(`${user.tag} purchased **${item.name}** for **${item.price} Store Credits**`)
                .addFields(
                    { name: 'Player', value: `<@${user.id}> | ${user.id}`, inline: true },
                    { name: 'Item', value: item.name, inline: true },
                    { name: 'Remaining Credits', value: `${playerProfile.storeCredits}`, inline: true },
                    { name: 'License Key', value: licenseKey, inline: true }
                )
                .setTimestamp();
            logChannel.send({ embeds: [logEmbed] });
        }
    },
};
