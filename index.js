require('dotenv').config();
const groupId = 15086800;
const cookie = process.env.ROBLOX_COOKIE;

const express = require("express");
const rbx = require("noblox.js");
const app = express();

// Define API keys from environment variables
const apiKeys = {
  "key1": process.env.API_KEY_1,
  "key2": process.env.API_KEY_2,
  "key3": process.env.API_KEY_3
};

async function startApp() {
  try {
    await rbx.setCookie(cookie);
    const currentUser = await rbx.getAuthenticatedUser(); // Updated method
    console.log(`Logged in as ${currentUser.displayName} [${currentUser.id}]`);
  } catch (error) {
    console.error("Error logging in:", error);
  }
}
startApp();

app.get("/rank", async (req, res) => {
  try {
    // Get API key from query parameter
    const apiKey = req.query.apiKey;

    // Check if the API key is valid
    if (!apiKeys[apiKey]) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    // Get the group associated with the API key
    const group = apiKeys[apiKey];

    // Get the userId and rank from query parameters
    const { userid, rank } = req.query;

    if (!userid || !rank) {
      return res.status(400).json({ error: "Missing userid or rank parameter" });
    }

    // Perform the rank change
    await rbx.setRank(groupId, parseInt(userid), parseInt(rank));
    res.json({ message: `User successfully ranked in group ${group}!` });
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
