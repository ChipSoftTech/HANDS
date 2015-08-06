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
	create : function (tenant, database, collection, doc, callback) {
		if (tenant) {
			doc._tenant = tenant;
		} else {
			return callback(new Error('Invalid Tenant'));
		}		
		
		MongoClient.connect(util.connectionURL(database, config), function (err, db) {
			if (err) {
				return callback(err);
			}

			var col = db.collection(collection);
			util.cleanDoc(doc);

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
	read : function (tenant, database, collection, query, options, callback) {
		var q = {};

		
		if (query._id) {
			if (util.validObjectID(id)) {
				q._id = new BSON.ObjectID(id);
			} else {
				q._id = id;
			}
		} else {
			if (query) {
				q = util.parseJSON2(query);
			}

			if (q.err) {
				return callback(err);
			}
		}

		if (q._tenant) {
			q._tenant = tenant;
		} else {
			return callback(new Error('Invalid Tenant'));
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

				collection.find(query, o, function (err, cursor) {
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
	update : function (tenant, database, collection, id, doc, callback) {
		this.read(tenant, database, collection, id, null, null, function (err, currentDoc) {
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
						'_tenant' : currentDoc._tenant
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
	delete  : function (tenant, database, collection, id, callback) {
		this.read(tenant, database, collection, id, null, null, function (err, currentDoc) {
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
						'_id' : currentDoc._id,
						'_tenant' : currentDoc._tenant
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
