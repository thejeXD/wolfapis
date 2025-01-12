require('dotenv').config();
const cookie = process.env.ROBLOX_COOKIE;
const adminKey = process.env.ADMIN_KEY;
const express = require("express");
const rbx = require("noblox.js");
const fs = require('fs').promises;
const path = require('path');
const app = express();

// Keep the /alive endpoint
app.get("/alive", (req, res) => {
  res.send("I'm Alive!");
});

// Function to read config
async function readConfig() {
  try {
    const configPath = path.join(__dirname, 'config.json');
    const configData = await fs.readFile(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('Error reading config:', error);
    throw error;
  }
}

// Function to write config
async function writeConfig(config) {
  try {
    const configPath = path.join(__dirname, 'config.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Error writing config:', error);
    throw error;
  }
}

// Start the application and log in
async function startApp() {
  try {
    await rbx.setCookie(cookie);
    const currentUser = await rbx.getAuthenticatedUser();
    console.log(`Logged in as ${currentUser.displayName} [${currentUser.id}]`);
  } catch (error) {
    console.error("Error logging in:", error);
  }
}

startApp();

// View config endpoint
app.get('/config/view/:adminKey', async (req, res) => {
  try {
    const { adminKey: providedAdminKey } = req.params;

    if (providedAdminKey !== adminKey) {
      return res.json({
        success: false,
        error: "Unauthorized",
        message: "Invalid admin key"
      });
    }

    const config = await readConfig();
    
    res.json({
      success: true,
      message: "Current configuration",
      config: config,
      totalEntries: Object.keys(config).length
    });

  } catch (error) {
    console.error("Error fetching configuration:", error);
    res.json({
      success: false,
      error: "Server Error",
      message: "Error fetching configuration"
    });
  }
});

// Whitelist endpoint
app.get('/whitelist/:adminKey/:setKey/:setGroup/:setDiscordOwner/:discordOwnerId/:robloxUsername', async (req, res) => {
  try {
    const {
      adminKey: providedAdminKey,
      setKey,
      setGroup,
      setDiscordOwner,
      discordOwnerId,
      robloxUsername
    } = req.params;

    if (providedAdminKey !== adminKey) {
      return res.json({
        success: false,
        error: "Unauthorized",
        message: "Invalid admin key"
      });
    }

    // Validate group exists
    try {
      await rbx.getGroup(parseInt(setGroup));
    } catch (error) {
      return res.json({
        success: false,
        error: "Invalid Group",
        message: "Group does not exist on Roblox"
      });
    }

    // Validate username exists
    try {
      await rbx.getIdFromUsername(robloxUsername);
    } catch (error) {
      return res.json({
        success: false,
        error: "Invalid Username",
        message: "Roblox username does not exist"
      });
    }

    const config = await readConfig();

    if (config[setKey]) {
      return res.json({
        success: false,
        error: "Duplicate Key",
        message: "This API key already exists"
      });
    }

    config[setKey] = {
      groupId: setGroup,
      discordOwner: setDiscordOwner,
      discordOwnerId: discordOwnerId,
      robloxUsername: robloxUsername
    };

    await writeConfig(config);

    res.json({
      success: true,
      message: "Whitelist added successfully",
      configuration: config[setKey]
    });

  } catch (error) {
    console.error("Error adding whitelist:", error);
    res.json({
      success: false,
      error: "Server Error",
      message: "Error adding whitelist"
    });
  }
});

// Remove whitelist endpoint
app.get('/whitelist/remove/:adminKey/:apiKey', async (req, res) => {
  try {
    const { adminKey: providedAdminKey, apiKey } = req.params;

    if (providedAdminKey !== adminKey) {
      return res.json({
        success: false,
        error: "Unauthorized",
        message: "Invalid admin key"
      });
    }

    const config = await readConfig();

    if (!config[apiKey]) {
      return res.json({
        success: false,
        error: "Not Found",
        message: "API key not found"
      });
    }

    delete config[apiKey];
    await writeConfig(config);

    res.json({
      success: true,
      message: "Whitelist removed successfully"
    });

  } catch (error) {
    console.error("Error removing whitelist:", error);
    res.json({
      success: false,
      error: "Server Error",
      message: "Error removing whitelist"
    });
  }
});

// Simplified rank endpoint
app.get("/rank/:apiKey/:userId/:groupId/:rank", async (req, res) => {
  try {
    const { apiKey, userId, groupId, rank } = req.params;

    const config = await readConfig();

    if (!config[apiKey]) {
      return res.json({ 
        success: false,
        error: "Invalid API Key",
        message: "This API key is not whitelisted" 
      });
    }

    if (config[apiKey].groupId !== groupId) {
      return res.json({ 
        success: false,
        error: "Unauthorized Group",
        message: "This API key is not authorized for this group" 
      });
    }

    const parsedGroupId = parseInt(groupId);
    const parsedUserId = parseInt(userId);
    const parsedRank = parseInt(rank);

    if (isNaN(parsedGroupId) || isNaN(parsedUserId) || isNaN(parsedRank)) {
      return res.json({ 
        success: false,
        error: "Invalid Input",
        message: "Invalid values provided" 
      });
    }

    const currentUser = await rbx.getAuthenticatedUser();
    const botRank = await rbx.getRankInGroup(parsedGroupId, currentUser.id);
    const userRank = await rbx.getRankInGroup(parsedGroupId, parsedUserId);

    if (botRank === -1) {
      return res.json({ 
        success: false,
        error: "Bot Error",
        message: "Bot not in group" 
      });
    }

    if (userRank === -1) {
      return res.json({ 
        success: false,
        error: "User Error",
        message: "User not in group" 
      });
    }

    await rbx.setRank(parsedGroupId, parsedUserId, parsedRank);
    res.json({ 
      success: true,
      message: "User ranked successfully",
      details: {
        user: parsedUserId,
        group: parsedGroupId,
        newRank: parsedRank,
        apiKeyOwner: config[apiKey].discordOwner
      }
    });

  } catch (error) {
    console.error("Error ranking user:", error);
    res.json({ 
      success: false,
      error: "Server Error",
      message: "Error ranking user" 
    });
  }
});

// Export the app for Vercel
module.exports = app;

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});