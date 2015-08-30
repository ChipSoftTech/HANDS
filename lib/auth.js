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

server.post('/api/v1/:_tenant/hands/tokens', function (req, res, next) {
	debug("POST Auth tokens");

	// sign with default (HMAC SHA256)
	debug("Current token: " + req.currentToken);

	var payload = {
		"iss" : "chipsofttech.com",
		"company" : "Chippewa Software Technology, LLC",
		"email" : "briancarter@chipsofttech.com",
		"permissions" : {}
	};

	payload.permissions[req.params._newtenant] = {
		"admin" : 1
	};

	var token = jwt.sign(payload, 'shhhhh');

	res.set('content-type', 'application/json; charset=utf-8');
	res.json(200, {
		"jwt" : "Bearer " + token
	});

	next();
});

/****************************************
 * Register
 ****************************************/
server.post('/api/v1/:_tenant/hands/register', function (req, res, next) {
	debug("hands register received");

	req.body._id = req.params.email;
	req.params._createdby = req.params.email;
	req.body.permissions = {};

	database.create(req.params._tenant, "hands", "tokens", req.body, req.params._createdby, function (err, data) {
		if (err) {
			return next(new restify.BadRequestError(err.toString()));
		}

		res.header('Location', '/api/v1/' + req.params._tenant + '/' + req.params._db + '/' + req.params._collection + '/' + data._id);
		res.send(201, data);

		next();
	});

});

/****************************************
 * Add Permissions
 ****************************************/
server.post('/api/v1/:_tenant/hands/tokens/:_id?', function (req, res, next) {
	debug("GET-auth received");

	// sign with default (HMAC SHA256)
	debug("Current token: " + req.currentToken);

	var payload = {
		"iss" : "chipsofttech.com",
		"company" : "Chippewa Software Technology, LLC",
		"email" : "briancarter@chipsofttech.com",
		"permissions" : {}
	};

	payload.permissions[req.params._newtenant] = {
		"admin" : 1,
		"create" : 1,
		"read" : 1,
		"update" : 1,
		"delete" : 1
	};

	var token = jwt.sign(payload, 'shhhhh');

	res.set('content-type', 'application/json; charset=utf-8');
	res.json(200, {
		"jwt" : "Bearer " + token
	});

	next();
});

/****************************************
 * Read
 ****************************************/
server.get('/api/v1/:_tenant/hands/tokens/:_id?', function (req, res, next) {
	debug("GET-by id-request received");

	database.read(req.params._tenant, "hands", "tokens", req.params._id, null, null, null, function (err, data) {
		if (err) {
			if (err == "Error: 404 Not Found") {
				return next(new restify.NotFoundError(err.toString()));
			} else {
				return next(new restify.BadRequestError(err.toString()));
			}
		}

		res.send(201, data);
		next();
	});

});
