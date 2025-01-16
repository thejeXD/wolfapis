const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

// Map to track the last time each user used the command
const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Get information about a Roblox user.')
        .addStringOption(option =>
            option.setName('userid')
                .setDescription('The Roblox user ID.')
                .setRequired(true)
        ),
    async execute(interaction) {
        console.log(`Executing userinfo command for ${interaction.user.tag}`);

        const userId = interaction.options.getString('userid');

        // Check if the user is on cooldown
        const now = Date.now();
        const cooldownAmount = 30000; // 5 seconds in milliseconds

        if (cooldowns.has(userId)) {
            const expirationTime = cooldowns.get(userId) + cooldownAmount;

            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000; // Calculate time left in seconds
                return interaction.reply({
                    content: `Please wait ${timeLeft.toFixed(1)} seconds before using this command again.`,
                    ephemeral: true
                });
            }
        }

        try {
            // Fetch user information
            const userInfoResponse = await axios.get(`https://users.roblox.com/v1/users/${userId}`);
            const userInfo = userInfoResponse.data;
        
            // Fetch the user's avatar image
            const avatarResponse = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=720x720&format=Png&isCircular=false`);
            const avatarData = avatarResponse.data.data[0];
        
            const avatarUrl = avatarData ? avatarData.imageUrl : 'https://www.roblox.com/favicon.ico'; // Fallback if no avatar found
            const followerCount = await axios.get(`https://friends.roblox.com/v1/users/${userId}/followers/count`);
        
            // Corrected line to access follower count
            const isEligibleVerifiedBadge = followerCount.data.count >= 10000;

            const accountCreatedDate = new Date(userInfo.created);
            const currentDate = new Date();
            const accountAgeInMilliseconds = currentDate - accountCreatedDate;
            const accountAgeInDays = Math.floor(accountAgeInMilliseconds / (1000 * 60 * 60 * 24)); // Calculate days
            const accountAgeInYears = Math.floor(accountAgeInDays / 365); // Calculate years
        
            // Get the user who requested the command and other values
            const requestedBy = interaction.user.tag;
            const requestedByAvatar = interaction.user.displayAvatarURL();
            const currentTime = new Date().toLocaleString();

            // Create an embed for the response
            const embed = new EmbedBuilder()
                .setColor(16752790)
                .setTitle(`${userInfo.displayName}'s Profile`)
                .setDescription(userInfo.description || 'No description provided.')
                .addFields(
                    { name: 'Username', value: userInfo.name, inline: true },
                    { name: 'User ID', value: userInfo.id.toString(), inline: true },
                    { name: 'Account Created', value: new Date(userInfo.created).toLocaleDateString(), inline: true },
                    { name: 'Account Age', value: `${accountAgeInYears} years (${accountAgeInDays} days)`, inline: true },
                    { name: 'Follower Count', value: followerCount.data.count.toString(), inline: true },
                    { name: 'Banned', value: userInfo.isBanned ? 'Yes' : 'No', inline: true },
                    { name: 'Verified Badge', value: userInfo.hasVerifiedBadge ? 'Yes' : 'No', inline: true },
                    { name: 'Eligible for Verified Badge', value: isEligibleVerifiedBadge ? 'Yes' : 'No', inline: true }
                )
                .setThumbnail(avatarUrl) // Set the avatar as the thumbnail
                .setFooter({
                    text: `Requested by ${requestedBy} | Time: ${currentTime}`,
                    iconURL: requestedByAvatar // User's avatar in the footer
                });
        
            // Reply directly to the interaction
            await interaction.reply({ embeds: [embed] });

            // Set the user's cooldown timestamp
            cooldowns.set(userId, now);
            setTimeout(() => cooldowns.delete(userId), cooldownAmount); // Remove the cooldown after 5 seconds
        } catch (error) {
            console.error('Error fetching user information:', error);

            if (error.response && error.response.status === 429) {
                // Rate limited error
                const retryAfter = error.response.headers['retry-after'] || 30; // Retry after time in seconds
                return interaction.reply({
                    content: `You are being rate-limited. Please wait ${retryAfter} seconds before trying again.`,
                    ephemeral: true
                });
            }

            await interaction.reply('Could not retrieve user information. Please try again later.');
        }
    },
};
