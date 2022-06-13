const { Client, Intents, Collection } = require('discord.js');
const chalk = require("chalk");
const ora = require("ora");
const config = require("../config.json");
const fs = require("fs");
const {execSync} = require('child_process');
const pjson = require("../package.json");
const cls = require('./core/src/cls/cls');
require("dotenv").config();
let spinner;
let bootDMs = [];
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });
client.commands = new Collection();
console.clear();
console.log(chalk.greenBright("Painfull"));
var modulesToLoad = []
let apis = {}
let botRunning = false;
let rebootPending = false;
let clsImportQueue = [];

async function installModule(moduleName) {
	//Check for installed module, and validate existance of all required files (All entrypoints, apis along with package.json and manifest.json)
	if (!fs.existsSync(`${__dirname}/modules/`)){
		fs.mkdirSync(`${__dirname}/modules/`);
	}
	if (fs.existsSync(`${__dirname}/modules/${moduleName.includes("/") ? moduleName.split("/")[moduleName.split("/").length - 1] : moduleName}`)) {
		if (validateModule(moduleName.includes("/") ? moduleName.split("/")[moduleName.split("/").length - 1] : moduleName)) modulesToLoad.push(moduleName)
	} else {
		downloadSpinner.text = `Installing ${moduleName}...`;
		try {
			let gitClone;
			if(!moduleName.includes("git://")) { 
			gitClone = execSync(`cd ${__dirname}/modules && git clone https://github.com/${!moduleName.includes("@") ? "painfull-community" : moduleName.split("/")[0].substr(1)}/${moduleName.includes("@") ? moduleName.split("/")[1] : moduleName}`) // we should probably uh... create a modules folder before this? would you mind doign that
			} else {
				gitClone = execSync(`cd ${__dirname}/modules && git clone ${moduleName}`)
			}
			execSync(`cd ${__dirname}/modules/${!moduleName.includes("@") && moduleName.includes("git://") ? moduleName : moduleName.includes("git://") ? moduleName.split("/")[moduleName.split("/").length - 1] : moduleName.includes("@") ? moduleName.split("/")[1] : moduleName} && npm install`)
			if (validateModule(moduleName)) modulesToLoad.push(moduleName)
			
			let moduleFolder = `${__dirname}/modules/${moduleName.includes("/") ? moduleName.split("/")[moduleName.split("/").length - 1] : moduleName}`
			let manifest = JSON.parse(fs.readFileSync(moduleFolder + "/manifest.json"))

			// If the manifest declares a locals file, make sure it has the correct moduleName, then import it
			if(manifest.locals) {
				if (!fs.existsSync(`${moduleFolder}/${manifest.locals}`)) {
					bootDMs.push(`Locals missing but defined in module ${moduleName}`);
				}
				let moduleLocals = JSON.parse(fs.readFileSync(`${moduleFolder}/${manifest.locals}`))
				clsImportQueue.push(moduleLocals)
			}

			if(botRunning && manifest.apis) rebootPending = true;

		} catch (error) {
			console.log(error)
			moduleFailed(moduleName);
		}
	}
}

function moduleFailed(moduleName) {
	bootDMs.push(`${moduleName} failed to load.`);
}

function validateModule(moduleName) {
	downloadSpinner.text = `Validating ${moduleName}...`;

	let moduleFolder = `${__dirname}/modules/${moduleName.includes("/") ? moduleName.split("/")[moduleName.split("/").length - 1] : moduleName}`
	const manifestExists = fs.existsSync(moduleFolder + "/manifest.json")
	if(manifestExists) {
		if (!validateManifest(moduleFolder)) {
			return moduleFailed(moduleName);
		}
	}
	if(!manifestExists) bootDMs.push("manifest.json missing in module:" + moduleName);
	if(!manifestExists) return false;
	const packageJsonExists = fs.existsSync(moduleFolder + "/package.json")
	if(!packageJsonExists) bootDMs.push("package.json missing in module:" + moduleName);
	if(!packageJsonExists) return false;
	
	let manifest = JSON.parse(fs.readFileSync(moduleFolder + "/manifest.json"))
	if(manifest.locals) {
		let moduleLocals = JSON.parse(fs.readFileSync(`${moduleFolder}/${manifest.locals}`))
		let parsedName = moduleName.includes("/") ? moduleName.split("/")[moduleName.split("/").length - 1] : moduleName
		if(moduleLocals.moduleName != parsedName) {
			bootDMs.push("Module name mismatch in module:" + moduleName);
			return false
		}
	}
	

	return true
}

