const { SlashCommandBuilder } = require('discord.js');
const Economy = require('../../models/economy');

// Cooldown map to track user cooldowns for each subcommand
const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('economy')
        .setDescription('Manage your in-game economy: work, collect bonuses, withdraw and deposit cash.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('work')
                .setDescription('Earn some cash through work (which will be converted to store credits).')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('collect')
                .setDescription('Collect your role-based bonus (weekly).')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('withdraw')
                .setDescription('Withdraw cash from your bank.')
                .addIntegerOption(option =>
                    option.setName('amount')
                        .setDescription('Amount to withdraw')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('deposit')
                .setDescription('Deposit cash into your bank.')
                .addIntegerOption(option =>
                    option.setName('amount')
                        .setDescription('Amount to deposit')
                        .setRequired(true)
                )
        ),
    async execute(interaction) {
        const user = interaction.user;
        const subcommand = interaction.options.getSubcommand();

        // Get the current timestamp
        const now = Date.now();

        // Cooldown duration for each subcommand
        let cooldownDuration;
        if (subcommand === 'work') {
            cooldownDuration = 86400 * 1000; // 1 day = 86400 seconds
        } else if (subcommand === 'collect') {
            cooldownDuration = 604800 * 1000; // 7 days = 604800 seconds
        }

        // Check cooldown based on subcommand
        const cooldownKey = `${user.id}-${subcommand}`; // Use both user.id and subcommand for unique key
        if (cooldowns.has(cooldownKey)) {
            const userCooldown = cooldowns.get(cooldownKey);
            const timeLeft = (now - userCooldown.timestamp);

            if (timeLeft < cooldownDuration) {
                const timeRemaining = (cooldownDuration - timeLeft) / 60000; // Convert to minutes
                return interaction.reply({
                    content: `❌ You need to wait **${timeRemaining.toFixed(1)} minutes** before using the **${subcommand}** command again.`,
                    ephemeral: true
                });
            }
        }

        // Fetch the player's economy data
        let playerProfile = await Economy.findOne({ userId: user.id });
        if (!playerProfile) {
            playerProfile = new Economy({ userId: user.id });
            await playerProfile.save();
        }

        // Handle the 'work' subcommand
        if (subcommand === 'work') {
            const earnedCash = Math.floor(Math.random() * (500 - 50 + 1)) + 50;
            playerProfile.cash += earnedCash;

            await playerProfile.save();

            // Set cooldown for the work subcommand
            cooldowns.set(cooldownKey, { timestamp: now });

            return interaction.reply({
                content: `💼 You worked hard and earned **${earnedCash} cash**.`,
                ephemeral: true
            });
        }

        // Handle the 'collect' subcommand
        if (subcommand === 'collect') {
            const boosterRoleId = '865774525249880096';  // Replace with the actual role ID
            const role = interaction.member.roles.cache.has(boosterRoleId) ? 'booster' : 'normal';
            let bonus = role === 'booster' ? 500 : 250;

            playerProfile.cash += bonus;
            await playerProfile.save();

            // Set cooldown for the collect subcommand
            cooldowns.set(cooldownKey, { timestamp: now });

            return interaction.reply({
                content: `🎉 You collected your weekly bonus of **${bonus} cash** as a **${role === 'booster' ? 'Booster' : 'Normal'}** member.`,
                ephemeral: true
            });
        }

        // Handle the 'withdraw' subcommand
        if (subcommand === 'withdraw') {
            const amount = interaction.options.getInteger('amount');
            if (amount > playerProfile.bank || amount <= 0) {
                return interaction.reply({
                    content: `❌ You do not have enough funds in your bank to withdraw **${amount}** cash.`,
                    ephemeral: true
                });
            }

            playerProfile.bank -= amount;
            playerProfile.cash += amount;

            await playerProfile.save();

            // Set cooldown for the withdraw subcommand
            cooldowns.set(cooldownKey, { timestamp: now });

            return interaction.reply({
                content: `💵 You withdrew **${amount}** cash from your bank. Your current cash balance is **${playerProfile.cash}**.`,
                ephemeral: true
            });
        }

        // Handle the 'deposit' subcommand
        if (subcommand === 'deposit') {
            const amount = interaction.options.getInteger('amount');
            if (amount > playerProfile.cash || amount <= 0) {
                return interaction.reply({
                    content: `❌ You do not have enough cash to deposit **${amount}**.`,
                    ephemeral: true
                });
            }

            playerProfile.cash -= amount;
            playerProfile.bank += amount;

            await playerProfile.save();

            // Set cooldown for the deposit subcommand
            cooldowns.set(cooldownKey, { timestamp: now });

            return interaction.reply({
                content: `🏦 You deposited **${amount}** cash into your bank. Your current cash balance is **${playerProfile.cash}**.`,
                ephemeral: true
            });
        }
    },
};
