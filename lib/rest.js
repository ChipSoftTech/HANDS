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
  

 var bson = require("bson");
 var BSON = bson.BSONPure.BSON;

  debug("rest.js is loaded");

/****************************************
 * Create
 ****************************************/
server.post('/api/v1/:db/:collection', function (req, res, next) {
  debug("POST-request received");
  if (req.params) {
    MongoClient.connect(util.connectionURL(req.params.db, config), function (err, db) {
      var collection = db.collection(req.params.collection);
      // We only support inserting one document at a time
	  var dbName = req.params.db;
	  var colName = req.params.db;
	  var n = next;
      collection.insert(Array.isArray(req.params) ? req.params[0] : util.cleanParams(req.params, 'post'), function (err, docs) {
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
					 message: "The request could not be understood by the server due to malformed syntax."
					}				
				);
				db.close();	
			}
			
		}  else {		  
			res.header('Location', '/api/v1/' + dbName + '/' + colName + '/' + docs.ops[0]._id.toString());
			res.set('content-type', 'application/json; charset=utf-8');
			res.json(201, {"ok": 1});
			db.close();
		}
      });
    });
  } else {
    res.set('content-type', 'application/json; charset=utf-8');
    res.json(200, {"ok": 0});
  }
  
   next();
});


/****************************************
 * Read
 ****************************************/
function handleGet(req, res, next) {
  debug("GET-request received");

  var query;
  // Providing an id overwrites giving a query in the URL
  if (req.params.id) {
	  if(BSON.ObjectID.isValid(req.params.id)) {
		query = {
		  '_id': new BSON.ObjectID(req.params.id)
		};
	  } else {
		query = {
		  '_id': req.params.id
		};
	  }
  } else {
    query = req.query.query ? util.parseJSON(req.query.query, next, restify) : {};
  }
  var options = {};

  if(req.params.options){
	  options = util.parseJSON(req.params.options);
  };

  //var test = ['limit', 'sort', 'fields', 'skip', 'hint', 'explain', 'snapshot', 'timeout'];

  var v;
  for (v in req.query) {
    if (v != "query" && v!= "options") {
		options[v] = req.query[v];
		options[v] = JSON.parse(options[v]);
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

  MongoClient.connect(util.connectionURL(req.params.db, config), function (err, db) {
    db.collection(req.params.collection, function (err, collection) {
		collection.find(query, options, function (err, cursor) {  
        cursor.toArray(function (err, docs) {
          var result = [];
          if (req.params.id) {
            if (docs.length > 0) {
              result = docs[0];
              res.json(result, {'content-type': 'application/json; charset=utf-8'});
            } else {
              res.json(404);
            }
          } else {
            docs.forEach(function (doc) {
              result.push(doc);
            });
            res.json(result, {'content-type': 'application/json; charset=utf-8'});
          }
          db.close();
        });
      });
    });
  });
  
  next();
}

// Read routes use handleGet method
server.get('/api/v1/:db/:collection/:id?', handleGet);
server.get('/api/v1/:db/:collection', handleGet);


/****************************************
 * Update
 ****************************************/
server.put('/api/v1/:db/:collection/:id', function (req, res, next) {
  debug("PUT-request received");
  
  
  var spec;
  
  if(BSON.ObjectID.isValid(req.params.id)) {
	spec = {
	  '_id': new BSON.ObjectID(req.params.id)
	};
  } else {
	spec = {
	  '_id': req.params.id
	};
  }	
  
  MongoClient.connect(util.connectionURL(req.params.db, config), function (err, db) {
    db.collection(req.params.collection, function (err, collection) {

	  var query;
	  // Providing an id overwrites giving a query in the URL
	  if (req.params.id) {
		  if(BSON.ObjectID.isValid(req.params.id)) {
			query = {
			  '_id': new BSON.ObjectID(req.params.id)
			};
		  } else {
			query = {
			  '_id': req.params.id
			};
		  }		  
	  } else {
		query = req.query.query ? util.parseJSON(req.query.query, next, restify) : {};
	  }
	  
	  var options = req.params.options || {};
	
	  collection.find(query, options, function (err, cursor) {  
        cursor.toArray(function (err, docs) {
          var result = [];
          if (req.params.id) {
            if (docs.length > 0) {
              result = docs[0];

			  var updProd = util.merge(util.cleanParams(result),util.cleanParams(req.params));  
			  
			collection.update(spec, updProd, true, function (err, docs) {
				res.set('content-type', 'application/json; charset=utf-8');
				res.json({"ok": 1});
			});				  
            } else {
              res.json(404);
            }
          } else {
            res.json(404);
          }		  
        });
      });  //collection.find
    });  //db.collection
  });  //MongoClient.connect
  
  next();
});

/****************************************
 * Delete
 ****************************************/
server.del('/api/v1/:db/:collection/:id', function (req, res, next) {
  debug("DELETE-request received");
  
  var query;
  
  if(BSON.ObjectID.isValid(req.params.id)) {
	query = {
	  '_id': new BSON.ObjectID(req.params.id)
	};
  } else {
	query = {
	  '_id': req.params.id
	};
  }	
	
  MongoClient.connect(util.connectionURL(req.params.db, config), function (err, db) {
    db.collection(req.params.collection, function (err, collection) {
      collection.remove(query, function (err, docs) {
        res.set('content-type', 'application/json; charset=utf-8');
        res.json({"ok": 1});
        db.close();
      });
    });
  });
  
  next();
});
