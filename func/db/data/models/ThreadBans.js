module.exports = function ({ sequelize, Sequelize }) {
	const ThreadBans = sequelize.define('ThreadBans', {
		id: {
			type: Sequelize.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		threadID: {
			type: Sequelize.BIGINT,
			unique: true
		},
		reason: {
			type: Sequelize.STRING
		},
		banTime: {
			type: Sequelize.DATE
		}
	});

	return ThreadBans;
};