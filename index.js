const { Client, Collection, Intents, MessageEmbed } = require('discord.js');
const fs = require("fs");
const axios = require('axios').default;
const keep_alive = require('./keepAlive.js'); // TODO: implement smt that keeps it awake

const DATABASE_ID = 'c89e55f3-feb4-47f7-b249-c77ccf0fcdff';
const REQUEST_URL = `https://api.notion.com/v1/databases/${DATABASE_ID}/query`;
const NOTION_TOKEN = process.env.NOTION_TOKEN;

// discord stuff
const DEADLINE_CHANNEL_ID = '932446122490855425';

// this is the link to add https://discord.com/oauth2/authorize?scope=bot&client_id=938223326545981480
// bot token added as BOT_TOKEN

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_TYPING,
    Intents.FLAGS.GUILD_SCHEDULED_EVENTS,
    ]
  });
client.items = []
client.hoursUntilNotify = 24;
client.deadlineRole = 'deadlines';
client.prefix = '!';

const token = process.env.BOT_TOKEN;

/**
 * Get the assignments with upcoming deadlines.
 * 
 * @param hours: the number of hours to look ahead
 * @param dates: whether to include dates in deadlines
 * @return: the upcoming deadlines
 */
client.getUpcomingDeadlines = (hours, dates=false) => {
  const upcoming = [];
  client.items.forEach(item => {
    const now = new Date();
    const hoursTillDeadline = (item.date - now) / (1000 * 60 * 60);
    if(0 <= hoursTillDeadline && hoursTillDeadline <= hours) {
      const course = item.Course.select.name;
      const name = item.Name.title[0].plain_text;
      const location = item.Type.select.name;
      const time = dates ? 
        item.date.toLocaleString('en-US', {timeZone: 'MST7MDT'}) : 
        item.date.toLocaleTimeString('en-US', {timeZone: 'MST7MDT'});
      upcoming.push({name: `${course} ${name}`, value: `${time} (MST7MDT)`});
    }
  });
  return upcoming;
}

notifyDeadlines = async () => {
  const upcoming = client.getUpcomingDeadlines(client.hoursUntilNotify);
  if(upcoming.length) {
    const embed = new MessageEmbed()
	    .setColor('#0099ff')
      .setTitle('Upcoming Deadlines')
      .setDescription(`@${client.deadlineRole}`)
      .addFields(...upcoming)
      .setFooter({text: 'Generated from Notion: https://truered8.notion.site/truered8/c89e55f3feb447f7b249c77ccf0fcdff'});
    const channel = await client.channels.fetch(DEADLINE_CHANNEL_ID);
    channel.send({embeds: [embed]});
  }
}

client.on('ready', () => {
  console.log("ready");
  console.log(client.user.username);
  axios({
  method: 'POST',
  url: REQUEST_URL,
  headers: {
    'Authorization': `Bearer ${NOTION_TOKEN}`,
    'Notion-Version': '2021-08-16',
  }
  }).then(response => {
      response.data.results.map(res => {
        // So that there aren't duplicate calls of Date()
        res.properties.date = new Date(res.properties.Dates.date.start);
        return res.properties;
      }).sort((a, b) => a.date - b.date).forEach(item => {
        client.items.push(item);
      });
      notifyDeadlines();
      const interval = 1000 * 60 * 60 * client.hoursUntilNotify;
      setInterval(notifyDeadlines, interval);
  });
})

// Overkill for now but will help us add more commands later
client.commands = new Collection();
fs.readdirSync("./commands/").forEach((file) => {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
});

client.on('messageCreate', msg => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith(client.prefix)) return;
  const commandBody = msg.content.slice(client.prefix.length);
  const args = commandBody.split(" ");
  const command = args.shift().toLowerCase();
  if ([...client.commands.keys()].includes(command))
    client.commands.get(command).execute(msg, args, client);
})

client.login(token);