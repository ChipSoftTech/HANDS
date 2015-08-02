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

module.exports.database = {
	create : function (channel, database, collection, doc, email, callback) {
		MongoClient.connect(util.connectionURL(database, config), function (err, db) {
			if (err) {
				return callback(err);
			}

			var col = db.collection(collection);

			util.cleanDoc(doc);

			doc._channel = channel;
			doc._createdby = email;
			doc._createdon = new Date().getTime();

			col.insert(util.cleanDoc(doc), function (err, docs) {
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
	read : function (channel, database, collection, id, email, query, options, callback) {
		var q = {};
		// Providing an id overwrites giving a q in the URL

		debug("id - " + id);

		if (id) {
			if (util.validObjectID(id)) {
				q = {
					'_id' : new BSON.ObjectID(id),
					'_channel' : channel
				};
			} else {
				q = {
					'_id' : id,
					'_channel' : channel
				};
			}
		} else {
			if (query) {
				q = util.parseJSON2(query);
			}

			if (q.err) {
				return callback(err);
			}

			q._channel = channel;
		}

		var o = {};

		if (options) {
			o = util.parseJSON(options);
		};

		MongoClient.connect(util.connectionURL(database, config), function (err, db) {
			if (err) {
				return callback(err);
			}

			db.collection(collection, function (err, collection) {
				if (err) {
					return callback(err);
				}

				collection.find(q, o, function (err, cursor) {
					if (err) {
						return callback(err);
					}

					cursor.toArray(function (err, docs) {
						if (err) {
							return callback(err);
						}

						var result = [];
						if (id) {
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
	},
	update : function (channel, database, collection, id, email, doc, callback) {
		this.read(channel, database, collection, id, email, null, null, function (err, currentDoc) {
			if (err) {
				return callback(err);
			}

			MongoClient.connect(util.connectionURL(database, config), function (err, db) {
				if (err) {
					return callback(err);
				}

				db.collection(collection, function (err, collection) {
					if (err) {
						return callback(err);
					}

					var updatedDoc = util.merge(util.cleanParams(currentDoc, "update"), util.cleanParams(doc));

					var query = {
						'_id' : currentDoc._id,
						'_channel' : currentDoc._channel
					};
					collection.update(query, updatedDoc, true, function (err, docs) {
						if (err) {
							return callback(err);
						}

						callback(null, docs);
					});

				});
			});
		});
	},
	delete  : function (channel, database, collection, id, email, callback) {
		this.read(channel, database, collection, id, email, null, null, function (err, currentDoc) {
			if (err) {
				return callback(err);
			}

			MongoClient.connect(util.connectionURL(database, config), function (err, db) {
				if (err) {
					return callback(err);
				}

				db.collection(collection, function (err, collection) {
					if (err) {
						return callback(err);
					}

					var query = {
						'_id' : currentDoc._id
					};

					collection.remove(query, function (err, docs) {
						if (err) {
							return callback(err);
						}

						callback(null, docs);
					});
				});
			});
		});
	}
}
