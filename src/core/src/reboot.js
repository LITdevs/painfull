module.exports = {
    execute: async function(message, args, util) {
        const config = require("../../../config.json");
        let cls = util.apis["core-cls"].api;
        if(!config.owners.includes(message.author.id)) return message.reply(cls.getString("core", "error.permission"));
        await message.channel.send(cls.getString("core", "reboot.generic")); // just making sure we don't reboot before the message is sent lol
        util.reboot();
    }
}