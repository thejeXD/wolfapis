const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('robux-calculator')
        .setDescription('Calculate Robux after tax and how much to cover the tax.')
        .addNumberOption(option => 
            option.setName('amount')
                .setDescription('The amount of Robux you want to calculate.')
                .setRequired(true)
        ),
    async execute(interaction) {
        console.log(`Executing robux command for ${interaction.user.tag}`);

        const amount = interaction.options.getNumber('amount');
        
        // Calculate Robux after tax and required amount to cover tax
        const afterTax = amount * 0.7; // Robux you get after the tax
        const coverTax = amount / 0.7 + 1; // Amount needed to cover the tax

        // Get the user who requested the command and other values
        const requestedBy = interaction.user.tag;
        const requestedByAvatar = interaction.user.displayAvatarURL();
        const currentTime = new Date().toLocaleString();

        // Create an embed for the response
        const embed = new EmbedBuilder()
            .setColor(16752790)
            .setTitle('Robux Tax Calculator')
            .setDescription('Tax calculated at 30% deduction.')
            .addFields(
                { name: 'Original Amount', value: `${amount} Robux`, inline: true },
                { name: 'After Tax (30% deducted)', value: `${afterTax.toFixed(2)} Robux`, inline: true },
                { name: 'To Cover Tax (Before Tax)', value: `${coverTax.toFixed(2)} Robux`, inline: true }
            )
            .setFooter({
                text: `Requested by ${requestedBy} | Time: ${currentTime}`,
                iconURL: requestedByAvatar // User's avatar in the footer
            });

        // Reply directly to the interaction
        await interaction.reply({ embeds: [embed] });
    },
};
