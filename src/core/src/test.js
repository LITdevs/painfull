module.exports = {
    execute: async function(message, args, apis) {
        let sharkdb = apis.apis["shark-db-db"].api;
        sharkdb.getUser(message.author.id, data => {
            message.channel.send(JSON.stringify(data));
        })
    }
}