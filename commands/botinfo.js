const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Get information about the bot.'),
    async execute(interaction) {
        console.log(`Executing info command for ${interaction.user.tag}`);

        const bot = interaction.client;
        const botTag = bot.user.tag;
        const botName = bot.user.username;
        const botID = bot.user.id;

        const requestedBy = interaction.user.username;
        const requestedByAvatar = interaction.user.displayAvatarURL();  // Avatar of the user who requested the command
        const currentTime = new Date().toLocaleString();  // Get the current date and time

        // Measure the time before replying
        const startTime = Date.now();

        // Create an embed for the response
        const embed = new EmbedBuilder()
            .setColor(16752790)
            .setTitle('MNEM - For your ROBLOX needs.')
            .setDescription(`Meet MNEM, your all-in-one Roblox companion! 🚀 Whether you're tracking user stats, exploring new profiles, or interacting with the community, MNEM makes your experience smoother and more fun. Fast, reliable, and packed with useful features, this bot is designed to make your gaming journey easier, one command at a time. Join the fun, and let MNEM level up your server!`)
            .setThumbnail(bot.user.displayAvatarURL())  // Bot's profile as the thumbnail
            .addFields(
                { name: 'Creator', value: "[@greywolfxd](https://discord.gg/ne9ycr8van)" },
                { name: 'Bot Name', value: botName },
                { name: 'Bot ID', value: botID },
                { name: 'Tag', value: botTag },
            )
            .setFooter({
                text: `Requested by ${requestedBy} | Time: ${currentTime}`,
                iconURL: requestedByAvatar // User's avatar in the footer
            });

        // Reply directly to the interaction
        await interaction.reply({ embeds: [embed] });

        // Measure the time after replying
        const endTime = Date.now();

        // Calculate the response time
        const latency = endTime - startTime;

        // Update the embed with response time
        embed.addFields({ name: 'Response Time', value: `${latency}ms` });

        // Edit the reply to include the response time
        await interaction.editReply({ embeds: [embed] });
    },
};
