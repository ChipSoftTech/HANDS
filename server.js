/*****************************************************************************
 * Copyright 2015 Chippewa Software Technology, LLC. All Rights Reserved.
 *
 * server.js
 * HANDS
 *****************************************************************************/

// add packages
var fs = require("fs"),
mongodb = require("mongodb"),
restify = module.exports.restify = require("restify"),
bunyan = require('bunyan');

// config setup from settings or file
var config = {
	"db" : {
		"port" : 27017,
		"host" : "localhost"
	},
	"server" : {
		"port" : 3000,
		"address" : "0.0.0.0"
	},
	"debug" : true
};

// setup debug
var DEBUGPREFIX = "DEBUG: ";
var debug = module.exports.debug = function (str) {
	if (config.debug) {
		console.log(DEBUGPREFIX + str);
	}
};

debug("server.js is loaded");

try {
	config = JSON.parse(fs.readFileSync(process.cwd() + "/config.json"));
} catch (e) {
	debug("No config.json file found. Fall back to default config.");
}
module.exports.config = config;

// logger daily file rotate keep
var log = bunyan.createLogger({
		name : 'HANDS',
		streams : [{
				type : 'rotating-file',
				path : 'logs/service.log',
				period : '1d', // daily rotation
				count : 10 // keep 10 back copies
			}
		],
		serializers : bunyan.stdSerializers
	});
log.info('logger setup complete');

//  json web tokens - sign with default (HMAC SHA256)
var jwt = require('jsonwebtoken');
module.exports.jwt = jwt;

// server settings
var server = restify.createServer({
		log : log,
		name : 'HANDS'
	});
module.exports.server = server;

// set the Connection header to close and remove Content-Length if cURL
server.pre(restify.pre.userAgentConnection());

// audit logging after call
server.on('after', restify.auditLogger({
		log : log
	}));

// bundle plugins
server.use(restify.acceptParser(server.acceptable));
server.use(restify.authorizationParser());
server.use(restify.dateParser());
server.use(restify.queryParser());
server.use(restify.bodyParser());
server.use(restify.jsonp());
server.use(restify.throttle({
		burst : 100,
		rate : 50,
		ip : true, // throttle based on source ip address
		overrides : {
			'127.0.0.1' : {
				rate : 0, // unlimited
				burst : 0
			}
		}
	}));

var security = require(__dirname + "/lib/security").security;

//each call gets authenticated and authorized
server.use(function authenticate(req, res, next) {
	var authorized = security.authorize(req);

	if (authorized) {
		next();
	}

	next(new restify.NotAuthorizedError());
});

var auth = require('./lib/auth');
var rest = require('./lib/rest');

//todo:  add back in require directory level, was breaking mocha tests
//var requireDirectory = require('require-directory');
//module.exports = requireDirectory(module, './custom');

// Capture '/' or any request for html, js or css files
server.get(/(^\/$)|(\.(html|js|css|json|jpg)$)/, restify.serveStatic({
		directory : './client',
	default:
		'index.html'
	}));

server.listen(config.server.port, function () {
	console.log("%s listening at %s", server.name, server.url);
	log.info('%s listening at %s', server.name, server.url);
});
