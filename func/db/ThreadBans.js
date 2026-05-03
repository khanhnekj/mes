module.exports = function ({ models }) {
	const ThreadBans = models.use('ThreadBans');

	async function setData(threadID, reason, banTime) {
		await ThreadBans.findOrCreate({
			where: { threadID },
			defaults: { threadID, reason, banTime }
		});
		return true;
	}

	async function delData(threadID) {
		const ban = await ThreadBans.findOne({ where: { threadID } });
		if (ban) {
			await ban.destroy();
			return true;
		}
		return false;
	}

	async function getData(threadID) {
		const ban = await ThreadBans.findOne({ where: { threadID } });
		if (ban) {
			return {
				threadID: ban.threadID,
				reason: ban.reason,
				banTime: ban.banTime
			};
		}
		return null;
	}

	async function getAll() {
		const bans = await ThreadBans.findAll();
		return bans.map(ban => ({
			threadID: ban.threadID,
			reason: ban.reason,
			banTime: ban.banTime
		}));
	}

	async function delAll() {
		await ThreadBans.destroy({ where: {}, truncate: true });
		return true;
	}

	return { 
        setData, 
        delData,
        getData, 
        getAll,
		delAll
    };
};