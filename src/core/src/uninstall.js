module.exports = {
    execute: async function(message, args) {
        const config = require("../../../config.json"); // pee pee poo poo gugu gaga
        if(!config.owners.includes(message.author.id)) return message.reply("You can't do that bro.");
        const { uninstallModule } = require("../../index.js");
        try {
            await message.reply("Uninstalling module...");
            await uninstallModule(args[0]);
            const index = config.enabledModules.indexOf(args[0]);
            if (index == -1) {
                for (let i = 0; i < config.enabledModules.length; i++) {
                    if (config.enabledModules[i].split("/")[config.enabledModules[i].split("/").length] == args[0]) {
                        index = config.enabledModules.indexOf(config.enabledModules[i]);
                    }
                }
            }
            if (index > -1) {
                config.enabledModules.splice(index, 1);
            }
            require("fs").writeFile(`${__dirname}/../../../config.json`, JSON.stringify(config, null, 4), function writeJSON(err) {
                if (err) return console.log(err);
            });
            await message.reply("Module uninstalled!");
        } catch (err) {
            message.reply("Something went wrong during module installation.");
            console.log(err);
        }
    }
}