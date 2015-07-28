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

	var channelName = req.params._channel;
	var dbName = req.params._db;
	var colName = req.params._collection;
	var email =  req.query.createdby;

	database.create(channelName, dbName, colName, req.body, email, function (err, data) {
		if (err) {
			return next(new restify.BadRequestError(err.toString()));
		}

		res.header('Location', '/api/v1/' + channelName + '/' + dbName + '/' + colName + '/' + data._id);
		res.send(201, data);

		next();
	});
});

/****************************************
 * Read
 ****************************************/
function handleGet(req, res, next) {
	debug("GET-request received");

	var query;
	// Providing an id overwrites giving a query in the URL
	if (req.params._id) {
		if (util.validObjectID(req.params._id)) {
			query = {
				'_id' : new BSON.ObjectID(req.params._id),
				'_channel' : req.params._channel
			};
		} else {
			query = {
				'_id' : req.params._id,
				'_channel' : req.params._channel
			};
		}
	} else {
		query = req.query.query ? util.parseJSON(req.query.query, next, restify) : {};
		query._channel = req.params._channel;
	}
	var options = {};

	if (req.params.options) {
		options = util.parseJSON(req.params.options);
	};

	//var test = ['limit', 'sort', 'fields', 'skip', 'hint', 'explain', 'snapshot', 'timeout'];

	var v;
	for (v in req.query) {
		if (v != "query" && v != "options") {
			options[v] = req.query[v];
			//options[v] = JSON.parse(options[v]);
		}
	}

	if (req.body && req.body.toString().length > 0) {
		var body = req.body.split(",");
		if (body[0]) {
			query = util.parseJSON(body[0], next);
		}
		if (body[1]) {
			options = util.parseJSON(body[1], next);
		}
	}

	MongoClient.connect(util.connectionURL(req.params._db, config), function (err, db) {
		db.collection(req.params._collection, function (err, collection) {
			collection.find(query, options, function (err, cursor) {
				cursor.toArray(function (err, docs) {
					var result = [];
					if (req.params._id) {
						if (docs.length > 0) {
							result = docs[0];
							res.json(result, {
								'content-type' : 'application/json; charset=utf-8'
							});
						} else {
							res.json(404);
						}
					} else {
						docs.forEach(function (doc) {
							result.push(doc);
						});
						res.json(result, {
							'content-type' : 'application/json; charset=utf-8'
						});
					}
					db.close();
				});
			});
		});
	});

	next();
}

// Read routes use handleGet method
//server.get('/api/v1/:_channel/:_db/:_collection/:_id?', handleGet);
//server.get('/api/v1/:_channel/:_db/:_collection', handleGet);

server.get('/api/v1/:_channel/:_db/:_collection', function (req, res, next) {
	debug("GET-request received");

	var channelName = req.params._channel;
	var dbName = req.params._db;
	var colName = req.params._collection;

	database.read(req.params, function (err, data) {
		if (err) {
			return next(new restify.BadRequestError(err.toString()));
		}

		res.send(201, data);

		next();
	});
});

server.get('/api/v1/:_channel/:_db/:_collection/:_id?', function (req, res, next) {
	debug("GET-by id-request received");

	var channelName = req.params._channel;
	var dbName = req.params._db;
	var colName = req.params._collection;

	database.read(req.params, function (err, data) {
		if (err) {
			return next(new restify.BadRequestError(err.toString()));
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

	var spec;

	if (util.validObjectID(req.params._id)) {
		spec = {
			'_id' : new BSON.ObjectID(req.params._id),
			'_channel' : req.params._channel
		};
	} else {
		spec = {
			'_id' : req.params._id,
			'_channel' : req.params._channel
		};
	}

	MongoClient.connect(util.connectionURL(req.params._db, config), function (err, db) {
		db.collection(req.params._collection, function (err, collection) {

			var query;
			// Providing an id overwrites giving a query in the URL
			if (req.params._id) {
				if (util.validObjectID(req.params._id)) {
					query = {
						'_id' : new BSON.ObjectID(req.params._id),
						'_channel' : req.params._channel
					};
				} else {
					query = {
						'_id' : req.params._id,
						'_channel' : req.params._channel
					};
				}
			} else {
				query = req.query.query ? util.parseJSON(req.query.query, next, restify) : {};
				query._channel = req.params._channel;
			}

			var options = req.params.options || {};

			collection.find(query, options, function (err, cursor) {
				cursor.toArray(function (err, docs) {
					var result = [];
					if (req.params._id) {
						if (docs.length > 0) {
							result = docs[0];

							var updProd = util.merge(util.cleanParams(result, "update"), util.cleanParams(req.params));

							collection.update(spec, updProd, true, function (err, docs) {
								res.set('content-type', 'application/json; charset=utf-8');
								res.json({
									"ok" : 1
								});
							});
						} else {
							res.json(404);
						}
					} else {
						res.json(404);
					}
				});
			}); //collection.find
		}); //db.collection
	}); //MongoClient.connect

	next();
});

/****************************************
 * Delete
 ****************************************/
server.del('/api/v1/:_channel/:_db/:_collection/:_id', function (req, res, next) {
	debug("DELETE-request received");

	var query;

	if (util.validObjectID(req.params._id)) {
		query = {
			'_id' : new BSON.ObjectID(req.params._id),
			'_channel' : req.params._channel
		};
	} else {
		query = {
			'_id' : req.params._id,
			'_channel' : req.params._channel
		};
	}

	MongoClient.connect(util.connectionURL(req.params._db, config), function (err, db) {
		db.collection(req.params._collection, function (err, collection) {
			collection.remove(query, function (err, docs) {
				if (err) {
					res.set('content-type', 'application/json; charset=utf-8');
					res.json(400);
					db.close();
				} else {
					res.set('content-type', 'application/json; charset=utf-8');
					res.json(docs.result);
					db.close();
				}
			});
		});
	});

	next();
});
