module.exports = function ({ models }) {
	const UserBans = models.use('UserBans');

	async function setData(userID, reason, banTime) {
		await UserBans.findOrCreate({
			where: { userID },
			defaults: { userID, reason, banTime }
		});
		return true;
	}

	async function delData(userID) {
		const ban = await UserBans.findOne({ where: { userID } });
		if (ban) {
			await ban.destroy();
			return true;
		}
		return false;
	}

	async function getData(userID) {
		const ban = await UserBans.findOne({ where: { userID } });
		if (ban) {
			return {
				userID: ban.userID,
				reason: ban.reason,
				banTime: ban.banTime
			};
		}
		return null;
	}

	async function getAll() {
		const bans = await UserBans.findAll();
		return bans.map(ban => ({
			userID: ban.userID,
			reason: ban.reason,
			banTime: ban.banTime
		}));
	}

	async function delAll() {
		await UserBans.destroy({ where: {}, truncate: true });
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