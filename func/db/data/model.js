module.exports = function (input) {
	const force = false;
	const Users = require("./models/Users")(input);
	const Threads = require("./models/Threads")(input);
	const Currencies = require("./models/Currencies")(input);
  const NsfwGroups = require("./models/NsfwGroups")(input);
  const ThreadBans = require("./models/ThreadBans")(input);
  const UserBans = require("./models/UserBans")(input);

	Users.sync({ force });
	Threads.sync({ force });
	Currencies.sync({ force });
  NsfwGroups.sync({ force });
  ThreadBans.sync({ force });
  UserBans.sync({ force });

	return {
		model: {
			Users,
			Threads,
			Currencies,
      NsfwGroups,
      ThreadBans,
      UserBans
		},
		use: function (modelName) {
			return this.model[`${modelName}`];
		}
	}
}