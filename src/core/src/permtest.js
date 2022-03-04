module.exports = {
    execute: async function(message, args, apis) {
        let sharkdb = apis.apis["shark-db-db"].api;
        let perms = apis.apis["shark-perms-manager"].api;
        perms.permittedTo("permtest", message.author.id, message.guild.id, perms => {
            if(!perms) return message.channel.send("your not allowed to do that fart face")
            message.channel.send("ok you did it fucktard")
        })
    }
}