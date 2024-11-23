require('dotenv').config();
const groupId = 15086800;
const cookie = process.env.ROBLOX_COOKIE;

const express = require("express");
const rbx = require("noblox.js");
const config = require("./config.json");  // Assuming your API keys are stored in config.json
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
    const { userid, rank, apiKey: providedApiKey } = req.query;

    // Check if API key is valid
    if (!providedApiKey || !config.apiKeys[providedApiKey]) {
      return res.status(400).json({ error: "Invalid API Key" });
    }

    // Ensure userid and rank are provided
    if (!userid || !rank) {
      return res.status(400).json({ error: "Missing userid or rank parameter" });
    }

    // Proceed with ranking the user
    await rbx.setRank(groupId, parseInt(userid), parseInt(rank));
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
