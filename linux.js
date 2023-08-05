const {Client, GatewayIntentBits} = require('discord.js');
const fs = require("fs");
require('dotenv').config();
const client = new Client({
    intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent]
});
let lastUpdate;
let timeoutExists;
let data;

const error1 = setTimeout(function () {
    console.log("\x1b[41m", "ERROR: UNABLE TO CONNECT TO DISCORD SERVER");
}, 10000);

const writeToCache = (data) => {
    fs.writeFileSync("count.json", JSON.stringify(data));
};

const readFromCache = () => {
    return JSON.parse(fs.readFileSync('count.json').toString());
};

const fetchUser = async id => {
    return (await client.users.fetch(id)).username
};

const setStatus = (max) => {
    client.user.setActivity(`${max.username} is 1st with a count of ${max.count}`);
};

const lbCommand = async (message) => {
    const unsortedTable = new Map();
    for (const row in data.count) {
        unsortedTable.set(row, data.count[row]);
    }
    let leaderboardString = "";
    const sortedTable = new Map([...unsortedTable.entries()].sort((a, b) => b[1] - a[1]));
    let i = 0;
    for (let [id, count] of sortedTable) {
        leaderboardString += `${await fetchUser(id)}: ${count}\n`;
        if (i++ >= 9) break;
    }
    message.channel.send({
        embeds: [{
            color: "51378", author: {
                name: 'Leaderboard',
                icon_url: 'https://github.com/keitannunes/clubbot/blob/master/views/leaderboard.png?raw=true',
            }, description: leaderboardString
        }]
    })
};

const countCommand = async (message) => {
    message.reply(`You said linux ${data.count[message.author.id]} times`)
};

const addCount = async (message) => {
    if (!(message.author.id in data.count)) {
        data.count[message.author.id] = 0;
    }
    if (++data.count[message.author.id] % 10 === 0) {
        message.channel.send(`<@${message.author.id}> said linux ${data.count[message.author.id]} times!`);
    }
    if (data.count[message.author.id] > data.max.count) {
        data.max.count++;
        data.max.username = message.author.username;
        if (lastUpdate + 5000 < Date.now()) {
            setStatus(data.max);
            lastUpdate = Date.now();
        } else if (!timeoutExists) {
            setTimeout(() => {
                setStatus(data.max);
                lastUpdate = Date.now();
                timeoutExists = false;
            }, lastUpdate + 5000 - Date.now());
            timeoutExists = true;
        }
    }
};

console.clear();
console.log("Loading... Please wait");

client.on("ready", () => {
    clearTimeout(error1);
    console.log(`Logged into ${client.guilds.cache.size} guilds`);
    data = readFromCache();
    setStatus(data.max);
    lastUpdate = Date.now();
    timeoutExists = false;
});


client.on("messageCreate", async (message) => {
    if (message.guildId !== process.env.SERVER_ID) return;
    if (message.author.bot) return;
    if (message.content.toLowerCase().startsWith("!lb")) {
        await lbCommand(message);
    }
    if (message.content.toLowerCase().startsWith("!count")) {
        await countCommand(message);
    }
    if (message.content.match(/l.*i.*n.*u.*x/i)) {
        await addCount(message);
    }
});

setInterval(() => writeToCache(data), 60000); //update dmoj points every 5

client.login(process.env.TOKEN);