const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check if the bot is alive and respond with its latency!'),
    async execute(interaction) {
        console.log(`Executing ping command for ${interaction.user.tag}`);

        const latency = Date.now() - interaction.createdTimestamp; // Calculate latency
        const apiLatency = Math.round(interaction.client.ws.ping); // API latency

        // Create an embed for the response
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('Pong! 🏓')
            .setDescription('The bot is alive and responsive!')
            .addFields(
                { name: 'Latency', value: `${latency}ms`, inline: true },
                { name: 'API Latency', value: `${apiLatency}ms`, inline: true }
            )
            .setFooter({ text: 'Bot response time.' });

        // Reply directly to the interaction with the embed
        await interaction.reply({ embeds: [embed] });
    },
};
