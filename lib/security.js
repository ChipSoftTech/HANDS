/*****************************************************************************
 * Copyright 2015 Chippewa Software Technology, LLC. All Rights Reserved.
 *
 * security.js
 * HANDS
 *****************************************************************************/

var MongoClient = require("mongodb").MongoClient,
server = module.parent.exports.server,
config = module.parent.exports.config,
debug = module.parent.exports.debug,
restify = module.parent.exports.restify,
jwt = module.parent.exports.jwt;

debug("security.js is loaded");

var self = module.exports.security = {
	securityValue : function (channel, method) {
		//check channel security
		var securitychannel = channel.slice(-4);
		var value = 0;

		switch (method) {
		case "POST": //Create
			value = securitychannel.slice(0, 1);
			break;
		case "GET": //Read
			value = securitychannel.slice(1, 2);
			break;
		case "PUT": //Update
			value = securitychannel.slice(2, 3);
			break;
		case "DELETE": //Delete
			value = securitychannel.slice(3, 4);
			break;
		default:
			break;
		}

		return value;
	},
	authorize : function (req) {
		//security value
		// last 4 digits of channel are the security access
		// 0 = private access, jwt permission required
		// 1 = current user access, only current user's item access, jwt for email required (createdby)
		// 2 = public, no jwt permission required
		var channel = req.params._channel;
		var value = self.securityValue(channel, req.method);

		// channel is not private so return security value
		if (value == 2) {
			return value;
		}

		var authorized = -1; //not authorized default

		// private channel, check jwt for permission
		if (req.params._channel && req.method && req.headers && req.headers.authorization) {
			var parts = req.headers.authorization.split(' ');
			if (parts.length == 2) {
				var scheme = parts[0]
					var credentials = parts[1];

				if (/^Bearer$/i.test(scheme)) {
					token = credentials;

					try {
						var decoded = jwt.verify(token, 'shhhhh');
						req._currentToken = decoded;

						if (decoded.permissions[channel] && decoded.permissions[channel].admin) {
							//Admins have full rights to the channel
							req._isAdmin = true;
						} else {
							req._isAdmin = false;
						}

						debug('value - ' + value);

						if (value == 1) {
							//has access to documents created by caller
							if(!req._isAdmin) {
								req._onlyCreatedby = req._currentToken.email;
							}
							return value;
						} else { //private access, check for permission in claim
							if (decoded.permissions[channel]) {
								if (req._isAdmin) {
									//Admins have full rights to the channel
									authorized = value;
								} else {
									//non admins must have claim for value 0 access
									switch (req.method) {
									case "POST": //Create
										if (decoded.permissions[channel].create) {
											authorized = value;
										}
										break;
									case "GET": //Read
										if (decoded.permissions[channel].read) {
											authorized == value;
										}
										break;
									case "PUT": //Update
										if (decoded.permissions[channel].update) {
											authorized = value;
										}
										break;
									case "DELETE": //Delete
										if (decoded.permissions[channel].delete ) {
											authorized = value;
										}
										break;
									default:
										// do nothing so not auth will trigger below
										break;
									}
								}
							}
						}

					} catch (err) {
						debug.log("security err: " + err);
						//suppress, below will return not authorized
					}
				}
			}
		}

		return authorized;
	}
};
