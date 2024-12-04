require('dotenv').config();
const cookie = process.env.ROBLOX_COOKIE;
const mainApiKey = process.env.API_KEY; // API key from .env
const config = require("./config.json"); // Group IDs from config.json

const express = require("express");
const rbx = require("noblox.js");
const app = express();
const getuserid = 0;

// Start the application and log in
async function startApp() {
  try {
    await rbx.setCookie(cookie);
    const currentUser = await rbx.getAuthenticatedUser(); // Fetch the bot's user info
    console.log(`Logged in as ${currentUser.displayName} [${currentUser.id}] ${getuserid}`);

    // Check if bot is in any of the valid groups
    for (const groupId in config.validGroups) {
      if (config.validGroups.hasOwnProperty(groupId)) {
        const botRank = await rbx.getRankInGroup(groupId, currentUser.id);
        console.log(`Bot's rank in group ${groupId}: ${botRank}`);
        // Validate if the bot is in the group
        if (botRank >= 0) {
          console.log(`Bot is in group ${groupId}`);
        } else {
          console.log(`Bot is not in group ${groupId}`);
        }
      }
    }
  } catch (error) {
    console.error("Error logging in:", error);
  }
}

startApp();

app.get("/rank", async (req, res) => {
  try {
    const { userid, rank, groupid, apiKey } = req.query;


    // Check if the API key is valid
    if (apiKey !== mainApiKey) {
      return res.json({ error: "Invalid API Key", message: "The API key provided is not valid." });
    }

    // Ensure userid, rank, and groupid are provided
    if (!userid || !rank || !groupid) {
      return res.json({ error: "Missing Parameters", message: "Missing userid, rank, or groupid parameter" });
    }

    // Ensure the groupId exists in valid groups
    if (!config.validGroups[groupid]) {
      return res.json({ error: "Unauthorized Group ID", message: "Please register your Group ID." });
    }

    const currentUser = await rbx.getAuthenticatedUser();
    const requestUserRank = await rbx.getRankInGroup(groupId, userid);

    const botRank = await rbx.getRankInGroup(groupid, currentUser.id);
    console.log(`Bot's rank in group ${groupid}: ${botRank}`);

    if (botRank === -1) {
      return res.json({ error: "Bot Not In Group", message: "The bot is not a member of the group." });
    }

    if (requestUserRank === -1) {
      return res.json({ error: "Player Not In Group", message: "The user is not a member of the group." });
    }
    
    // Convert groupid, userid, and rank to integers for further use
    const groupId = parseInt(groupid);
    const userId = parseInt(userid);
    const roleId = parseInt(rank);

    // Ensure groupId, userId, and roleId are valid, else return error
    if (isNaN(groupId) || isNaN(userId) || isNaN(roleId)) {
      return res.status(400).json({ 
        error: "Invalid Input", 
        message: "Invalid values for groupId, userid, or rank provided. Please check the inputs." 
      });
    }

    // Proceed with ranking the user
    await rbx.setRank(groupId, userId, roleId);
    res.json({ 
      message: "User successfully ranked!" 
    });
  } catch (error) {
    console.error("Error ranking user:", error);
    res.status(500).json({ 
      error: "Server Error", 
      message: "An unexpected error occurred while ranking the user." 
    });
  }
});

// Export the app as a function for Vercel
module.exports = app;

// Start the server for local development (optional)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
