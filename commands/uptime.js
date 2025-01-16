const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uptime')
        .setDescription('Check how long the bot has been online.'),
    async execute(interaction) {
        console.log(`Executing uptime command for ${interaction.user.tag}`);

        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        // Create an embed for the response
        const embed = new EmbedBuilder()
            .setColor(16752790)
            .setTitle('Bot Uptime')
            .setDescription(`I’ve been running for ${hours} hours, ${minutes} minutes, and ${seconds} seconds.`);

        // Reply directly to the interaction
        await interaction.reply({ embeds: [embed] });
    },
};
