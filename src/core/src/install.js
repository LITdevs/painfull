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
    execute: async function(message, args) {
        const config = require("../../../config.json"); // pee pee poo poo gugu gaga
        if(!config.owners.includes(message.author.id)) return message.reply("You can't do that bro.");
        const { installModule, loadModule } = require("../../index.js");
        // installing module...
        moduleName = parseModuleName(args[0])
        if (!moduleName) {
            return message.reply("You seem to have pinged a Discord user, please supply a GitHub link if you were trying to use the @username/module format.")
        }
        await message.reply("Installing module...");
        try {
            await installModule(moduleName);
            loadModule(moduleName, false);
            message.reply("Module installed!"); //what's a permission check! just kidding
            config.enabledModules.push(moduleName)
            require("fs").writeFile(`${__dirname}/../../../config.json`, JSON.stringify(config, null, 4), function writeJSON(err) {
                if (err) return console.log(err);
            });
        } catch (err) {
            message.reply("Something went wrong during module installation.");
            console.log(err);
        }
    }
}