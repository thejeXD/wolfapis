const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const RedeemCode = require('../../models/redeemSchema'); // Path to your redeem code model
const Economy = require('../../models/economy'); // Path to your economy schema
const emoji = require('../../models/emoji');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('redeem')
        .setDescription('Redeem a promo code for credits!')
        .addStringOption(option =>
            option.setName('code')
                .setDescription('The promo code to redeem')
                .setRequired(true)
        ),

    async execute(interaction) {
        const user = interaction.user;
        const code = interaction.options.getString('code');

        // Find the redeem code in the database
        const redeemCode = await RedeemCode.findOne({ code: code });

        if (!redeemCode) {
            return interaction.reply({ content: `${emoji.warns} Invalid code!`, ephemeral: true });
        }

        if (!redeemCode.valid) {
            return interaction.reply({ content: `${emoji.warns} This code is expired or invalid!`, ephemeral: true });
        }

        // Fetch the player's economy profile
        let playerProfile = await Economy.findOne({ userId: user.id });
        if (!playerProfile) {
            playerProfile = new Economy({ userId: user.id }); // Create a new profile if not found
        }

        // Check if the code has already been redeemed
        if (playerProfile.redeemedCodes.includes(code)) {
            return interaction.reply({ content: `${emoji.warns} You have already redeemed this code!`, ephemeral: true });
        }

        // Add the redeem code's credits to the player's balance
        playerProfile.storeCredits += redeemCode.credit;
        redeemCode.totalRedeem += 1;

        // Store the redeemed code in the player's profile
        playerProfile.redeemedCodes.push(code);

        // Save the updated profile
        await playerProfile.save();

        // Log the redemption
        const logChannel = interaction.guild.channels.cache.get('1331305976762208307'); // Replace with your log channel ID
        if (logChannel) {
            const embed = new EmbedBuilder()
                .setColor(6732650) // Set color for the embed
                .setTitle(`${emoji.key} Promo Code Redeemed!`)
                .setThumbnail(user.avatarURL()) // User's avatar
                .addFields(
                    { name: 'Player', value: `<@${user.id}> | ${user.id}`, inline: true },
                    { name: 'Code', value: code, inline: true },
                    { name: 'Credits Awarded', value: `${redeemCode.credit} credits`, inline: true }
                )
                .setTimestamp(); // Adds a timestamp to the embed
            logChannel.send({ embeds: [embed] });
        }

        // Send a confirmation message
        const embed = new EmbedBuilder()
            .setColor(6732650)
            .setTitle(`${emoji.like} Success!`)
            .setDescription(`Promo code redeemed successfully!`)
            .addFields(
                { name: `${emoji.cart} Credits Awarded`, value: `${redeemCode.credit} credits` },
                { name: `${emoji.key} Code`, value: code }
            )
            .setFooter({ text: `Redeemed by ${user.username}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
