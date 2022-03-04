var config = require('../../../config.json');
function error (error, client) {
    let bootDMs = [];
    bootDMs.push(`The bot ran into an error, \n\`\`\`${error}\`\`\``);
    bootDMs.forEach(dm => {
		config.owners.forEach(owner => {
			client.users.fetch(owner).then(user => {
				user.send(dm);
			})
		})
	});
}
module.exports = {
    api: {error}
}