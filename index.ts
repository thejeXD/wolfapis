import axios from 'axios';
import { createCanvas, loadImage, registerFont } from 'canvas';
import fs from 'fs';
import FormData from 'form-data';

// Register fonts
registerFont('./fonts/Roboto-Black.ttf', { family: 'Roboto' });
registerFont('./fonts/Roboto-Bold.ttf', { family: 'Roboto-Bold' });

// Your Imgur Client-ID
const IMGUR_CLIENT_ID = '65cc992e8181731';

interface RobloxProfileData {
    username: string;
    profileImageUrl: string;
}

// Helper function to fetch both Roblox profile image and username
const getRobloxProfileData = async (userId: string): Promise<RobloxProfileData> => {
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

// Function to determine the circle color and amount color based on the amount
const getDonationColors = (amount: number): { circleColor: string, amountColor: string } => {
    let circleColor: string;
    let amountColor: string;

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

// Function to generate the image
const generateImage = async (donorId: string, recipientId: string, amount: number): Promise<string> => {
    try {
        const donorData = await getRobloxProfileData(donorId);
        const recipientData = await getRobloxProfileData(recipientId);

        const canvas = createCanvas(800, 200);
        const ctx = canvas.getContext('2d');

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
        ctx.strokeText(amount.toLocaleString(), 400, 100); // Positioned after Robux icon
        ctx.fillText(amount.toLocaleString(), 400, 100); // Positioned after Robux icon

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
        
        // Upload the image to Imgur
        const imgUrl = await uploadToImgur(imageBuffer);

        return imgUrl; // Return the image URL from Imgur
    } catch (error) {
        console.error('Error generating image:', error);
        throw error;
    }
};

// Function to upload image to Imgur
const uploadToImgur = async (imageBuffer: Buffer): Promise<string> => {
    try {
        const formData = new FormData();
        formData.append('image', imageBuffer.toString('base64')); // Convert the image buffer to base64

        const response = await axios.post('https://api.imgur.com/3/image', formData, {
            headers: {
                'Authorization': `Client-ID ${IMGUR_CLIENT_ID}`, // Include the Client-ID for authorization
                'Content-Type': 'multipart/form-data'
            }
        });

        // Return the URL of the uploaded image
        return response.data.data.link;
    } catch (error) {
        console.error('Error uploading to Imgur:', error.message);
        throw new Error('Failed to upload image to Imgur.');
    }
};

// The Vercel handler function
export default async function handler(req: any, res: any) {
    if (req.method === 'GET' && req.url.startsWith('/webhook/dono')) {
        try {
            const { webhookId, webhookToken } = req.query; // Extract webhook ID and Token from the query parameters
            const { donorId, recipientId, amount } = req.query; // Get donation details from the query parameters

            if (!webhookId || !webhookToken || !donorId || !recipientId || !amount) {
                return res.status(400).send('Missing required parameters.');
            }

            // Log the received parameters (for debugging)
            console.log(`Webhook ID: ${webhookId}`);
            console.log(`Webhook Token: ${webhookToken}`);
            console.log(`Donor ID: ${donorId}`);
            console.log(`Recipient ID: ${recipientId}`);
            console.log(`Amount: ${amount}`);

            // Generate the donation image
            const imgUrl = await generateImage(donorId, recipientId, amount);

            // Send the webhook to Discord
            const webhookUrl = `https://discord.com/api/webhooks/${webhookId}/${webhookToken}`;
            await axios.post(webhookUrl, {
                content: `🎉 **Donation Alert!** 🎉 ${donorId} donated **${amount}** to ${recipientId}!`,
                embeds: [
                    {
                        color: 3066993, // Blue color
                        image: { url: imgUrl }, // Add the image URL
                    },
                ],
            });

            res.status(200).send('Donation webhook sent successfully!');
        } catch (error) {
            console.error('Error sending webhook:', error.message);
            res.status(500).send('Failed to send donation webhook.');
        }
    } else {
        res.status(404).send('Not Found');
    }
}
