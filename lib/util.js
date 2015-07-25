/*****************************************************************************
 * Copyright 2015 Chippewa Software Technology, LLC. All Rights Reserved.
 *
 * util.js
 * HANDS
 *****************************************************************************/
 
var mongo = require("mongodb"),
  config = module.parent.parent.exports.config,
  debug = module.parent.parent.exports.debug;

  debug("util.js is loaded");

module.exports.util = {
  cleanParams: function (params, reqtype) {
    var clean = params;
    if (reqtype != 'post' && clean.id) {
      delete clean.id;
    }
    if (clean._db) {
      delete clean._db;
    }
    if (clean._collection) {
      delete clean._collection;
    }
	
    return clean;
  },
  parseJSON: function (data, next, restify) {
    var json;
    try {
      json = JSON.parse(data);
    } catch (e) {
      return next(new restify.InvalidArgumentError("Not valid JSON data."));
    }
    return json;
  },
  connectionURL: function (dbName, config) {
    var auth = "";
    if (config.db.username && config.db.password) {
      auth = config.db.username + ":" + config.db.password + "@";
    }
    return "mongodb://" + auth + config.db.host + ":" + config.db.port + "/" + dbName; // + "?maxPoolSize=20";
  },
  
	// Returns merged JSON.
	//
	// Eg.
	// merge( { a: { b: 1, c: 2 } }, { a: { b: 3, d: 4 } } )
	// -> { a: { b: 3, c: 2, d: 4 } }
	//
	// @arguments JSON's
	// 
	merge: function() {
		var self = this;
		
		var destination = {},
			sources = [].slice.call( arguments, 0 );
		sources.forEach(function( source ) {
			var prop;
			for ( prop in source ) {
				if ( prop == "_id") {
					
				} else if ( prop in destination && Array.isArray( destination[ prop ] ) ) {					
					// Concat Arrays
					destination[ prop ] = destination[ prop ].concat( source[ prop ] );					
				} else if ( prop in destination && typeof destination[ prop ] === "object" ) {					
					// Merge Objects
					destination[ prop ] = self.merge( destination[ prop ], source[ prop ] );					
				} else {					
					// Set new values
					destination[ prop ] = source[ prop ];					
				}
			}
		});
		return destination;
	},
	validObjectID: function(checkID) {
		var patt = new RegExp("^[0-9a-fA-F]{24}$");
		var res = patt.test(checkID);
		
		return res;
	}
  
  
  
};
