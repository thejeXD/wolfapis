require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { createCanvas, loadImage, registerFont } = require('canvas'); // For generating the image
const { Client, GatewayIntentBits, Collection } = require('discord.js'); // Import discord.js for the client and intents
const { REST } = require('@discordjs/rest'); // Import REST from @discordjs/rest for API interactions
const { Routes } = require('discord-api-types/v10'); // Import Routes for command registration
const numeral = require('numeral')

const fs = require('fs');
const path = require('path');
const { buffer } = require('stream/consumers');

const app = express();
app.use(express.json()); // For parsing incoming JSON requests

// Register fonts
registerFont('./fonts/Roboto-Black.ttf', { family: 'Roboto' });
registerFont('./fonts/Roboto-Bold.ttf', { family: 'Roboto-Bold' });

// Your Imgur Client-ID (Remove if unnecessary)
const IMGUR_CLIENT_ID = '65cc992e8181731'; // Make sure to replace with your actual client ID if required

// Initialize discord.js client (Will now rely on the bot being initialized here)
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

// Helper function to fetch both Roblox profile image and username
const getRobloxProfileData = async (userId) => {
    try {
        const profileImageResponse = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`);
        const profileImageUrl = profileImageResponse.data.data[0].imageUrl;

        const usernameResponse = await axios.get(`https://users.roblox.com/v1/users/${userId}`);
        const username = usernameResponse.data.name;

        return { username, profileImageUrl };
    } catch (error) {
        console.error(`Error fetching Roblox profile data for user ${userId}:`, error.message);
        throw new Error('Failed to fetch Roblox profile data.');
    }
};

// Donation amount to color mapping
const getDonationColors = (amount) => {
    let circleColor, amountColor;

    if (amount >= 50000) {
        circleColor = '#ff9ff3';
        amountColor = '#ff9ff3';
    } else if (amount >= 10000) {
        circleColor = '#feca57';
        amountColor = '#feca57';
    } else if (amount >= 1000) {
        circleColor = '#5f27cd';
        amountColor = '#5f27cd';
    } else {
        circleColor = '#1dd1a1';
        amountColor = '#1dd1a1';
    }

    return { circleColor, amountColor };
};

const generateImage = async (donorId, recipientId, amount) => {
    try {
        const donorData = await getRobloxProfileData(donorId);
        const recipientData = await getRobloxProfileData(recipientId);

        const canvas = createCanvas(800, 200);
        const ctx = canvas.getContext('2d');
        const formattedAmount = numeral(amount).format('0,0'); 

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const robuxIcon = await loadImage('./images/robuxIcon.png'); // Path to the Robux icon image

        // Get the colors based on the amount
        const { circleColor, amountColor } = getDonationColors(amount);

        // Draw border for donor avatar
        ctx.beginPath();
        ctx.arc(150, 100, 52, 0, Math.PI * 2); // Outer border circle
        ctx.fillStyle = circleColor; // Color based on amount
        ctx.fill();

        ctx.beginPath();
        ctx.arc(150, 100, 48, 0, Math.PI * 2); // Inner transparent circle
        ctx.fillStyle = 'transparent';
        ctx.fill();

        // Draw border for recipient avatar
        ctx.beginPath();
        ctx.arc(650, 100, 52, 0, Math.PI * 2); // Outer border circle
        ctx.fillStyle = circleColor; // Color based on amount
        ctx.fill();

        ctx.beginPath();
        ctx.arc(650, 100, 48, 0, Math.PI * 2); // Inner transparent circle
        ctx.fillStyle = 'transparent';
        ctx.fill();

        // Load and draw donor avatar
        const donorAvatar = await loadImage(donorData.profileImageUrl);
        ctx.save();
        ctx.beginPath();
        ctx.arc(150, 100, 48, 0, Math.PI * 2); // Mask for avatar
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(donorAvatar, 102, 52, 96, 96);
        ctx.restore();

        // Load and draw recipient avatar
        const recipientAvatar = await loadImage(recipientData.profileImageUrl);
        ctx.save();
        ctx.beginPath();
        ctx.arc(650, 100, 48, 0, Math.PI * 2); // Mask for avatar
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(recipientAvatar, 602, 52, 96, 96);
        ctx.restore();

        // Draw Robux icon and donation amount (Left of amount)
        ctx.font = '48px Roboto'; // Use "Roboto" with a fallback
        ctx.textAlign = 'center';
        
        // Draw Robux icon to the left of the amount
        ctx.drawImage(robuxIcon, 250, 65, 54, 54); // Adjust the size and position of the icon
        
        // Add amount text next to the Robux icon
        ctx.fillStyle = amountColor; // Amount color matches the determined color
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 7;
        ctx.strokeText(formattedAmount, 400, 100); // Positioned after Robux icon
        ctx.fillText(formattedAmount, 400, 100); // Positioned after Robux icon

        // Draw "donated to" text with stroke effect
        ctx.font = '28px Roboto-Bold';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 7;
        ctx.strokeText('donated to', 400, 130);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('donated to', 400, 130);
        
        // Watermark
        ctx.font = '14px Roboto-Bold';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 7;
        ctx.strokeText('Made with Luv by @greywolfxd for Boracay', 400, 180);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('Made with Luv by @greywolfxd for Boracay', 400, 180);

        // Draw usernames with stroke effect
        ctx.font = '18px Roboto-Bold';  // Made bold to match image
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 7;
        ctx.strokeText(`@${donorData.username}`, 150, 180);
        ctx.strokeText(`@${recipientData.username}`, 650, 180);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`@${donorData.username}`, 150, 180);
        ctx.fillText(`@${recipientData.username}`, 650, 180);

        // Convert the canvas to a buffer
        const imageBuffer = canvas.toBuffer('image/png');
        //fs.writeFileSync('donation.png', imageBuffer)
        
        return imageBuffer; // Return the image buffer
    } catch (error) {
        console.error('Error generating image:', error);
        throw error;
    }
};

