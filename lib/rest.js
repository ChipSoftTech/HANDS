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
	  var db = req.params.db;
	  var dbCol = req.params.db;
      collection.insert(Array.isArray(req.params) ? req.params[0] : util.cleanParams(req.params), function (err, docs) {
        res.header('Location', '/api/v1/' + db + '/' + dbCol + '/' + docs.ops[0]._id.toHexString());
        res.set('content-type', 'application/json; charset=utf-8');
        res.json(201, {"ok": 1});
        db.close();
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
    query = {
      '_id': new BSON.ObjectID(req.params.id)
    };
  } else {
    query = req.query.query ? util.parseJSON(req.query.query, next, restify) : {};
  }
  var options = req.params.options || {};

  var test = ['limit', 'sort', 'fields', 'skip', 'hint', 'explain', 'snapshot', 'timeout'];

  var v;
  for (v in req.query) {
    if (test.indexOf(v) !== -1) {
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
              result = util.flavorize(docs[0], "out");
              res.json(result, {'content-type': 'application/json; charset=utf-8'});
            } else {
              res.json(404);
            }
          } else {
            docs.forEach(function (doc) {
              result.push(util.flavorize(doc, "out"));
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
  var spec = {
    '_id': new BSON.ObjectID(req.params.id)
  };
  MongoClient.connect(util.connectionURL(req.params.db, config), function (err, db) {
    db.collection(req.params.collection, function (err, collection) {

	  var query;
	  // Providing an id overwrites giving a query in the URL
	  if (req.params.id) {
		query = {
		  '_id': new BSON.ObjectID(req.params.id)
		};
	  } else {
		query = req.query.query ? util.parseJSON(req.query.query, next, restify) : {};
	  }
	  
	  var options = req.params.options || {};
	
	  collection.find(query, options, function (err, cursor) {  
        cursor.toArray(function (err, docs) {
          var result = [];
          if (req.params.id) {
            if (docs.length > 0) {
              result = util.flavorize(docs[0], "out");
			
/*			
			// merge req.params/product with the server/product
			// logic similar to jQuery.extend(); to merge 2 objects.
			var updProd = {}; 
			for (var n in util.cleanParams(result)) {    //set all values to db values
				updProd[n] = result[n];
			}
			for (var n in util.cleanParams(req.params)) {  //update values passed in
				updProd[n] = req.params[n];
			}			  
*/

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
  var spec = {
    '_id': new BSON.ObjectID(req.params.id)
  };
  MongoClient.connect(util.connectionURL(req.params.db, config), function (err, db) {
    db.collection(req.params.collection, function (err, collection) {
      collection.remove(spec, function (err, docs) {
        res.set('content-type', 'application/json; charset=utf-8');
        res.json({"ok": 1});
        db.close();
      });
    });
  });
  
  next();
});
