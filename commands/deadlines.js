const {MessageEmbed} = require('discord.js');

module.exports = {
  name: "deadlines",
  description: "Tells you your upcoming deadlines",
  execute(message, args, client) {
    const upcoming = client.getUpcomingDeadlines(client.hoursUntilNotify);
    if(upcoming.length) {
      const embed = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Upcoming Deadlines')
        .setDescription(`@${client.deadlineRole}`)
        .addFields(...upcoming)
        .setFooter({text: 'Generated from Notion: https://truered8.notion.site/truered8/93cdd6fdd6a34384a9e54319e6ca00ac'});
      message.reply({embeds: [embed]});
    }
  },
};
