var config = require('../../../config.json');
var client

function init(dclient) {
	client = dclient;
} 

function error (error) {
    let bootDMs = [];
	// oh right i forgot this particular thing is used as fallback
	let localization = require('./cls/cls.js').api.getString("core", "error.dm")
	if (!localization) localization = "The bot ran into a localization error" // localization returns false if the cls is in an error state.
    bootDMs.push(`${localization} \n\`\`\`${error}\`\`\``);
    bootDMs.forEach(dm => {
		config.owners.forEach(owner => {
			client.users.fetch(owner).then(user => {
				user.send(dm);
			})
		})
	});
}
module.exports = {
    api: {error},
	init
}