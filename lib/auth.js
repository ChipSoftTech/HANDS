/*****************************************************************************
 * Copyright 2015 Chippewa Software Technology, LLC. All Rights Reserved.
 *
 * auth.js
 * HANDS
 *****************************************************************************/

var MongoClient = require("mongodb").MongoClient,
  server = module.parent.exports.server,
  config = module.parent.exports.config,
  debug = module.parent.exports.debug,
  restify = module.parent.exports.restify,
  jwt = module.parent.exports.jwt,
  util = require(__dirname + "/util").util;

 var bson = require("bson");
 var BSON = bson.BSONPure.BSON;

  
debug("auth.js is loaded");

server.post('/api/v1/:_channel/hands/tokens', function (req, res, next) {
  debug("GET-auth received");
  
  // sign with default (HMAC SHA256) 
  debug("Current token: " + req.currentToken);

    var payload = {
		"iss": "chipsofttech.com",
		"company": "Chippewa Software Technology, LLC",
		"email": "briancarter@chipsofttech.com",
		"permissions": {}
	};
	
	payload.permissions[req.params._newchannel] = {"admin":1, "create": 1, "read": 1, "update": 1, "delete": 1};
	
	var token = jwt.sign(payload, 'shhhhh');

	res.set('content-type', 'application/json; charset=utf-8');
	res.json(200, {"jwt": "Bearer " + token});

  next();	
});

/****************************************
 * Register
 ****************************************/
server.post('/api/v1/:_channel/hands/register', function (req, res, next) {
	debug("hands register received");
	var dbName = "hands";
	var colName = "tokens";
	var channelName = req.params._channel;  
		  
	req.params._id = req.params.email;
	req.params.permissions = {};
	  
    MongoClient.connect(util.connectionURL(dbName, config), function (err, db) {
      var collection = db.collection(colName);
	  
      collection.insert(Array.isArray(req.params) ? util.cleanParams(req.params[0], 'post') : util.cleanParams(req.params, 'post'), function (err, docs) {
		if(err) {
			if(err.code == 11000) {
				res.set('content-type', 'application/json; charset=utf-8');
				res.json(409, 					
					{code: "Conflict",
					 message: "duplicate key error"
					}
				);

				db.close();
			} else {
				res.set('content-type', 'application/json; charset=utf-8');
				res.json(400, 
					{code: "Bad Request",
					 message: "The request could not be understood by the server."
					}				
				);
				db.close();	
			}
			
		}  else {		  
			res.header('Location', '/api/v1/' + channelName + '/' + dbName + '/' + colName + '/' + docs.ops[0]._id.toString());
			res.set('content-type', 'application/json; charset=utf-8');
			res.json(201, {"ok": 1});
			db.close();
		}
      });
    });

  
   next();
});

