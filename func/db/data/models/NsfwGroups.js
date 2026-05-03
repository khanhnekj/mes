module.exports = function ({ sequelize, Sequelize }) {
	const NsfwGroups = sequelize.define('NsfwGroups', {
		id: {
			type: Sequelize.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		groupIDs: {
			type: Sequelize.JSON,
			defaultValue: []
		}
	});

	return NsfwGroups;
};