module.exports = {
    execute: async function(message, args, utils) {
        let cls = utils.apis["core-cls"].api;
        const config = require("../../../config.json"); // pee pee poo poo gugu gaga
        if(!config.owners.includes(message.author.id)) return message.reply(cls.getString("core", "error.permission"));
        if (args[0].startsWith("@") && args[0].includes("/")) return message.reply(cls.getString("core", "uninstall.no-org"))
        if(!config.enabledModules.includes(moduleName)) return message.reply(cls.getString("core", "uninstall.fail.exists"));
        const { uninstallModule } = require("../../index.js");
        try {
            await message.reply(cls.getString("core", "uninstall.uninstalling"));
            await uninstallModule(args[0]);
            let index = config.enabledModules.indexOf(args[0]);
            if (index == -1) {
                for (let i = 0; i < config.enabledModules.length; i++) {
                    if (config.enabledModules[i].split("/")[config.enabledModules[i].split("/").length - 1] == args[0]) {
                        index = i
                    }
                }
            }
            if (index > -1) {
                config.enabledModules.splice(index, 1);
            }
            require("fs").writeFile(`${__dirname}/../../../config.json`, JSON.stringify(config, null, 4), function writeJSON(err) {
                if (err) { 
                    utils.apis["core-error"].api.error(err);
                    return console.log(err);
                }
            });
            await message.reply(cls.getString("core", "uninstall.success"));
        } catch (err) {
            message.reply(cls.getString("core", "uninstall.fail"));
            utils.apis["core-error"].api.error(err);
            console.log(err);
        }
    }
}