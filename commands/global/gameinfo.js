const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

// Map to track the last time each user used the command
const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gameinfo')
        .setDescription('Get information about a Roblox game.')
        .addStringOption(option =>
            option.setName('gameid')
                .setDescription('The Roblox game ID.')
                .setRequired(true)
        ),
    async execute(interaction) {
        console.log(`Executing gameinfo command for ${interaction.user.tag}`);

        const gameId = interaction.options.getString('gameid');

        // Check if the user is on cooldown
        const now = Date.now();
        const cooldownAmount = 5000; // 5 seconds in milliseconds
        const userId = interaction.user.id;

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
            // Fetch Universe ID using the game ID
            const getUniverseId = await axios.get(`https://apis.roblox.com/universes/v1/places/${gameId}/universe`);
            const universeData = getUniverseId.data;

            // Fetch game information using the universe ID
            const response = await axios.get(`https://games.roblox.com/v1/games?universeIds=${universeData.universeId}`);
            const gameData = response.data.data[0]; // The data is inside the "data" array

            // Fetch the game's thumbnail using the multiget API
            const thumbnailResponse = await axios.get(`https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${universeData.universeId}&countPerUniverse=1&defaults=true&size=768x432&format=Png&isCircular=false`);
            const thumbnailData = thumbnailResponse.data.data[0]; // Get the first entry in the data array
            const thumbnailUrl = thumbnailData.thumbnails && thumbnailData.thumbnails.length > 0
                ? thumbnailData.thumbnails[0].imageUrl
                : 'https://www.roblox.com/favicon.ico'; // Fallback if no thumbnail found

            // Create an embed for the response
            const embed = new EmbedBuilder()
                .setColor(16752790)
                .setTitle(gameData.name)
                .setDescription(gameData.description)
                .addFields(
                    { name: 'Creator', value: gameData.creator.name, inline: true },
                    { name: 'Place ID', value: gameData.rootPlaceId.toString(), inline: true },
                    { name: 'Favorites', value: `${gameData.favoritedCount}`, inline: true },
                    { name: 'Players Online', value: `${gameData.playing}`, inline: true },
                    { name: 'Visits', value: `${gameData.visits}`, inline: true },
                    { name: 'Max Players', value: `${gameData.maxPlayers}`, inline: true },
                    { name: 'Created', value: new Date(gameData.created).toLocaleDateString(), inline: true },
                    { name: 'Updated', value: new Date(gameData.updated).toLocaleDateString(), inline: true },
                )
                .setThumbnail(`https://www.roblox.com/bust-thumbnail/image?userId=${gameData.creator.id}&width=420&height=420`)
                .setImage(thumbnailUrl)
                .setFooter({ text: `Requested by ${interaction.user.username}` });

            // Reply directly to the interaction
            await interaction.reply({ embeds: [embed] });

            // Set the user's cooldown timestamp
            cooldowns.set(userId, now);
            setTimeout(() => cooldowns.delete(userId), cooldownAmount); // Remove the cooldown after 5 seconds
        } catch (error) {
            console.error('Error fetching game information:', error);
            await interaction.reply('Could not retrieve game information. Please try again later.');
        }
    },
};
