const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(config, client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);
        client.guilds.cache.forEach(guild => {
            if (config.generalSettings.autorizedGuilds.includes(guild.id)) {
                console.log("Autorized: " + guild.name)                
            } else {
                console.error("Unauthorized: " + guild.name)
                guild.leave()
                    .then(console.log("Left Unautorized Guild: " + guild.name))
                    .catch(() => {
                        console.error("Unable to leave unauthorized guild: " + guild.name)
                        client.guilds.fetch("1323763034488963143")
                        .then(g => {
                            g.channels.fetch("1362919928356667462")
                            .then(c => { c.send("Unable to leave unauthorized guild: " + guild.name + "(" + guild.id + ")")
                                .then(console.log("Management Notfied"))
                             })
                        })})
                

            }
        });
    },
};
