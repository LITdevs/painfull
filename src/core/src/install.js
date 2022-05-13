function parseModuleName(moduleName) {
    if (moduleName.includes("github.com")) {
        return `@${moduleName.split("github.com/")[1].split("/")[0]}/${moduleName.split("github.com/")[1].split("/")[1]}`
    } else {
        if(moduleName.includes("<@")) {
            return false
        } else {
            return moduleName
        }
    }
}
module.exports = {
    execute: async function(message, args, utils) {
        let cls = utils.apis["core-cls"].api;
        const config = require("../../../config.json");
        if(!config.owners.includes(message.author.id)) return message.reply(cls.getString("core", "error.permission"));
        const { installModule, loadModule } = require("../../index.js");
        // installing module...
        moduleName = parseModuleName(args[0])
        if (!moduleName) {
            return message.reply(cls.getString("core", "install.ping"))
        }
        await message.reply(cls.getString("core", "install.installing"));
        try {
            await installModule(moduleName);
            loadModule(moduleName, false);
            message.reply(cls.getString("core", "install.success"));
            config.enabledModules.push(moduleName)
            require("fs").writeFile(`${__dirname}/../../../config.json`, JSON.stringify(config, null, 4), function writeJSON(err) {
                if (err) {
                    utils.apis["core-error"].api.error(err);
                    return console.log(err);
                }
            });
        } catch (err) {
            message.reply(cls.getString("core", "install.fail"));
            utils.apis["core-error"].api.error(err); //copilot wrote this, dont trust it!
            console.log(err);
        }
    }
}