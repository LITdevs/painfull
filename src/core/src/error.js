module.exports = {
    execute: async function(message, args, util) {
        const config = require("../../../config.json");
        if(!config.owners.includes(message.author.id)) return message.reply(cls.getString("core", "error.permission"));
        util.apis["core-error"].api.error(args.join(" "));
    }
}