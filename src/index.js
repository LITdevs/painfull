const { Client, Intents, Collection } = require('discord.js');
const chalk = require("chalk");
const ora = require("ora");
const config = require("../config.json");
const fs = require("fs");
const {execSync} = require('child_process');
const pjson = require("../package.json")
require("dotenv").config();
let spinner;
let bootDMs = [];
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });
client.commands = new Collection();
console.clear();
console.log(chalk.greenBright("Painfull"));
var modulesToLoad = []

async function installModule(moduleName) {
	//Check for installed module, and validate existance of all required files (All entrypoints, apis along with package.json and manifest.json)
	if (!fs.existsSync(`${__dirname}/modules/`)){
		fs.mkdirSync(`${__dirname}/modules/`);
	}
	if (fs.existsSync(`${__dirname}/modules/${moduleName}`)) {
		if (validateModule(moduleName)) modulesToLoad.push(moduleName)
	} else {
		downloadSpinner.text = `Installing ${moduleName}...`;
		let gitClone;
		try {
			if(!moduleName.includes("git://")) { //that spaghetti mess should figure out what user/org to look under, not too sure on the split substr part tho lololol
			gitClone = execSync(`cd ${__dirname}\\modules && git clone https://github.com/${!moduleName.includes("@") ? "painfull-community" : moduleName.split("/")[0].substr(1)}/${moduleName}`) // we should probably uh... create a modules folder before this? would you mind doign that
			} else {
				gitClone = execSync(`cd ${__dirname}\\modules && git clone ${moduleName}`)
			}                                                                                                                   // VVVV WELL FIX IT I HAVE NO IDEA HOW THIS WORKS AT ALL LOL
			execSync(`cd ${__dirname}\\modules\\${!moduleName.includes("@") && moduleName.includes("git://") ? moduleName : moduleName.includes("git://") ? moduleName.split("/")[moduleName.split("/").length - 1] : moduleName.includes("@") ? moduleName.split("/")[1] : moduleName} && npm install`)
			if (validateModule(moduleName)) modulesToLoad.push(moduleName)
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

	let moduleFolder = `${__dirname}/modules/${moduleName}`
	const manifestExists = fs.existsSync(moduleFolder + "/manifest.json") // i a mdead
	if(manifestExists) {
		if (!validateManifest(moduleFolder)) {
			return moduleFailed(moduleName);
		}
	}
	const packageJsonExists = fs.existsSync(moduleFolder + "/package.json")
	if(!packageJsonExists) bootDMs.push("package.json missing in module:" + moduleName);
	if(!packageJsonExists) return false; //yes, good
	
	return true //figured it out. i never returned true if it succeeded lmfao
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
			if(!fs.existsSync(moduleFolder + "/" +  manifest.entrypoints[Object.keys(manifest.entrypoints)[i]])) return false // what now?
		}
	}
	if(manifest.apis) {
		for (let i = 0; i < Object.keys(manifest.apis).length; i++) {
			if(!fs.existsSync(moduleFolder + "/" +  manifest.apis[Object.keys(manifest.apis)[i]])) bootDMs.push("api missing in module:" + moduleName) // ok
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
	for (let i = 0; i < manifest.eventHandlers.length; i++) {
		if(!validEvents.includes(manifest.eventHandlers[i])) bootDMs.push("invalid event handler in module:" + moduleName)
		if(!validEvents.includes(manifest.eventHandlers[i])) return false
	}
	return true //shut up shut up shut up shut up shut up i did not forget i didnt i didnt dfjaoiwjefoiajwpfwwwwwfwfwfwfwfwfwfwfwfwfwfwfwfwfwfwfwfwfwfwfwfwfwfwfwfwfwfwfwfwfwfwfw
}

function loadModule(moduleName, isCore) {
	var moduleManifest
	if (!isCore) moduleManifest = require(`${__dirname}/modules/${moduleName}/manifest.json`)
	if (isCore) moduleManifest = require(`${__dirname}/core/manifest.json`)
	Object.entries(moduleManifest.entrypoints).forEach(entrypoint => { // gjsadkgjsdk forget it
		let [commandName, commandPath] = entrypoint;
		let command
		if (!isCore) command = require(`${__dirname}/modules/${moduleName}/${commandPath}`); // yay?
		if (isCore) command = require(`${__dirname}/core/${commandPath}`);
		let validEvents = ["apiRequest", "apiResponse", "applicationCommandCreate", "applicationCommandDelete", "applicationCommandUpdate", "channelCreate", "channelDelete", "channelPinsUpdate", "channelUpdate", "debug", "emojiCreate", "emojiDelete", "emojiUpdate", "error", "guildBanAdd", "guildBanRemove", "guildCreate", "guildDelete", "guildIntegrationsUpdate", "guildMemberAdd", "guildMemberAvailable", "guildMemberRemove", "guildMembersChunk", "guildMemberUpdate", "guildScheduledEventCreate", "guildScheduledEventDelete", "guildScheduledEventUpdate", "guildScheduledEventUserAdd", "guildScheduledEventUserRemove", "guildUnavailable", "guildUpdate", "interaction", "interactionCreate", "invalidated", "invalidRequestWarning", "inviteCreate", "inviteDelete", "message", "messageCreate", "messageDelete", "messageDeleteBulk", "messageReactionAdd", "messageReactionRemove", "messageReactionRemoveAll", "messageReactionRemoveEmoji", "messageUpdate", "presenceUpdate", "rateLimit", "ready", "roleCreate", "roleDelete", "roleUpdate", "shardDisconnect", "shardError", "shardReady", "shardReconnecting", "shardResume", "stageInstanceCreate", "stageInstanceDelete", "stageInstanceUpdate", "stickerCreate", "stickerDelete", "stickerUpdate", "threadCreate", "threadDelete", "threadListSync", "threadMembersUpdate", "threadMemberUpdate", "threadUpdate", "typingStart", "userUpdate", "voiceStateUpdate", "warn", "webhookUpdate"]
		if(command.registerEventHandlers) {
			let addedHandlers = []
			command.registerEventHandlers(function (eventName, handler) {
				if(!validEvents.includes(eventName)) bootDMs.push("invalid event handler in module:" + moduleName)
				if(!validEvents.includes(eventName)) return
				if(addedHandlers.includes(eventName)) bootDMs.push("duplicate event handler in module:" + moduleName)
				if(addedHandlers.includes(eventName)) return
				if(!moduleManifest.eventHandlers.includes(eventName)) bootDMs.push("undeclared event handler in module:" + moduleName)
				if(!moduleManifest.eventHandlers.includes(eventName)) return
				addedHandlers.push(eventName)
				client.on(eventName, handler)
			})
		}
		client.commands.set(commandName, command);
	});

}

function uninstallModule(moduleName) {
	let moduleFolder = `${__dirname}/modules/${moduleName}`
	let moduleManifest = require(`${__dirname}/modules/${moduleName}/manifest.json`)
	Object.entries(moduleManifest.entrypoints).forEach(entrypoint => { // gjsadkgjsdk forget it
		let [commandName, _commandPath] = entrypoint;
		client.commands.delete(commandName);
	});
	if(fs.existsSync(moduleFolder)) {
		fs.rmSync(moduleFolder, { recursive: true })
	}
}

var modulesProcessed = 0
let downloadSpinner = ora(`Downloading and validating modules...`).start();
config.enabledModules.forEach(async module =>  {
	await installModule(module);
	modulesProcessed++
	if(modulesProcessed >= config.enabledModules.length) {
		downloadSpinner.succeed("Modules downloaded!");
		let installSpinner = ora("Initializing modules...").start();
		modulesToLoad.forEach(async moduleName =>  {
			var moduleName = !moduleName.includes("@") && moduleName.includes("git://") ? moduleName : moduleName.includes("git://") ? moduleName.split("/")[moduleName.split("/").length - 1] : moduleName.includes("@") ? moduleName.split("/")[1] : moduleName
			installSpinner.text = `Initializing ${moduleName}...`; // to see if it happens. bajillon spinners
			loadModule(moduleName, false)
		});
		installSpinner.succeed("Modules initialized!");
	}
});
loadModule("core", true)

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
		message.reply("ok here:" + JSON.stringify(client.commands.toJSON()));
	} //adding new commands t;he old school way

	if (!message.content.startsWith(config.prefix) || message.author.bot) return;

	const args = message.content.slice(config.prefix.length).trim().split(/ +/);
	const command = args.shift().toLowerCase();

	if (!client.commands.has(command)) return message.reply('that command does not exist!');

	try {
		client.commands.get(command).execute(message, args, { client: client }); // lmfao
	} catch (error) {
		console.error(error);
		message.reply('there was an error trying to execute that command!');
	}
	
});

client.once('ready', () => {
	spinner.succeed(`Connected to Discord as ${client.user.tag}!`);
	bootDMs.forEach(dm => {
		config.owners.forEach(owner => {
			client.users.fetch(owner).then(user => {
				user.send(dm);
			})
		})
	});
	console.log();
});


client.login(process.env.BOT_TOKEN);

module.exports = {
    installModule,
	uninstallModule,
    loadModule
}