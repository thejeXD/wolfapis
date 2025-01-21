const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Economy = require('../../models/economy'); // Path to your economy schema
const emoji = require('../../models/emoji');
const color = require('../../models/colors');



const cooldowns = new Map();


module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('View your economy profile or another user\'s.')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user whose profile you want to view')
                .setRequired(false)), // Optional user mention

    async execute(interaction) {
        // Check if a user is mentioned, otherwise use the current user
        const user = interaction.options.getUser('user') || interaction.user;
        const userId = user.id;

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

        // Retrieve the player's economy profile
        let profile = await Economy.findOne({ userId });
        if (!profile) {
            profile = await Economy.create({ userId }); // Create profile if not found
        }

        // Get validated products from the Economy profile
        const validatedProducts = profile.validatedProducts.join('\n') || 'No validated products yet';

        const embed = new EmbedBuilder()
            .setColor(16752790)
            .setTitle(`${emoji.member3} ${user.username}'s Profile`)
            .setThumbnail(user.avatarURL()) // User's avatar
            .addFields(
                { name: `${emoji.money} Cash`, value: `${profile.cash}`, inline: true },
                { name: `${emoji.piggy} Bank`, value: `${profile.bank}`, inline: true },
                { name: `${emoji.cart} Store Credits`, value: `${profile.storeCredits}`, inline: true },
                { name: `${emoji.key} Validated Product Keys`, value: validatedProducts, inline: false }
            )
            .setFooter({ text: `Requested by ${interaction.user.username}` }) // Corrected footer text
            .setTimestamp(); // Add timestamp

        // Send the profile embed
        await interaction.reply({ embeds: [embed] });
    },
};
