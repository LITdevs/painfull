module.exports = {
    execute: async function(message, args, util) {
        const config = require("../../../../config.json");
        let cls = util.apis["core-cls"].api;
        if(!config.owners.includes(message.author.id)) return message.reply(cls.getString("core", "error.permission"));
        if (cls.setLang(args[0])) {
            message.channel.send({content: `${cls.getString("core", "lang.success").replace("{0}", args[0])}`, allowedMentions: { parse: [] }});
        }
    }
}