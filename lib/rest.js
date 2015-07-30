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
util = require("./util").util;
database = require("./database").database;

var bson = require("bson");
var BSON = bson.BSONPure.BSON;

debug("rest.js is loaded");

/****************************************
 * Create
 ****************************************/
server.post('/api/v1/:_channel/:_db/:_collection', function (req, res, next) {
	debug("POST-request received");

	database.create(req.params._channel, req.params._db, req.params._collection, req.body, req.query.createdby, function (err, data) {
		if (err) {
			return next(new restify.BadRequestError(err.toString()));
		}

		res.header('Location', '/api/v1/' + req.params._channel + '/' + req.params._db + '/' + req.params._collection + '/' + data._id);
		res.send(201, data);

		next();
	});
});

/****************************************
 * Read
 ****************************************/
server.get('/api/v1/:_channel/:_db/:_collection', function (req, res, next) {
	debug("GET-request received");

	database.read(req.params._channel, req.params._db, req.params._collection, null , req.query.email, req.query.query, req.query.options, function (err, data) {
		if (err) {
			return next(new restify.BadRequestError(err.toString()));
		}

		res.send(201, data);

		next();
	});
});

server.get('/api/v1/:_channel/:_db/:_collection/:_id?', function (req, res, next) {
	debug("GET-by id-request received");

	database.read(req.params._channel, req.params._db, req.params._collection, req.params._id, req.query.email, req.query.query, req.query.options, function (err, data) {
		if (err) {
			if(err == "Error: 404 Not Found") {
				return next(new restify.NotFoundError(err.toString()));
			} else {
				return next(new restify.BadRequestError(err.toString()));
			}
		}	

		res.send(201, data);
		next();
	});	

});

/****************************************
 * Update
 ****************************************/
server.put('/api/v1/:_channel/:_db/:_collection/:_id', function (req, res, next) {
	debug("PUT-request received");

	database.update(req.params._channel, req.params._db, req.params._collection, req.params._id, req.query.email, req.body, function (err, data) {
		if (err) {
			if(err == "Error: 404 Not Found") {
				return next(new restify.NotFoundError(err.toString()));
			} else {
				return next(new restify.BadRequestError(err.toString()));
			}
		}	

		res.send(201, data);
		next();
	});
});

/****************************************
 * Delete
 ****************************************/
server.del('/api/v1/:_channel/:_db/:_collection/:_id', function (req, res, next) {
	debug("DELETE-request received");

	database.delete(req.params._channel, req.params._db, req.params._collection, req.params._id, req.query.email, function (err, data) {
		if (err) {
			if(err == "Error: 404 Not Found") {
				return next(new restify.NotFoundError(err.toString()));
			} else {
				return next(new restify.BadRequestError(err.toString()));
			}
		}	

		res.send(201, data);
		next();
	});
});
