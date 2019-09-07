/*
	Basic Commands
*/

let https = require('https');
const fetch = require("node-fetch");
const request = require("request");

Settings.addPermissions(['say']);

exports.commands = {


	credits: 'about',
	bot: 'about',
	about: function () {
		this.restrictReply("**" +Settings.package.botname+ "** running on Node.js version __12.6.0.__ by __" +Settings.package.owner+ "__. Forked from Node Bot by Ecuacion");
	},

	// git: 'github',
	// github: function () {
	// 	if (Settings.package.repository) this.restrictReply(Tools.stripCommands(Settings.package.repository.url), 'info');
	// },

	// guide: 'help',
	// botguide: 'help',
	// help: function () {
	// 	this.restrictReply(this.trad('guide') + ': ' + (Config.botguide || (Settings.package.homepage + "/blob/master/commands/README.md")), 'info');
	// },

	bottime: 'time',
	time: function () {
		var f = new Date();
		this.restrictReply("**" + this.trad('time') + ":** __" + f.toString() + "__", 'info');
	},

	uptime: function () {
		var text = '';
		text += '**Uptime:** ';
		var divisors = [52, 7, 24, 60, 60];
		var units = [this.trad('week'), this.trad('day'), this.trad('hour'), this.trad('minute'), this.trad('second')];
		var buffer = [];
		var uptime = ~~(process.uptime());
		do {
			var divisor = divisors.pop();
			var unit = uptime % divisor;
			if (!unit) {
				units.pop();
				uptime = ~~(uptime / divisor);
				continue;
			}
			buffer.push(unit > 1 ? unit + ' ' + units.pop() + 's' : unit + ' ' + units.pop());
			uptime = ~~(uptime / divisor);
		} while (uptime);

		switch (buffer.length) {
		case 5:
			text += buffer[4] + ', ';
			text += buffer[3] + ', ';
			text += buffer[2] + ', ' + buffer[1] + ', ' + this.trad('and') + ' ' + buffer[0];
			break;
		case 4:
			text += buffer[3] + ', ';
			text += buffer[2] + ', ' + buffer[1] + ', ' + this.trad('and') + ' ' + buffer[0];
			break;
		case 3:
			text += buffer[2] + ', ' + buffer[1] + ', ' + this.trad('and') + ' ' + buffer[0];
			break;
		case 2:
			text += buffer[1] + ' ' + this.trad('and') + ' ' + buffer[0];
			break;
		case 1:
			text += buffer[0];
			break;
		}
		this.restrictReply(text, 'info');
	},

	seen: function (arg, by, room, cmd) {
		var text = '';
		arg = toId(arg);
		if (!arg || arg.length > 18) return this.pmReply(this.trad('inv'));
		if (arg === toId(Bot.status.nickName)) return this.pmReply(this.trad('bot'));
		if (arg === toId(by)) return this.pmReply(this.trad('self'));
		var dSeen = Settings.userManager.getSeen(arg);
		if (dSeen) {
			text += '**' + (dSeen.name || arg).trim() + '** ' + this.trad('s1') + ' __' + Tools.getTimeAgo(dSeen.time, this.language).trim() + (this.trad('s2') ? ('__ ' + this.trad('s2')) : '__');
			if (dSeen.room) {
				switch (dSeen.action) {
					case 'j':
						text += ', ' + this.trad('j') + ' <<' + dSeen.room + '>>';
						break;
					case 'l':
						text += ', ' + this.trad('l') + ' <<' + dSeen.room + '>>';
						break;
					case 'c':
						text += ', ' + this.trad('c') + ' <<' + dSeen.room + '>>';
						break;
					case 'n':
						text += ', ' + this.trad('n') + ' **' + dSeen.args[0] + '**';
						break;
				}
			}
		} else {
			text += this.trad('n1') + ' ' + arg + ' ' + this.trad('n2');
		}
		this.pmReply(text);
	},

	publicalts: 'alts',
	alts: function (arg) {
		var text = '';
		arg = toId(arg);
		if (!arg || arg.length > 18) return this.pmReply(this.trad('inv'));
		var alts = Settings.userManager.getAlts(arg);
		if (alts && alts.length) {
			if (this.can("alts")) {
				var cmds = [];
				var toAdd;
				text += this.trad('alts') + " " + Settings.userManager.getName(arg) + ": ";
				for (var i = 0; i < alts.length; i++) {
					toAdd = alts[i] + (i < alts.length - 1 ? ", " : "");
					if ((text + toAdd).length > 300) {
						cmds.push(text);
						text = "";
					}
					text += toAdd;
				}
				if (text.length) cmds.push(text);
			//	this.pmReply(cmds);
				this.restrictReply(cmds);
				return;
			} else {
				if (alts.length <= 10) {
					text += this.trad('alts') + " " + Settings.userManager.getName(arg) + ": " + alts.join(", ");
				} else {
					var fAlts = [];
					for (var i = alts.length - 1; i >= 0 && i > alts.length - 10; i--) {
						fAlts.push(alts[i]);
					}
					text += this.trad('alts') + " " + Settings.userManager.getName(arg) + ": " + fAlts.join(", ") + ", (" + (alts.length - 10) + this.trad('more') + ")";
				}
			}
		} else {
			text += this.trad('n') + ' ' +  Settings.userManager.getName(arg);
		}
	//	this.pmReply(text);
		this.restrictReply(text);
	},

	say: function (arg) {
		if (!arg) return;
		if (!this.can('say')) return;
		this.reply(Tools.stripCommands(arg));
	},

	rank: function(arg, by, room, cmd) {
		var text = '';
		var omg = '';
		if (!this.can('say')) {
			this.pmReply("You need to be atleast + rank to use the command");
		} else {
			if(!arg) {
				arg = by;
				if(arg.indexOf('#') || arg.indexOf('&') || arg.indexOf('*') || arg.indexOf('@') || arg.indexOf('%') || arg.indexOf('$') || arg.indexOf('+')) {
					arg = arg.substr(1);
				}
			//	this.reply("Checking for " + arg);
			} 

			fetch('https://pokemonshowdown.com/users/' +arg+ '.json')
			  .then(
			  	response => {
			  		if(response.status != 200) {
			  			console.log("Error fetching data");
			  			return;
			  		}

			  		response.json().then(data => {
			  			console.log(data);
			  			// Get ratings for every tier played by user
			  			var battleRanks = data.ratings;
			  			var points = '';
			  			points += "<table border='1' style='width: 100%; border: 1px solid black;'><thead><tr><th>Tier</th><th>ELO</th><th>GXE</th></tr></thead>";
			  			for(var tier in battleRanks) {
			  				points += "<tbody><tr><td style='padding: 10px 10px 10px 10px'>" + tier + "</td><td>" + battleRanks[tier].elo.split('.')[0].trim() + "</td><td>" + battleRanks[tier].gxe + "</td></tr>";
			  			//	points += tier + ': __' + battleRanks[tier].elo.split('.')[0].trim() + '/' + battleRanks[tier].gxe + 'GXE__ | ';
			  			}
			  			points += "</tbody></table>";
			  			text += '!addhtmlbox <center><h2>' +data.username+ '</h2></center>';
			  			text += points;
			  			this.restrictReply(text);
			  		});
			  	}
			 )
		}
	},

	crp: function(arg, by, room, cmd) {
		if (!this.can('say')) {
			this.pmReply("You need to be atleast + rank to use the command");
		} else {
			if(!arg) {
				this.restrictReply("Please provide a valid player tag. **Command Usage**: ``.crp [tag]``");
			}
		}

		fetch('https://api.royaleapi.com/player/' +arg, { method: 'GET', headers: {auth: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Mjc2MywiaWRlbiI6IjU3NjY5NTk2ODM5ODA0OTI4MCIsIm1kIjp7InVzZXJuYW1lIjoiU3RlYWwiLCJkaXNjcmltaW5hdG9yIjoiNzg2MyIsImtleVZlcnNpb24iOjN9LCJ0cyI6MTU2Nzg2NTExMTU2N30.vhgYLtJHzE5Eu4LXBHczai36l99q-uZUR3DzI1k_5Og'}})
			.then(
				response => {
			  		if(response.status != 200) {
			  			console.log("Error fetching data");
			  			return;
			  		}

			  		response.json().then(data=> {
			  		//	console.log(data);
			  		var text = '';
			  		text += '!addhtmlbox <center><h1>' +data.name+ ' <small>(Level: ' +data.stats.level+ ')</small></h1><p>Player Tag: #' +data.tag+ '</p><p>Trophy Count: ' +data.trophies+ '</p><p>Arena: ' +data.arena.name+ '</p><p>Current Favorite Card <br><img src=' +data.stats.favoriteCard.icon+ ' height="100" width="80"></p></center>'
			  		this.restrictReply(text);
			  		});
			  	}
			)
	},

	// crp: function(arg, by, room, cmd) {
	// 	if (!this.can('say')) {
	// 		this.pmReply("You need to be atleast + rank to use the command");
	// 	} else {
	// 		if(!arg) {
	// 			this.restrictReply("Please provide a valid player tag. **Command Usage**: ``.crp [tag]``");
	// 		}
	// 	}

	// 	var options = { 
	// 		method: 'GET',
	// 		url: 'https://api.royaleapi.com/player/' +arg,
	// 		headers: { auth: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Mjc2MywiaWRlbiI6IjU3NjY5NTk2ODM5ODA0OTI4MCIsIm1kIjp7InVzZXJuYW1lIjoiU3RlYWwiLCJkaXNjcmltaW5hdG9yIjoiNzg2MyIsImtleVZlcnNpb24iOjN9LCJ0cyI6MTU2Nzg2NTExMTU2N30.vhgYLtJHzE5Eu4LXBHczai36l99q-uZUR3DzI1k_5Og' }
	// 	};

	// 	request(options, function (error, response, body) {
	// 		  if (error) throw new Error(error);

	// 		  this.restrictReply(body.name);
	// 		});
	// }
};