const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('robux')
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

        // Create an embed for the response
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Robux Tax Calculator')
            .setDescription('Here is the breakdown of your Robux calculation:')
            .addFields(
                { name: 'Original Amount', value: `${amount} Robux`, inline: true },
                { name: 'After Tax (30% deducted)', value: `${afterTax.toFixed(2)} Robux`, inline: true },
                { name: 'To Cover Tax (Before Tax)', value: `${coverTax.toFixed(2)} Robux`, inline: true }
            )
            .setFooter({ text: 'Tax calculated at 30% deduction.' });

        // Reply directly to the interaction
        await interaction.reply({ embeds: [embed] });
    },
};
