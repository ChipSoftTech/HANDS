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

			col.insert(util.cleanParams(doc), function (err, docs) {
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
		if (tenant) {
			if (query) {
				query._tenant = tenant;
			} else {
				query = {
					"_tenant" : tenant
				};
			}
			
			if(!options) {
				options = {};
			}
		} else {
			return callback(new Error('Invalid Tenant'));
		}

		MongoClient.connect(util.connectionURL(database, config), function (err, db) {
			if (err) {
				return callback(err);
			}

			db.collection(collection, function (err, collection) {
				if (err) {
					return callback(err);
				}

				if (query._id) {
					collection.findOne(new BSON.ObjectID(query._id), function (err, doc) {
						if (err) {
							return callback(err);
						}

						db.close();

						if (!doc) {
							return callback(new Error('404 Not Found'));
						}

						return callback(null, doc);
					});
				} else {
					collection.find(query, options, function (err, cursor) {

						if (err) {
							return callback(err);
						}

						cursor.toArray(function (err, docs) {
							if (err) {
								return callback(err);
							}

							db.close();
							callback(null, docs);
						});
					});
				}

			});
		});
	},
	update : function (tenant, database, collection, query, doc, callback) {
		if (tenant) {
			if (query) {
				query._tenant = tenant;

				if (!query._id) {
					return callback(new Error('404 Not Found'));
				}
			} else {
				return callback(new Error('404 Not Found'));
			}
		} else {
			return callback(new Error('Invalid Tenant'));
		}

		this.read(tenant, database, collection, query, null, function (err, currentDoc) {
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
	delete  : function (tenant, database, collection, query, callback) {
		if (tenant) {
			if (query) {
				query._tenant = tenant;

				if (!query._id) {
					return callback(new Error('404 Not Found'));
				}
			} else {
				return callback(new Error('404 Not Found'));
			}
		} else {
			return callback(new Error('Invalid Tenant'));
		}

		this.read(tenant, database, collection, query, null, function (err, currentDoc) {
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
