
module.exports = {
    execute: async function(message, args, util) {
        const config = require("../../../config.json"); // pee pee poo poo gugu gaga
        if(!config.owners.includes(message.author.id)) return message.reply("You can't do that bro.");
        util.apis["core-error"].api.error(args.join(" "));
    }
}