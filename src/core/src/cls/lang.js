module.exports = {
    execute: async function(message, args, util) {
        const config = require("../../../../config.json");
        if(!config.owners.includes(message.author.id)) return message.reply(cls.getString("core", "error.permission"));
        if (util.apis["core-cls"].api.setLang(args[0])) {
            message.channel.send({content: `${util.apis["core-cls"].api.getString("core", "lang.success").replace("{0}", args[0])}`, allowedMentions: { parse: [] }});
        }
    }
}