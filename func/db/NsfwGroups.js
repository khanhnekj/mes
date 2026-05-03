module.exports = function({ models }) {
	const NsfwGroups = models.use('NsfwGroups');

	function normalizeIDs(ids) {
		if (typeof ids === 'string') {
			return [ids];
		}
		if (typeof ids === 'number') {
			return [ids.toString()];
		}
		if (Array.isArray(ids)) {
			return ids.map(id => id.toString());
		}
		throw new Error("ID nhóm phải là mảng, chuỗi hoặc số.");
	}

	async function setData(groupIDs) {
		const normalizedIDs = normalizeIDs(groupIDs);
		let record = await NsfwGroups.findOne();
		if (!record) {
			await NsfwGroups.create({ groupIDs: normalizedIDs });
			return true;
		}

		const existingIDs = new Set(record.groupIDs || []);
		normalizedIDs.forEach(id => existingIDs.add(id));

		record.groupIDs = Array.from(existingIDs);
		await record.save();

		return true;
	}

	async function getData() {
		const record = await NsfwGroups.findOne();
		if (record) {
			return record.groupIDs || [];
		}
		return [];
	}

	async function delData(groupIDs) {
		const normalizedIDs = normalizeIDs(groupIDs);
		let record = await NsfwGroups.findOne();
		if (record) {
			const currentIDs = new Set(record.groupIDs || []);
			normalizedIDs.forEach(id => currentIDs.delete(id));

			if (currentIDs.size === 0) {
				await record.destroy();
				return true;
			}

			record.groupIDs = Array.from(currentIDs);
			await record.save();
			return true;
		}
		return false;
	}

	async function delAll() {
		const record = await NsfwGroups.findOne();
		if (record) {
			await record.destroy();
			return true;
		}
		return false;
	}

	return { setData, getData, delData, delAll };
};