/*****************************************************************************
 * Copyright 2015 Chippewa Software Technology, LLC. All Rights Reserved.
 *
 * rest.js
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

  
debug("rest.js is loaded");

server.get('/api/v1/auth/jwt', function (req, res, next) {
  debug("GET-auth received");
  
  // sign with default (HMAC SHA256) 
  debug("Current token: " + req.currentToken);

    var payload = {
		"iss": "chipsofttech.com",
		"company": "Chippewa Software Technology, LLC",
		"tests-tests": {create: 1, read: 1, update: 1, delete: 1},
		"testauth": {create: 1, read: 1, update: 1, delete: 1}
	}	
	
	var token = jwt.sign(payload, 'shhhhh');

	res.set('content-type', 'application/json; charset=utf-8');
	res.json(200, {"jwt": "Bearer " + token});

  next();	
});