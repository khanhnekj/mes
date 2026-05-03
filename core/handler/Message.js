module.exports = async function({api, event}) {
    return {
        send: async (form, callback) => {
            await api.sendMessage(form, event.threadID, callback);
        },
        reply: async (form, callback) => {
            await api.sendMessage(form, event.threadID, callback, event.messageID);
        },
        unsend: async (messageID, callback) => {
            await api.unsendMessage(messageID, callback);
        },
        contact: async (form, senderID) => {
            await api.shareContact(form || '', senderID || event.senderID, event.threadID);
        },
        edit: async (form, messageID) => {
            await api.editMessage(form || '', messageID);
        },
        react: async (emoji, messageID, callback) => {
            await api.setMessageReaction(emoji, messageID || event.messageID, event.threadID, callback || (() => {}));
        }
    };
};