function validateManifest(moduleFolder) {
	let moduleName = moduleFolder.split("/")[moduleFolder.split("/").length - 1]
	let manifest = JSON.parse(fs.readFileSync(moduleFolder + "/manifest.json"))
	if (!manifest.name) bootDMs.push("name missing in module:" + moduleName)
	if (!manifest.name) return false
	if (!manifest.original_pain_version) bootDMs.push("original pain version missing in module: " + moduleName) 
	if (!manifest.original_pain_version) return false
	if (!manifest.min_pain_version) bootDMs.push("minimum pain version missing in module: " + moduleName) 
	if (!manifest.min_pain_version) return false
	if(manifest.entrypoints) {
		for (let i = 0; i < Object.keys(manifest.entrypoints).length; i++) {
			if(!fs.existsSync(moduleFolder + "/" +  manifest.entrypoints[Object.keys(manifest.entrypoints)[i]])) bootDMs.push("entrypoint missing in module:" + moduleName)
			if(!fs.existsSync(moduleFolder + "/" +  manifest.entrypoints[Object.keys(manifest.entrypoints)[i]])) return false
		}
	}
	if(manifest.apis) {
		for (let i = 0; i < Object.keys(manifest.apis).length; i++) {
			if(!fs.existsSync(moduleFolder + "/" +  manifest.apis[Object.keys(manifest.apis)[i]])) bootDMs.push("api missing in module:" + moduleName)
			if(!fs.existsSync(moduleFolder + "/" +  manifest.apis[Object.keys(manifest.apis)[i]])) return false
		}
	}
	let painVersions = pjson.version.split(".") // 0: major, 1: minor, 2: patch
	let minVersions = manifest.min_pain_version.split(".") // 0: major, 1: minor, 2: patch
	let originalVersions = manifest.original_pain_version.split(".") // 0: major, 1: minor, 2: patch
	let maxVersions = null
	if(manifest.max_pain_version) maxVersions = manifest.max_pain_version.split(".") // 0: major, 1: minor, 2: patch
	if(manifest.max_pain_version) {
		if(painVersions[0] > maxVersions[0]) bootDMs.push("1 module does not support this version of pain:" + moduleName)
		if(painVersions[0] > maxVersions[0]) return false
		if(painVersions[1] > maxVersions[1] && painVersions[0] <= maxVersions[0]) bootDMs.push("2 module does not support this version of pain:" + moduleName)
		if(painVersions[1] > maxVersions[1] && painVersions[0] <= maxVersions[0]) return false
		if(painVersions[2] > maxVersions[2] && painVersions[1] <= maxVersions[1] && painVersions[0] <= maxVersions[0]) bootDMs.push("3 module does not support this version of pain:" + moduleName)
		
		if(painVersions[2] > maxVersions[2] && painVersions[1] <= maxVersions[1] && painVersions[0] <= maxVersions[0]) return false
	} else {
		if(painVersions[0] > originalVersions[0]) bootDMs.push("4 module does not support this version of pain:" + moduleName)
		if(painVersions[0] > originalVersions[0]) return false
	}
	if(painVersions[0] < minVersions[0]) bootDMs.push("5 module does not support this version of pain:" + moduleName + "version required by module: " + minVersions + ", version of Pain: " + painVersions)
	if(painVersions[0] < minVersions[0]) return false
	if(painVersions[1] < minVersions[1] && painVersions[0] <= minVersions[0]) bootDMs.push("6 module does not support this version of pain:" + moduleName)
	if(painVersions[1] < minVersions[1] && painVersions[0] <= minVersions[0]) return false
	if(painVersions[2] < minVersions[2] && painVersions[1] <= minVersions[1] && painVersions[0] <= minVersions[0]) bootDMs.push("7 module does not support this version of pain:" + moduleName)
	if(painVersions[2] < minVersions[2] && painVersions[1] <= minVersions[1] && painVersions[0] <= minVersions[0]) return false
	let validEvents = ["apiRequest", "apiResponse", "applicationCommandCreate", "applicationCommandDelete", "applicationCommandUpdate", "channelCreate", "channelDelete", "channelPinsUpdate", "channelUpdate", "debug", "emojiCreate", "emojiDelete", "emojiUpdate", "error", "guildBanAdd", "guildBanRemove", "guildCreate", "guildDelete", "guildIntegrationsUpdate", "guildMemberAdd", "guildMemberAvailable", "guildMemberRemove", "guildMembersChunk", "guildMemberUpdate", "guildScheduledEventCreate", "guildScheduledEventDelete", "guildScheduledEventUpdate", "guildScheduledEventUserAdd", "guildScheduledEventUserRemove", "guildUnavailable", "guildUpdate", "interaction", "interactionCreate", "invalidated", "invalidRequestWarning", "inviteCreate", "inviteDelete", "message", "messageCreate", "messageDelete", "messageDeleteBulk", "messageReactionAdd", "messageReactionRemove", "messageReactionRemoveAll", "messageReactionRemoveEmoji", "messageUpdate", "presenceUpdate", "rateLimit", "ready", "roleCreate", "roleDelete", "roleUpdate", "shardDisconnect", "shardError", "shardReady", "shardReconnecting", "shardResume", "stageInstanceCreate", "stageInstanceDelete", "stageInstanceUpdate", "stickerCreate", "stickerDelete", "stickerUpdate", "threadCreate", "threadDelete", "threadListSync", "threadMembersUpdate", "threadMemberUpdate", "threadUpdate", "typingStart", "userUpdate", "voiceStateUpdate", "warn", "webhookUpdate"]
	if (manifest.eventHandlers) {
		for (let i = 0; i < manifest.eventHandlers.length; i++) {
			if(!validEvents.includes(manifest.eventHandlers[i])) bootDMs.push("invalid event handler in module:" + moduleName)
			if(!validEvents.includes(manifest.eventHandlers[i])) return false
		}
	}
	return true //shut up shut up shut up shut up shut up i did not forget i didnt i didnt dfjaoiwjefoiajwpfwwwwwfwfwfwfwfwfwfwfwfwfwfwfwfwfwfwfwfwfwfwfwfwfwfwfwfwfwfwfwfwfwfwfw
}

