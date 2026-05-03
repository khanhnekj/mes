module.exports = {
   config: {
      name: "example",
      alias: ["example"],
      version: "1.0.0",
      role: 0,
      author: "DongDev",
      info: "",
      category: "Admin",
      guides: "",
      cd: 5,
      prefix: true
   },
   onCall: async ({ api, tools, event, msg, args, commandName, Threads, Users, ThreadBans, UserBans, Currencies }) =>{},
   onEvent: async ({ api, tools, event, msg, commandName, Threads, Users, ThreadBans, UserBans, Currencies })=>{},
   onReaction: async ({ api, tools, event, Reaction, msg, commandName, Threads, Users, ThreadBans, UserBans, Currencies })=>{},
   onLoad: async ({ api, modes, tools, client }) =>{},
   onReply: async ({ api, tools, event, msg, Reply, commandName, Threads, Users, ThreadBans, UserBans, Currencies }) =>{},
   onChat: async ({ api, tools, args, event, msg, commandName, Threads, Users, ThreadBans, UserBans, Currencies }) => {},
}