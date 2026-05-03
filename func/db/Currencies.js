module.exports = function ({ models }) {
	const Currencies = models.use('Currencies');

	function toPositiveBigInt(value) {
		try {
			const num = BigInt(value);
			return num > 0n ? num : 0n;
		} catch {
			return 0n;
		}
	}

	async function getAll(...data) {
		let where, attributes;
		for (const i of data) {
			if (i.includes('money')) i.push('data');
			if (typeof i !== 'object') throw new Error("Cần đối tượng hoặc mảng.");
			Array.isArray(i) ? attributes = i : where = i;
		}
		try {
			const users = await Currencies.findAll({ where, attributes });
			return users.map(user => {
				let plainUser = user.get({ plain: true });
				plainUser.data ??= {};
				plainUser.data.money ??= '0';
				plainUser.money = toPositiveBigInt(plainUser.data.money);
				delete plainUser.data;
				return plainUser;
			});
		} catch (error) {
			console.error("Lỗi khi lấy dữ liệu tất cả người dùng:", error);
			throw error;
		}
	}

	async function getData(userID) {
		try {
			const user = await Currencies.findOne({ where: { userID } });
			if (!user) return false;

			let plainUser = user.get({ plain: true });
			plainUser.data ??= {};
			plainUser.data.money ??= '0';
			plainUser.money = toPositiveBigInt(plainUser.data.money);
			return plainUser;
		} catch (error) {
			console.error(`Lỗi khi lấy dữ liệu người dùng: ${userID}`, error);
			throw error;
		}
	}

	async function setData(userID, options = {}) {
		if (typeof options !== 'object') throw new Error("Cần đối tượng.");
		try {
			if (options.money !== undefined) {
				const userData = (await getData(userID))?.data ?? {};
				options.data = { ...userData, money: toPositiveBigInt(options.money).toString() };
			}
			const user = await Currencies.findOne({ where: { userID } });
			if (user) {
				await user.update(options);
				return true;
			}
			return false;
		} catch (error) {
			console.error(`Lỗi khi cập nhật dữ liệu cho người dùng: ${userID}`, error);
			throw error;
		}
	}

	async function delData(userID) {
		try {
			const user = await Currencies.findOne({ where: { userID } });
			if (user) {
				await user.destroy();
				return true;
			}
			return false;
		} catch (error) {
			console.error(`Lỗi khi xóa dữ liệu người dùng: ${userID}`, error);
			throw error;
		}
	}

	async function createData(userID, defaults = {}) {
		if (typeof defaults !== 'object') throw new Error("Cần đối tượng.");
		try {
			if (defaults.money !== undefined) {
				defaults.data = { money: toPositiveBigInt(defaults.money).toString() };
			}
			await Currencies.findOrCreate({ where: { userID }, defaults });
			return true;
		} catch (error) {
			console.error(`Lỗi khi tạo dữ liệu cho người dùng: ${userID}`, error);
			throw error;
		}
	}

	async function increaseMoney(userID, money) {
		if (typeof money !== 'number' && typeof money !== 'string' && typeof money !== 'bigint') throw new Error("Cần số hoặc BigInt.");
		try {
			const balance = (await getData(userID))?.money ?? 0n;
			const newBalance = balance + toPositiveBigInt(money);
			await setData(userID, { money: newBalance.toString() });
			return true;
		} catch (error) {
			console.error(`Lỗi khi tăng tiền cho người dùng: ${userID}`, error);
			throw error;
		}
	}

	async function decreaseMoney(userID, money) {
		if (typeof money !== 'number' && typeof money !== 'string' && typeof money !== 'bigint') throw new Error("Cần số hoặc BigInt.");
		try {
			const balance = (await getData(userID))?.money ?? 0n;
			const decreaseAmount = toPositiveBigInt(money);
			const newBalance = balance - decreaseAmount;
			if (newBalance < 0n) throw new Error("Số tiền không thể là số âm.");
			await setData(userID, { money: newBalance.toString() });
			return true;
		} catch (error) {
			console.error(`Lỗi khi giảm tiền cho người dùng: ${userID}`, error);
			throw error;
		}
	}

	async function getIDAll() {
		try {
			const users = await Currencies.findAll({ attributes: ['userID'] });
			return users.map(user => user.userID);
		} catch (error) {
			console.error("Lỗi khi lấy danh sách tất cả ID người dùng.", error);
			throw error;
		}
	}

	return {
		getAll,
		getData,
		setData,
		delData,
		createData,
		increaseMoney,
		decreaseMoney,
		getIDAll
	};
};