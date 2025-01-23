const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Economy = require('../../models/economy');
const RedeemCode = require('../../models/redeemSchema');
const emoji = require('../../models/emoji');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('economy_modify')
        .setDescription('Manage credits for yourself or others!')
        .addSubcommand(subcommand => 
            subcommand
                .setName('modify')
                .setDescription('Modify credits for a user')
                .addStringOption(option => 
                    option.setName('action')
                        .setDescription('Action to perform')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Add Credits', value: 'add' },
                            { name: 'Remove Credits', value: 'remove' }
                        )
                )
                .addUserOption(option => 
                    option.setName('user')
                        .setDescription('The user to modify credits for')
                        .setRequired(true)
                )
                .addIntegerOption(option => 
                    option.setName('amount')
                        .setDescription('The amount of credits to add or remove')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand => 
            subcommand
                .setName('create_code')
                .setDescription('Generate a new promo code')
                .addIntegerOption(option => 
                    option.setName('validity')
                        .setDescription('The validity period in days')
                        .setRequired(true)
                )
                .addIntegerOption(option => 
                    option.setName('credits')
                        .setDescription('The number of credits for the promo code')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        const nanoid = (await import('nanoid')).nanoid;  // Dynamically import nanoid
        const subCommand = interaction.options.getSubcommand();
        const action = interaction.options.getString('action');

        const requiredRole = '859637986235514880';
        if (!interaction.member.roles.cache.has(requiredRole)) {
            return interaction.reply({ content: `${emoji.warns} You do not have the required role to use this command.`, ephemeral: true });
        }

        if (subCommand === 'modify') {
            const user = interaction.options.getUser('user');
            const amount = interaction.options.getInteger('amount');

            let playerProfile = await Economy.findOne({ userId: user.id });
            if (!playerProfile) {
                playerProfile = new Economy({ userId: user.id });
            }

            if (action === 'add') {
                playerProfile.storeCredits += amount;
                await playerProfile.save();

                const embed = new EmbedBuilder()
                    .setColor(6732650)
                    .setTitle(`${emoji.like} Credits Added!`)
                    .setDescription(`Successfully added **${amount}** credits to <@${user.id}>.`)
                    .addFields({ name: 'New Balance', value: `${playerProfile.storeCredits} credits` })
                    .setFooter({ text: `Credits added by ${interaction.user.username}` })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed] });

            } else if (action === 'remove') {
                if (playerProfile.storeCredits < amount) {
                    return interaction.reply({ content: `${emoji.warns} User does not have enough credits.`, ephemeral: true });
                }

                playerProfile.storeCredits -= amount;
                await playerProfile.save();

                const embed = new EmbedBuilder()
                    .setColor(6732650)
                    .setTitle(`${emoji.like} Credits Removed!`)
                    .setDescription(`Successfully removed **${amount}** credits from <@${user.id}>.`)
                    .addFields({ name: 'New Balance', value: `${playerProfile.storeCredits} credits` })
                    .setFooter({ text: `Credits removed by ${interaction.user.username}` })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed] });
            }

        } else if (subCommand === 'create_code') {
            const validityDays = interaction.options.getInteger('validity');
            const credits = interaction.options.getInteger('credits');
            const code = nanoid(10); // Generate a 10-character unique code
            const validityDate = new Date();
            validityDate.setDate(validityDate.getDate() + validityDays); // Set validity period
            
            // Create the promo code
            const promoCode = new RedeemCode({
                code: code,
                valid: validityDate, // Change this from 'date' to 'valid'
                credit: credits
            });

            await promoCode.save();

            const embed = new EmbedBuilder()
                .setColor(6732650)
                .setTitle(`${emoji.key} New Promo Code Created!`)
                .setDescription(`A new promo code has been generated.`)
                .addFields(
                    { name: 'Code', value: code },
                    { name: 'Validity', value: `${validityDate.toDateString()}` },
                    { name: 'Credits', value: `${credits} credits` }
                )
                .setFooter({ text: `Promo code created by ${interaction.user.username}` })
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }
    }
};