function loadModule(moduleName, isCore) {
	var moduleManifest
	let parsedModuleName = moduleName.includes("/") ? moduleName.split("/")[moduleName.split("/").length - 1] : moduleName
	if (!isCore) moduleManifest = require(`${__dirname}/modules/${parsedModuleName}/manifest.json`)
	if (isCore) moduleManifest = require(`${__dirname}/core/manifest.json`)
	if (moduleManifest.apis) {
		Object.entries(moduleManifest.apis).forEach(api => { 
			let [apiName, apiPath] = api;
			let apif
			if (!isCore) apif = require(`${__dirname}/modules/${parsedModuleName}/${apiPath}`);
			if (isCore) apif = require(`${__dirname}/core/${apiPath}`);
			apis[`${parsedModuleName}-${apiName}`] = apif;
		});
	}
	if (moduleManifest.entrypoints) {
		Object.entries(moduleManifest.entrypoints).forEach(entrypoint => {
			let [commandName, commandPath] = entrypoint;
			let command
			if (!isCore) command = require(`${__dirname}/modules/${parsedModuleName}/${commandPath}`);
			if (isCore) command = require(`${__dirname}/core/${commandPath}`);
			let validEvents = ["apiRequest", "apiResponse", "applicationCommandCreate", "applicationCommandDelete", "applicationCommandUpdate", "channelCreate", "channelDelete", "channelPinsUpdate", "channelUpdate", "debug", "emojiCreate", "emojiDelete", "emojiUpdate", "error", "guildBanAdd", "guildBanRemove", "guildCreate", "guildDelete", "guildIntegrationsUpdate", "guildMemberAdd", "guildMemberAvailable", "guildMemberRemove", "guildMembersChunk", "guildMemberUpdate", "guildScheduledEventCreate", "guildScheduledEventDelete", "guildScheduledEventUpdate", "guildScheduledEventUserAdd", "guildScheduledEventUserRemove", "guildUnavailable", "guildUpdate", "interaction", "interactionCreate", "invalidated", "invalidRequestWarning", "inviteCreate", "inviteDelete", "message", "messageCreate", "messageDelete", "messageDeleteBulk", "messageReactionAdd", "messageReactionRemove", "messageReactionRemoveAll", "messageReactionRemoveEmoji", "messageUpdate", "presenceUpdate", "rateLimit", "ready", "roleCreate", "roleDelete", "roleUpdate", "shardDisconnect", "shardError", "shardReady", "shardReconnecting", "shardResume", "stageInstanceCreate", "stageInstanceDelete", "stageInstanceUpdate", "stickerCreate", "stickerDelete", "stickerUpdate", "threadCreate", "threadDelete", "threadListSync", "threadMembersUpdate", "threadMemberUpdate", "threadUpdate", "typingStart", "userUpdate", "voiceStateUpdate", "warn", "webhookUpdate"]
			if(command.registerEventHandlers) {
				let addedHandlers = []
				command.registerEventHandlers(function (eventName, handler) {
					if(!validEvents.includes(eventName)) bootDMs.push("invalid event handler in module:" + moduleName)
					if(!validEvents.includes(eventName)) return
					if(addedHandlers.includes(eventName)) bootDMs.push("duplicate event handler in module:" + moduleName)
					if(addedHandlers.includes(eventName)) return
					if(!moduleManifest.eventHandlers) bootDMs.push("undeclared event handler in module:" + moduleName)
					if(!moduleManifest.eventHandlers) return
					if(!moduleManifest.eventHandlers.includes(eventName)) bootDMs.push("undeclared event handler in module:" + moduleName)
					if(!moduleManifest.eventHandlers.includes(eventName)) return
					addedHandlers.push(eventName)
					client.on(eventName, handler)
				})
			}
			client.commands.set(commandName, command);
		});
	}
	

}

