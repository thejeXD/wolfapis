require('dotenv').config();
const cookie = process.env.ROBLOX_COOKIE;
const config = require("./config.json");

const express = require("express");
const rbx = require("noblox.js");
const app = express();

// Start the application and log in
async function startApp() {
  try {
    await rbx.setCookie(cookie);
    const currentUser = await rbx.getAuthenticatedUser(); // Fetch the bot's user info
    console.log(`Logged in as ${currentUser.displayName} [${currentUser.id}]`);

  } catch (error) {
    console.error("Error logging in:", error);
  }
}

startApp();

// The main route to rank a user
app.get("/rank", async (req, res) => {
  try {
    const { userid, rank, groupid } = req.query;

    // Ensure that the groupId is valid
    if (!groupid || !config.validGroups[groupid]) {
      return res.status(400).json({ error: "Invalid or missing groupId" });
    }

    // Ensure userid and rank are provided
    if (!userid || !rank) {
      return res.status(400).json({ error: "Missing userid or rank parameter" });
    }

    // Convert groupid, userid, and rank to integers for further use
    const groupId = parseInt(groupid);
    const userId = parseInt(userid);
    const roleId = parseInt(rank);

    // Ensure groupId, userId, and roleId are valid
    if (isNaN(groupId) || isNaN(userId) || isNaN(roleId)) {
      return res.status(400).json({ error: "Invalid groupId, userid, or rank" });
    }

    // Get bot's rank in the requested group
    const botRole = await rbx.getRankInGroup(groupId);

    // Check if the bot has permission to rank
    if (botRole < 2) {  // 2 = Moderator, adjust according to your requirements
      return res.status(403).json({ error: "Bot does not have permission to rank users in this group" });
    }

    // Proceed with ranking the user
    await rbx.setRank(groupId, userId, roleId);
    res.json({ message: "User successfully ranked!" });
  } catch (error) {
    console.error("Error ranking user:", error);
    res.status(500).json({ error: "Failed to rank user" });
  }
});

// Export the app for deployment (e.g., Vercel)
module.exports = app;

// Start the server for local development (optional)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
