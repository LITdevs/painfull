const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const chalk = require("chalk");
const ora = require("ora");
const config = require("../config.json");
const fs = require("fs");
const {execSync} = require('child_process');
require("dotenv").config();
let spinner;

console.clear();
console.log(chalk.greenBright("Painfull"));

async function installModule(moduleName) {
    //Check for installed module, and validate existance of all required files (All entrypoints, apis along with package.json and manifest.json)
    if (!fs.existsSync(`${__dirname}/modules/`)){
        fs.mkdirSync(`${__dirname}/modules/`);
    }
    if (fs.existsSync(`${__dirname}/modules/${moduleName}`)) {
        if (validateModule(moduleName)) modulesToLoad.push(moduleName)
    } else {
        spinner = ora(`Installing ${moduleName}...\n`).start();
        let gitClone;
        if(!moduleName.includes("git://")) { //that spaghetti mess should figure out what user/org to look under, not too sure on the split substr part tho lololol
            gitClone = execSync(`cd ${__dirname}\\modules && git clone https://github.com/${!moduleName.includes("@") ? "painfull-community" : moduleName.split("/")[0].substr(1)}/${moduleName}`) // we should probably uh... create a modules folder before this? would you mind doign that
        } else {
            gitClone = execSync(`cd ${__dirname}\\modules && git clone ${moduleName}`)
        }
        spinner.stop();
        if (validateModule(moduleName)) modulesToLoad.push(moduleName)
    }
}

function moduleFailed(moduleName) {
    console.log("fuck tart tell the owner here!!")
}

function validateModule(moduleName) {
    spinner = ora(`Validating ${moduleName}...\n`).start();

    let moduleFolder = `${__dirname}/modules/${moduleName}`
    const manifestExists = fs.existsSync(moduleFolder + "/manifest.json") // i a mdead
    if(manifestExists) {
        if (!validateManifest(moduleFolder)) {
            moduleFailed(moduleName)
            return spinner.fail(chalk.red("Error while validating "+ moduleName + ", invalid manifest!"))
        }
    }
    const packageJsonExists = fs.existsSync(moduleFolder + "/package.json")
    
    spinner.succeed()
}

function validateManifest(moduleFolder) {
    let manifest = JSON.parse(fs.readFileSync(moduleFolder + "/manifest.json"))
    if (!manifest.name) return false
    for (let i = 0; i < Object.keys(manifest.entrypoints).length; i++) {
        if(!fs.existsSync(moduleFolder + manifest.entrypoints[Object.keys(manifest.entrypoints)[i]])) return false
    }
    for (let i = 0; i < Object.keys(manifest.apis).length; i++) {
        if(!fs.existsSync(moduleFolder + manifest.apis[Object.keys(manifest.apis)[i]])) return false
    }

}
var modulesToLoad = []
var modulesProcessed = 0
let downloadSpinner = ora(`Downloading and validating Modules...\n`).start();
config.enabledModules.forEach(async module =>  {
    await installModule(module);
    modulesProcessed++
    if(modulesProcessed >= config.enabledModules.length) {
        downloadSpinner.stop()
        let installSpinner = ora(`Initializing Modules...\n`).start();
        // do vukkybot loading magic here
        installSpinner.succeed("Modules initialized")
    }
});

spinner = ora("Connecting to Discord...").start();
spinner.succeed("Spinner is over party")

client.once('ready', () => {
	spinner.succeed(`Connected to Discord as ${client.user.tag}!`);
    console.log();
});


//client.login(process.env.BOT_TOKEN);