this.config = {
   name: "rs",
   alias: ["reset", "restart"],
   version: "1.0.0",
   role: 2,
   author: "DongDev",
   info: "Khởi Động Lại Bot.",
   category: "Admin",
   guides: "",
   cd: 0,
   prefix: true
};
this.onCall = ({event, api}) => api.sendMessage("🔄 Restarting!", event.threadID, () => process.exit(1), event.messageID)