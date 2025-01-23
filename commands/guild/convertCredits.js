const { SlashCommandBuilder } = require('discord.js');
const Economy = require('../../models/economy');
const color = require('../../models/colors');


// Cooldown map to track user cooldowns for each subcommand
const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('convertcredits')
        .setDescription('Convert your cash into store credits.')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The amount of cash to convert into store credits.')
                .setRequired(true)
        ),
    async execute(interaction) {
        const userId = interaction.user.id;
        const amount = interaction.options.getInteger('amount');

        // Get the current timestamp
        const now = Date.now();

        // Check if the user is on cooldown for this command
        if (cooldowns.has(userId)) {
            const userCooldown = cooldowns.get(userId);
            if (now - userCooldown.timestamp < 30000) {  // 30 seconds cooldown
                const timeLeft = (30000 - (now - userCooldown.timestamp)) / 1000;
                return interaction.reply({
                    content: `❌ You need to wait **${timeLeft.toFixed(1)} seconds** before using the **convertcredits** command again.`,
                    ephemeral: true
                });
            }
        }

        // Fetch player profile
        let profile = await Economy.findOne({ userId });
        if (!profile) {
            profile = await Economy.create({ userId });
        }

        // Check if the amount is valid and if it is greater than or equal to 150 cash
        if (amount <= 0 || amount > profile.cash) {
            return interaction.reply({
                content: `❌ You don't have enough cash to convert ${amount} into store credits!`,
                ephemeral: true,
            });
        }

        if (amount < 150) {
            return interaction.reply({
                content: `❌ You must have at least **150 cash** to convert into store credits.`,
                ephemeral: true,
            });
        }

        // Convert cash to store credits
        const convertedCredits = Math.floor(amount * 0.1); // Example conversion rate: 1 cash = 0.1 store credit
        profile.cash -= amount;
        profile.storeCredits += convertedCredits;

        await profile.save();

        // Set cooldown for the convertcredits command
        cooldowns.set(userId, { timestamp: now });

        return interaction.reply({
            content: `✅ Successfully converted **${amount}** cash into **${convertedCredits}** store credits!`,
            ephemeral: true,
        });
    },
};
