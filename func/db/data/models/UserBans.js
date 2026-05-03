module.exports = function ({ sequelize, Sequelize }) {
	const UserBans = sequelize.define('UserBans', {
		id: {
			type: Sequelize.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		userID: {
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

	return UserBans;
};