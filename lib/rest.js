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
function postV1(req, res, next) {
	debug("POST-request received");

	database.create(req.params._tenant, req.params._db, req.params._collection, req.body, function (err, data) {
		if (err) {
			return next(new restify.BadRequestError(err.toString()));
		}

		res.header('Location', '/api/v1/' + req.params._tenant + '/' + req.params._db + '/' + req.params._collection + '/' + data._id);
		res.send(201, data);

		return next();
	});
}

var PATH = '/api/:_tenant/:_db/:_collection';
server.post({
	path : PATH,
	version : ['1.0.0', '1.0.1']
}, postV1);

/****************************************
 * Read all
 ****************************************/
function getV1(req, res, next) {
	debug("GET-request received");

	database.read(req.params._tenant, req.params._db, req.params._collection, req.query.query, req.query.options, function (err, data) {
		if (err) {
			return next(new restify.BadRequestError(err.toString()));
		}

		res.send(200, data);
		return next();
	});
}

var PATH = '/api/:_tenant/:_db/:_collection';
server.get({
	path : PATH,
	version : '1.0.0'
}, getV1);

/****************************************
 * Read by id
 ****************************************/
function getByIdV1(req, res, next) {
	debug("GET-by id-request received");

	if (req.query.query) {
		req.query.query._id = req.params._id;
	} else {
		req.query.query = {
			"_id" : req.params._id
		};
	}

	database.read(req.params._tenant, req.params._db, req.params._collection, req.query.query, req.query.options, function (err, data) {
		if (err) {
			if (err == "Error: 404 Not Found") {
				return next(new restify.NotFoundError(err.toString()));
			} else {
				return next(new restify.BadRequestError(err.toString()));
			}
		}

		res.send(200, data);
		return next();
	});
}

var PATH = '/api/:_tenant/:_db/:_collection/:_id?';
server.get({
	path : PATH,
	version : '1.0.0'
}, getByIdV1);

/****************************************
 * Update
 ****************************************/
function updateV1(req, res, next) {
	debug("PUT-request received");

	if (req.query.query) {
		req.query.query._id = req.params._id;
	} else {
		req.query.query = {
			"_id" : req.params._id
		};
	}

	database.update(req.params._tenant, req.params._db, req.params._collection, req.query.query, req.body, function (err, data) {
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
}

var PATH = '/api/:_tenant/:_db/:_collection/:_id';
server.put({
	path : PATH,
	version : '1.0.0'
}, updateV1);

/****************************************
 * Delete
 ****************************************/
function deleteV1(req, res, next) {
	debug("DELETE-request received");

	if (req.query.query) {
		req.query.query._id = req.params._id;
	} else {
		req.query.query = {
			"_id" : req.params._id
		};
	}

	database.delete (req.params._tenant, req.params._db, req.params._collection, req.query.query, function (err, data) {
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
}

var PATH = '/api/:_tenant/:_db/:_collection/:_id';
server.del({
	path : PATH,
	version : '1.0.0'
}, deleteV1);
