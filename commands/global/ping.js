const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios'); // Make sure to install axios: npm install axios

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check bot and Roblox API latency!'),
    async execute(interaction) {
        console.log(`Executing ping command for ${interaction.user.tag}`);

        try {
            // Measure Discord bot latency
            const botLatency = Date.now() - interaction.createdTimestamp;
            const apiLatency = Math.round(interaction.client.ws.ping);

            // Measure Roblox API latency
            const robloxStartTime = Date.now();
            await axios.get('https://proxyapi-beta.vercel.app/users/v1/users/1', {
                headers: {
                    'Accept': 'application/json'
                },
                timeout: 5000 // 5 second timeout
            });
            const robloxLatency = Date.now() - robloxStartTime;

            // Create an embed for the response
            const embed = new EmbedBuilder()
                .setColor(16752790)
                .setTitle('Latency Report 📊')
                .setDescription('Current system performance metrics')
                .addFields(
                    { name: 'Discord Bot Latency', value: `${botLatency}ms`, inline: true },
                    { name: 'Discord API Latency', value: `${apiLatency}ms`, inline: true },
                    { name: 'Roblox API Latency', value: `${robloxLatency}ms`, inline: true }
                )
                .setFooter({ text: 'Real-time performance check' });

            // Reply to the interaction
            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Latency check error:', error);
            
            // Error handling embed
            const errorEmbed = new EmbedBuilder()
                .setColor(16752790)
                .setTitle('Latency Check Failed')
                .setDescription('Unable to complete latency measurement')
                .addFields(
                    { name: 'Error', value: error.message || 'Unknown error occurred' }
                );

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};