function uninstallModule(moduleName) {
	let moduleFolder = `${__dirname}/modules/${moduleName}`
	let moduleManifest = require(`${__dirname}/modules/${moduleName}/manifest.json`)
	if (moduleManifest.entrypoints) {
		Object.entries(moduleManifest.entrypoints).forEach(entrypoint => {
			let [commandName, _commandPath] = entrypoint;
			client.commands.delete(commandName);
		});
	}
	if(fs.existsSync(moduleFolder)) {
		fs.rmSync(moduleFolder, { recursive: true })
	}
}

var modulesProcessed = 0
let downloadSpinner = ora(`Downloading and validating modules...`).start();
loadModule("core", true)
config.enabledModules.forEach(async module =>  {
	await installModule(module);
	modulesProcessed++
	if(modulesProcessed >= config.enabledModules.length) {
		downloadSpinner.succeed("Modules downloaded!");
		let installSpinner = ora("Initializing modules...").start();
		modulesToLoad.forEach(async moduleName =>  {
			var moduleName = moduleName.includes("/") ? moduleName.split("/")[moduleName.split("/").length - 1] : moduleName
			installSpinner.text = `Initializing ${moduleName}...`;
			loadModule(moduleName, false)
		});
		installSpinner.succeed("Modules initialized!");
	}
});

