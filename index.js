require('dotenv').config();
const cookie = process.env.ROBLOX_COOKIE;
const mainApiKey = process.env.API_KEY; // API key from .env
const config = require("./config.json"); // Group IDs from config.json

const express = require("express");
const rbx = require("noblox.js");
const app = express();

// Start the application and log in
async function startApp() {
  try {
    await rbx.setCookie(cookie);
    const currentUser = await rbx.getAuthenticatedUser(); // Fetch the bot's user info
    console.log(`Logged in as ${currentUser.displayName} [${currentUser.id}]`);

    // Get bot's rank in the group (will be used later in the route)
    const botRole = await rbx.getRankInGroup(groupId);
    console.log(`Bot's rank in the group: ${botRole}`);
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
      return res.status(400).json({ error: "Invalid API Key" });
    }

    // Ensure userid, rank, and groupid are provided
    if (!userid || !rank || !groupid) {
      return res.status(400).json({ error: "Missing userid, rank, or groupid parameter" });
    }

    // Ensure the groupId exists in config.json valid groups
    if (!config.validGroups[groupid]) {
      return res.status(400).json({ error: "Unauthorized GROUP ID! Please register your GROUP ID to WOLF." });
    }

    // Convert groupid, userid, and rank to integers for further use
    const groupId = parseInt(groupid);
    const userId = parseInt(userid);
    const roleId = parseInt(rank);

    // Ensure groupId, userId, and roleId are valid, else return error
    if (isNaN(groupId) || isNaN(userId) || isNaN(roleId)) {
      return res.status(400).json({ error: "Invalid groupId, userid, or rank" });
    }

    // Proceed with ranking the user
    await rbx.setRank(groupId, userId, roleId);
    res.json({ message: "User successfully ranked!" });
  } catch (error) {
    console.error("Error ranking user:", error);
    res.status(500).json({ error: "Failed to rank user" });
  }
});

// Export the app as a function for Vercel
module.exports = app;

// Start the server for local development (optional)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
