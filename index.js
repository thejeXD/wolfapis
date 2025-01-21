require('dotenv').config();
const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const { Client, GatewayIntentBits, Collection } = require('discord.js'); // Import discord.js for the client and intents
const { REST } = require('@discordjs/rest'); // Import REST from @discordjs/rest for API interactions
const { Routes } = require('discord-api-types/v10'); // Import Routes for command registration
const numeral = require('numeral')


const fs = require('fs');
const path = require('path');
const { buffer } = require('stream/consumers');

const app = express();
app.use(express.json()); // For parsing incoming JSON requests

// Initialize discord.js client (Will now rely on the bot being initialized here)
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

async function connectToDatabase() {
    try {
        const mongoURI = process.env.MONGO_URI;
        await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('✅ MongoDB connection established');
    } catch (error) {
        console.error(`❌ MongoDB connection failed: ${error.message}`);
        throw error;
    }
}


const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
const globalCommands = [];
const guildCommands = [];
client.commands = new Collection();

async function loadCommands() {
    const commandFolders = fs.readdirSync(path.join(__dirname, 'commands'));

    for (const folder of commandFolders) {
        const folderPath = path.join(__dirname, 'commands', folder);

        if (fs.statSync(folderPath).isDirectory()) {
            const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
                const filePath = path.join(folderPath, file);
                const command = require(filePath);

                if ('data' in command && 'execute' in command) {
                    client.commands.set(command.data.name, command);

                    const commandData = command.data.toJSON();
                    //console.log(commandData); // Log to verify it's a valid object

                    if (folder === 'global') {
                        globalCommands.push(commandData); // Ensure it's just an object
                    } else if (folder === 'guild') {
                        guildCommands.push(commandData); // Ensure it's just an object
                    }

                    console.log(`✅Loaded command: ${command.data.name}`);
                } else {
                    console.warn(`Command at ${filePath} is missing "data" or "execute" property`);
                }
            }
        }
    }
}



async function refreshCommands() {
    const clientId = process.env.CLIENT_ID;
    const guildId = process.env.GUILD_ID;

    if (!clientId || !process.env.DISCORD_BOT_TOKEN) {
        console.error('❗Missing CLIENT_ID or DISCORD_BOT_TOKEN in environment variables.');
        return;
    }

    try {
        // Flatten and send as array of objects
        const flatGlobalCommands = globalCommands.flat();
        const flatGuildCommands = guildCommands.flat();

        //GLOBAL REGISTRATION
        if (flatGlobalCommands.length > 0) {
            console.log(`Refreshing ${flatGlobalCommands.length} global commands...`);
            const globalData = await rest.put(
                Routes.applicationCommands(clientId),
                { body: flatGlobalCommands }
            );
            console.log(`✅Successfully refreshed ${globalData.length} global commands.`);
        }

        // GUILD REGISTRATION
        if (flatGuildCommands.length > 0) {
            if (!guildId) {
                console.error('Missing GUILD_ID for guild-specific commands.');
                return;
            }
            console.log(`❗Refreshing ${flatGuildCommands.length} guild commands for guild ${guildId}...`);
            const guildData = await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: flatGuildCommands }
            );
            console.log(`✅Successfully refreshed ${guildData.length} guild commands for guild ${guildId}.`);
        }
    } catch (error) {
        console.error(`❗Failed to refresh commands:`, error);
    }
}



// Interaction handler for slash commands
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error('Command execution error:', error.stack);
        await interaction.reply({
            content: `An error occurred while executing the command: ${error.message}`,
            ephemeral: true,
        });
    }
});

// Discord Bot Ready event handler
client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    await loadCommands();
    await refreshCommands();
    await connectToDatabase();
});

// Log in the bot
client.login(process.env.DISCORD_BOT_TOKEN);

// app.get('/alive', (req, res) => {
//     res.status(200).send('Bot is alive!');
// });

// // Start the Express server to handle webhooks
// app.listen(3000, () => {
//     console.log("Webhook server is running on 3000");
// });
