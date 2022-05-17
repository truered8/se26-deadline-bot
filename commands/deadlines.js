const {MessageEmbed} = require('discord.js');

module.exports = {
  name: "deadlines",
  description: "Tells you your upcoming deadlines",
  execute(message, args, client) {
    const hours = args.length ? args[0] * 24 : Number.MAX_SAFE_INTEGER;
    const days = ~~(hours / 24);
    let title = 'Upcoming Deadlines';
    if(hours > 24) {
      title += ` (${days} days`;
      if(hours % 24 > 0) title += ` ${hours % 24} hours`;
      title += ')';
    } else {
      title += ` (${hours} hours)`;
    }
    const upcoming = client.getUpcomingDeadlines(hours, hours > 24);
    let embed = new MessageEmbed()
      .setColor('#0099ff')
      .setTitle(title)
      .setDescription(upcoming.length ? '' : 'No upcoming deadlines. Take a break!')
      .addFields(...upcoming)
      .setFooter({text: 'Generated from Notion: https://truered8.notion.site/truered8/c89e55f3feb447f7b249c77ccf0fcdff'});
    message.reply({embeds: [embed]});
  },
};
