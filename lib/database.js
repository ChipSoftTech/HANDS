/*****************************************************************************
 * Copyright 2015 Chippewa Software Technology, LLC. All Rights Reserved.
 *
 * db.js
 * HANDS
 *****************************************************************************/

var MongoClient = require("mongodb").MongoClient;
var config = module.parent.parent.exports.config;
var debug = module.parent.parent.exports.debug;
var restify = module.parent.parent.exports.restify;
var util = require("./util").util;
var bson = require("bson");
var BSON = bson.BSONPure.BSON;

debug("db.js is loaded");

var self = module.exports.database = {
	create : function (channel, databaseName, collectionName, doc, email, callback) {
		MongoClient.connect(util.connectionURL(databaseName, config), function (err, db) {
			if (err) {
				return callback(err);
			}

			var collection = db.collection(collectionName);
			
			util.cleanDoc(doc);

			doc._channel = channel;
			doc._createdby = email;
			doc._createdon = new Date().getTime();

			collection.insert(util.cleanDoc(doc), function (err, docs) {
				if (err) {
					return callback(err);
				}

				db.close();

				callback(null, {
					"_id" : docs.ops[0]._id.toString()
				})
			});
		})
	},
	read : function (params, callback) {
		var query = {};
		// Providing an id overwrites giving a query in the URL
		if (params._id) {
			if (util.validObjectID(params._id)) {
				query = {
					'_id' : new BSON.ObjectID(params._id),
					'_channel' : params._channel
				};
			} else {
				query = {
					'_id' : params._id,
					'_channel' : params._channel
				};
			}
		} else {
			if (params.query) {
				query = util.parseJSON2(params.query);
			}

			if (query.err) {
				return callback(err);
			}

			query._channel = params._channel;
		}

		var options = {};
		var optionTypes = ['limit', 'sort', 'fields', 'skip', 'hint', 'explain', 'snapshot', 'timeout'];
		var reservedParams = ['_db', '_collection', 'query', 'options'];

		if (params.options) {
			options = util.parseJSON(params.options);
		};

		var v;
		for (v in params) {
			if (optionTypes.indexOf(v) !== -1) {
				options[v] = params[v];
			} else {
				if (reservedParams.indexOf(v) == -1) {
					query[v] = params[v];
				}
			}
		}

		debug("query: " + JSON.stringify(query));
		debug("options: " + JSON.stringify(options));

		MongoClient.connect(util.connectionURL(params._db, config), function (err, db) {
			if (err) {
				return callback(err);
			}

			db.collection(params._collection, function (err, collection) {
				if (err) {
					return callback(err);
				}

				collection.find(query, options, function (err, cursor) {
					if (err) {
						return callback(err);
					}

					cursor.toArray(function (err, docs) {
						if (err) {
							return callback(err);
						}

						var result = [];
						if (params._id) {
							if (docs.length > 0) {
								result = docs[0];
							} else {
								return callback(new Error('404 Not Found'));
							}
						} else {
							docs.forEach(function (doc) {
								result.push(doc);
							});
						}

						db.close();

						callback(null, result);

					});
				});
			});
		});
	}
};
