const { SlashCommandBuilder, EmbedBuilder, userMention } = require('discord.js');
const Economy = require('../../models/economy'); // Path to your economy schema
const LicenseKey = require('../../models/licensekey'); // Path to your license key schema
const crypto = require('crypto'); // For generating unique license keys
const emoji = require('../../models/emoji');
const color = require('../../models/colors');

const cooldowns = new Map();
const products = require('../../models/products'); // Use updated products model

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('View the shop and purchase items using store credits.')
        .addStringOption(option =>
            option.setName('item')
                .setDescription('The item to purchase')
                .setRequired(true)
                .addChoices(
                    ...products.map(item => ({
                        name: `${item.name} : ${item.shopPrice} Credits`,
                        value: item.name
                    }))
                )
        ),
    async execute(interaction) {
        const user = interaction.user;
        const itemName = interaction.options.getString('item');
        const item = products.find(i => i.name === itemName);

        if (!item) {
            return interaction.reply({ content: '❌ Item not found!', ephemeral: true });
        }

        const cooldownAmount = 60 * 1000; // 60 seconds cooldown
        const now = Date.now();

        if (cooldowns.has(user.id)) {
            const expirationTime = cooldowns.get(user.id) + cooldownAmount;
            if (now < expirationTime) {
                const timeLeft = Math.round((expirationTime - now) / 1000);
                return interaction.reply({
                    content: `❌ Please wait **${timeLeft} seconds** before using this command again.`,
                    ephemeral: true
                });
            }
        }

        cooldowns.set(user.id, now);
        setTimeout(() => cooldowns.delete(user.id), cooldownAmount);

        const playerProfile = await Economy.findOne({ userId: user.id });
        if (!playerProfile) {
            return interaction.reply({ content: '❌ Please set up your profile first.', ephemeral: true });
        }

        if (playerProfile.storeCredits < item.shopPrice) {
            return interaction.reply({
                content: `❌ You do not have enough credits to purchase **${item.name}**.`,
                ephemeral: true
            });
        }

        if (playerProfile.validatedProducts.includes(item.name)) {
            return interaction.reply({
                content: `❌ You already own **${item.name}**.`,
                ephemeral: true
            });
        }

        try {
            await user.send('Thank you for your purchase!');
        } catch {
            return interaction.reply({
                content: '❌ Enable DMs to receive your license key.',
                ephemeral: true
            });
        }

        playerProfile.storeCredits -= item.shopPrice;
        const licenseKey = crypto.randomBytes(16).toString('hex');

        playerProfile.validatedProducts.push(item.name);
        await playerProfile.save();

        const newLicenseKey = new LicenseKey({
            key: licenseKey,
            product: item.name,
            userId: user.id,
            valid: true
        });

        await newLicenseKey.save();

        const dmEmbed = new EmbedBuilder()
            .setColor(color.green)
            .setTitle(`${emoji.like} Purchase Successful!`)
            .setDescription(`You purchased **${item.name}** for **${item.shopPrice} credits**.`)
            .addFields({ name: 'License Key', value: `\`${licenseKey}\`` })
            .setFooter({ text: 'Please screenshot this and open a ticket for your product.' });

        await user.send({ embeds: [dmEmbed] });

        const embed = new EmbedBuilder()
            .setColor(color.green)
            .setTitle(`${emoji.like} Purchase Confirmed!`)
            .setDescription(`You purchased **${item.name}** for **${item.shopPrice} credits**.`)
            .addFields(
                { name: 'Remaining Credits', value: `${playerProfile.storeCredits}` },
                { name: 'Purchased Item', value: item.name }
            );

        await interaction.reply({ embeds: [embed] });
    }
};
