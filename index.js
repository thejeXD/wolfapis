require('dotenv').config();
const groupId = 15086800;
const cookie = process.env.ROBLOX_COOKIE;

const express = require("express");
const rbx = require("noblox.js");
const app = express();

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
    const { userid, rank } = req.query;

    if (!userid || !rank) {
      return res.status(400).json({ error: "Missing userid or rank parameter" });
    }

    await rbx.setRank(groupId, parseInt(userid), parseInt(rank));
    res.json({ message: "User successfully ranked!" });
  } catch (error) {
    console.error("Error ranking user:", error);
    res.status(500).json({ error: "Failed to rank user" });
  }
});

// Listen on the port provided by the environment or 3000 by default
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Your app is listening on port ${port}`);
});

module.exports = app;
