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

module.exports.security = {
	authorize : function (req) {
		var tenant = req.params._tenant;
		var authorized = 0; //not authorized default
		
		return 1;

		// check jwt for permission
		if (req.params._tenant && req.method && req.headers && req.headers.authorization) {
			var parts = req.headers.authorization.split(' ');
			if (parts.length == 2) {
				var scheme = parts[0]
					var claims = parts[1];

				if (/^Bearer$/i.test(scheme)) {
					try {
						var decoded = jwt.verify(claims, 'shhhhh');
						req._currentToken = decoded;

						if (decoded.permissions[tenant]) {
							req._currentToken.rights = decoded.permissions[tenant];

							if (decoded.permissions[tenant].admin) {
								//Admins have full rights to the tenant
								authorized = 1;
							} else {
								//non admins must have permission
								switch (req.method) {
								case "POST": //Create
									if (decoded.permissions[tenant].create) {
										authorized = 1;
									}
									break;
								case "GET": //Read
									if (decoded.permissions[tenant].read) {
										authorized == 1;
									}
									break;
								case "PUT": //Update
									if (decoded.permissions[tenant].update) {
										authorized = 1;
									}
									break;
								case "DELETE": //Delete
									if (decoded.permissions[tenant].delete ) {
										authorized = 1;
									}
									break;
								default:
									// do nothing so not auth will trigger below
									break;
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