app.post('/webhook/post', async (req, res) => {
    const { webhookUrl, body } = req.body; // Extract webhook URL and data from the request body

    // Log received data for debugging
    console.log(`Webhook URL: ${webhookUrl}`);
    console.log('Data to send:', body);

    if (!webhookUrl || !body) {
        return res.status(400).json({ message: 'Missing webhookUrl or body in the request.' });
    }

    try {
        // Send the data to the provided webhook URL
        const response = await axios.post(webhookUrl, body, {
            headers: { 'Content-Type': 'application/json' },
        });

        // Respond back with success
        res.status(200).json({
            message: 'Webhook fired successfully',
            data: response.data,
            status: response.status,
        });
    } catch (error) {
        console.error('Error firing webhook:', error.message);

        // Respond with error details
        res.status(500).json({
            message: 'Failed to fire webhook',
            error: error.message,
            status: error.response?.status || 500,
            details: error.response?.data || null,
        });
    }
});

// Webhook route for donation and other data
app.get('/webhook/dono/:webhookId/:webhookToken', async (req, res) => {
    try {
        const { webhookId, webhookToken } = req.params; // Extract webhook ID and Token from the URL parameters
        const { donorId, recipientId, amount, sendToChannel, channelId } = req.query; // Get donation details from query parameters

        if (!webhookId || !webhookToken || !donorId || !recipientId || !amount) {
            return res.status(400).send('Missing required parameters.');
        }

        const donorData = await getRobloxProfileData(donorId);
        const recipientData = await getRobloxProfileData(recipientId);

        // Log the received parameters (for debugging)
        console.log(`Webhook ID: ${webhookId}`);
        console.log(`Webhook Token: ${webhookToken}`);
        console.log(`Donor ID: ${donorId}`);
        console.log(`Recipient ID: ${recipientId}`);
        console.log(`Amount: ${amount}`);
        console.log(`Send to Channel: ${sendToChannel}`);
        console.log(`Channel ID: ${channelId}`);

        // Generate the donation image
        const imageBuffer = await generateImage(donorId, recipientId, amount);

        // Get the Discord webhook URL
        const webhookUrl = `https://discord.com/api/webhooks/${webhookId}/${webhookToken}`;
        const formattedAmount = numeral(amount).format('0,0'); 
        const colorEmbed = getDonationColors(amount);

        if (sendToChannel === 'true') {
            // If sendToChannel is true, send the message to the specific channel
            const channel = await client.channels.fetch(channelId); // Fetch the channel by ID
            await channel.send({
                content: `🎉 **Donation Alert!** 🎉 [${donorData.username}](https://www.roblox.com/users/${donorId}/profile) donated ** <:robux:1328313846460583956>${formattedAmount}** to [${recipientData.username}](https://www.roblox.com/users/${recipientId}/profile)!`,
                embeds: [
                    {
                        color: parseInt(colorEmbed.amountColor.slice(1), 16),
                        image: {
                            url: 'attachment://donation_image.png' // Points to the file attached in the 'files' array
                        }
                    }
                ],
                files: [
                    {
                        attachment: imageBuffer,
                        name: 'donation_image.png',
                    }
                ]
            });
        } else {
            // If sendToChannel is false, send the message to the webhook
            const webhook = await client.fetchWebhook(webhookId, webhookToken);
            await webhook.send({
                content: `🎉 **Donation Alert!** 🎉 [${donorData.username}](https://www.roblox.com/users/${donorId}/profile) donated ** <:robux:1328313846460583956>${formattedAmount}** to [${recipientData.username}](https://www.roblox.com/users/${recipientId}/profile)!`,
                embeds: [
                    {
                        color: parseInt(colorEmbed.amountColor.slice(1), 16),
                        image: {
                            url: 'attachment://donation_image.png'
                        }
                    }
                ],
                files: [
                    {
                        attachment: imageBuffer,
                        name: 'donation_image.png',
                    }
                ]
            });
        }

        res.status(200).send('Donation webhook sent successfully!');
    } catch (error) {
        console.error('Error sending webhook:', error.message);
        res.status(500).send('Failed to send donation webhook.');
    }
});


// Discord Client Setup
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
client.commands = new Collection();

// Command registration function
async function loadCommands() {
    const commands = [];
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON());
            console.log(`Loaded command: ${command.data.name}`);
        } else {
            console.warn(`Command at ${path.join(commandsPath, file)} is missing "data" or "execute".`);
        }
    }

    // Register global commands
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);
        //await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });

        const data = await rest.put(
			Routes.applicationCommands(process.env.CLIENT_ID),
			{ body: commands },
		);  


        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error('Error registering global commands:', error);
    }

    // Uncomment below to register guild-specific commands (for reuse later)
    /*
    try {
        console.log(`Registering ${commands.length} guild-specific commands...`);
        await rest.put(Routes.applicationGuildCommands(client.user.id, 'YOUR_GUILD_ID'), { body: commands });
        console.log('Successfully registered guild-specific commands.');
    } catch (error) {
        console.error('Error registering guild-specific commands:', error);
    }
    */
}


// Interaction handler for slash commands
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error executing this command.', ephemeral: true });
    }
});

// Discord Bot Ready event handler
client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    await loadCommands(); // Load and register commands when the bot is ready
});

// Log in the bot
client.login(process.env.DISCORD_BOT_TOKEN);

app.get('/alive', (req, res) => {
    res.status(200).send('Bot is alive!');
});

// Start the Express server to handle webhooks
app.listen(3000, () => {
    console.log("Webhook server is running on 3000");
});
