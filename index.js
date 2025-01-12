  require('dotenv').config();
  const cookie = process.env.ROBLOX_COOKIE;
  const adminKey = process.env.ADMIN_KEY; // Add this to your .env file
  const express = require("express");
  const rbx = require("noblox.js");
  const fs = require('fs').promises;
  const path = require('path');
  const app = express();
  
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

  app.get('/config/view/:adminKey', async (req, res) => {
    try {
      const { adminKey: providedAdminKey } = req.params;
  
      // Verify admin key
      if (providedAdminKey !== adminKey) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Invalid admin key"
        });
      }
  
      // Read and return the config
      const config = await readConfig();
      
      res.json({
        message: "Current configuration",
        config: config,
        totalEntries: Object.keys(config).length
      });
  
    } catch (error) {
      console.error("Error fetching configuration:", error);
      res.status(500).json({
        error: "Server Error",
        message: "An error occurred while fetching the configuration"
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
  
      // Verify admin key
      if (providedAdminKey !== adminKey) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Invalid admin key"
        });
      }
  
      // Validate group exists on Roblox
      try {
        await rbx.getGroup(parseInt(setGroup));
      } catch (error) {
        return res.status(400).json({
          error: "Invalid Group",
          message: "The specified group does not exist on Roblox"
        });
      }
  
      // Validate Roblox username exists
      try {
        await rbx.getIdFromUsername(robloxUsername);
      } catch (error) {
        return res.status(400).json({
          error: "Invalid Username",
          message: "The specified Roblox username does not exist"
        });
      }
  
      // Read current config
      const config = await readConfig();
  
      // Check if key already exists
      if (config[setKey]) {
        return res.status(400).json({
          error: "Duplicate Key",
          message: "This API key already exists in the configuration"
        });
      }
  
      // Add new configuration
      config[setKey] = {
        groupId: setGroup,
        discordOwner: setDiscordOwner,
        discordOwnerId: discordOwnerId,
        robloxUsername: robloxUsername
      };
  
      // Save updated config
      await writeConfig(config);
  
      res.json({
        message: "Whitelist configuration added successfully",
        configuration: config[setKey]
      });
  
    } catch (error) {
      console.error("Error adding whitelist configuration:", error);
      res.status(500).json({
        error: "Server Error",
        message: "An error occurred while adding the whitelist configuration"
      });
    }
  });
  
  // Get whitelist info endpoint
  app.get('/whitelist/info/:adminKey/:apiKey', async (req, res) => {
    try {
      const { adminKey: providedAdminKey, apiKey } = req.params;
  
      // Verify admin key
      if (providedAdminKey !== adminKey) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Invalid admin key"
        });
      }
  
      const config = await readConfig();
  
      if (!config[apiKey]) {
        return res.status(404).json({
          error: "Not Found",
          message: "API key not found in configuration"
        });
      }
  
      res.json({
        message: "Configuration found",
        configuration: config[apiKey]
      });
  
    } catch (error) {
      console.error("Error fetching whitelist information:", error);
      res.status(500).json({
        error: "Server Error",
        message: "An error occurred while fetching the whitelist information"
      });
    }
  });
  
  // Remove whitelist endpoint
  app.get('/whitelist/remove/:adminKey/:apiKey', async (req, res) => {
    try {
      const { adminKey: providedAdminKey, apiKey } = req.params;
  
      // Verify admin key
      if (providedAdminKey !== adminKey) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Invalid admin key"
        });
      }
  
      const config = await readConfig();
  
      if (!config[apiKey]) {
        return res.status(404).json({
          error: "Not Found",
          message: "API key not found in configuration"
        });
      }
  
      // Remove the configuration
      delete config[apiKey];
      await writeConfig(config);
  
      res.json({
        message: "Whitelist configuration removed successfully"
      });
  
    } catch (error) {
      console.error("Error removing whitelist configuration:", error);
      res.status(500).json({
        error: "Server Error",
        message: "An error occurred while removing the whitelist configuration"
      });
    }
  });
  
  // Start the server
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });