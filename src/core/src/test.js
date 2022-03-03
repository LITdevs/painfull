module.exports = {
    execute: async function(message, args, apis) {
        let sharkdb = apis.apis["shark-db-db"].api;
        /*if(args[0] == "create") {
            sharkdb.create(args[1])
            return
        }*/
        if(args[0] == "edit") {
            sharkdb.edit(args.slice(1).join(" "))
            return
        }
        sharkdb.pissjar(tests => {
            message.channel.send(tests.commandOutput);
        })
    }
}