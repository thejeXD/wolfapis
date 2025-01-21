const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Get information about this server.'),
    async execute(interaction) {
        console.log(`Executing serverinfo command for ${interaction.user.tag}`);

        const server = interaction.guild;
        const createdAt = server.createdAt.toLocaleDateString();
        const memberCount = server.memberCount;
        const owner = await server.fetchOwner();

        // Create an embed for the response
        const embed = new EmbedBuilder()
            .setColor(16752790)
            .setTitle('Server Info')
            .addFields(
                { name: 'Server Name', value: server.name, inline: true },
                { name: 'Created On', value: createdAt, inline: true },
                { name: 'Owner', value: owner.user.tag, inline: true },
                { name: 'Member Count', value: `${memberCount} members`, inline: true }
            );

        // Reply directly to the interaction
        await interaction.reply({ embeds: [embed] });
    },
};
