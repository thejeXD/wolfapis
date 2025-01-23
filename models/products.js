const conversionRate = 2.8; // Credits per 1 Robux
const creditsBack = 0.3; // 30%  

module.exports = [
    { name: 'Vehicle Spawner X', id: '1', price: 350 },
    { name: 'Moderator Call', id: '2', price: 150 },
    { name: 'Lock System V2', id: '3', price: 400 },
    { name: 'Support Service', id: '4', price: 400 },
    { name: 'Duty Log', id: '5', price: 320 },
    { name: 'Death GUI', id: '6', price: 130 },
    { name: 'Advanced Team Changer', id: '7', price: 210 },
    { name: 'Training Chat Panel', id: '8', price: 150 },
    { name: 'Loading Screen', id: '9', price: 100 },
    { name: 'ZMenu', id: '10', price: 1100 },
    { name: 'Notification System', id: '11', price: 210 },
    { name: 'Shop GUI BF: Theme', id: '12', price: 100 },
    { name: 'Zone GUI', id: '13', price: 130 },
    { name: 'Military GUI', id: '14', price: 700 },
    { name: 'Announcement GUI', id: '15', price: 500 },
    { name: 'Level System', id: '16', price: 250 },
    { name: 'Kick System', id: '17', price: 100 }
].map(product => ({
    ...product,
    shopPrice: Math.ceil(product.price * conversionRate) // Calculate shop price dynamically
}));