spinner = ora("Connecting to Discord...").start();

client.on('messageCreate', message => {
	if(message.content == "please give me the error") {
		bootDMs.forEach(dm => {
			config.owners.forEach(owner => {
				client.users.fetch(owner).then(user => {
					user.send(dm);
				})
			})
		});
	}

	if(message.content == "please give me the commands") {
		message.reply("ok here:" + JSON.stringify(JSON.parse(JSON.stringify(client)).commands));
	} //adding new commands t;he old school way

	if (!message.content.startsWith(config.prefix) || message.author.bot) return;
	if (rebootPending) return message.channel.send("Bot is rebooting, please try again after a while...");
	const args = message.content.slice(config.prefix.length).trim().split(/ +/);
	const command = args.shift().toLowerCase();

	if (!client.commands.has(command)) return message.reply(apis["core-cls"].api.getString("core", "error.command.missing"));

	try {
		client.commands.get(command).execute(message, args, { client: client, apis: apis, CLSimportPending: CLSimportPending, reboot: reboot, config: config });
	} catch (error) {
		console.error(error);
		message.reply(apis["core-cls"].api.getString("core", "error.command.failed"));
	}
	
});

client.once('ready', () => {
	spinner.succeed(`Connected to Discord as ${client.user.tag}!`);
	if(!config.firstTimeSeen) {
		config.firstTimeSeen = true
		fs.writeFileSync(`${__dirname}/../config.json`, JSON.stringify(config, null, 4));

		bootDMs.push("**Welcome to Painfull!**\nIf you see this, then you have successfully configured your Painfull instance!\n\n**What now?**\nOut of the box, Painfull doesn't do much.\nYou can make it do new and exciting things by installing \"modules\", which contain new commands and plugins. You can even make your own!\nExplore modules here: https://example.com")
	}
	bootDMs.forEach(dm => {
		config.owners.forEach(owner => {
			client.users.fetch(owner).then(user => {
				user.send(dm);
			})
		})
	});
	spinner = ora("Initializing APIs...").start();
	Object.keys(apis).forEach(api => {
		if(apis[api].initAPIs) {
			apis[api].initAPIs({client, apis, reboot, config})
		}
	})
	spinner.succeed("APIs initialized!");
	botRunning = true;
	spinner = ora(chalk.greenBright("[CLS]") + " Importing pending localization...").start();
	CLSimportPending();
	spinner.succeed(chalk.greenBright("[CLS]") + " Localization imported!");
	console.log()
});

function CLSimportPending() {
	clsImportQueue.forEach(locals => {
		apis["core-cls"].api.importModule(locals)
	})
	if (rebootPending) reboot()
}

function reboot() {
	Object.keys(apis).forEach(api => {
		if(apis[api].preShutdown) {
			apis[api].preShutdown()
		}
	})
	setTimeout(() => {
		try {
			let pm2 = require("pm2") // riiiiiiiight
			pm2.connect(function(err) {
				if (err) apis["core-error"].api.error(err);
				pm2.restart(process.pid);
				setTimeout(() => {
					// https://media.discordapp.net/attachments/952127072057327686/974994441616121856/nb-125644326037487616.png?width=696&height=671
					apis["core-error"].api.inform(apis["core-cls"].api.getString("core", "reboot.failed"))
					process.exit(1)
				}, 5000)
			})
		} catch(e) {
			// https://media.discordapp.net/attachments/952127072057327686/974994441616121856/nb-125644326037487616.png?width=696&height=671
			apis["core-error"].api.inform(apis["core-cls"].api.getString("core", "reboot.failed"))
		}
	}, 1000)
}

client.login(process.env.BOT_TOKEN);

module.exports = {
    installModule,
	uninstallModule,
    loadModule,
	apis
}