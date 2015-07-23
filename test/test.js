/*****************************************************************************
 * Copyright 2015 Chippewa Software Technology, LLC. All Rights Reserved.
 *
 * test/test.js
 * HANDS
 *****************************************************************************/

var supertest = require('supertest'),
  assert = require('assert'),
  http = require('http');

var main = require('../server');
  
console.log("main: " + main);	
var objectId;
var request = supertest(main.server);

/* Setting up configuration for testing */
main.debug("test.js is loaded");

main.config.flavor = "normal";
main.config.debug = true;
delete main.config.db.username;
delete main.config.db.password;

describe("Testing HANDS", function () {

	after(function (done) {
		main.server.close();
		done();
	});

	it("Should create a simple document", function (done) {
	request
	  .post('/api/v1/tests/tests')
	  .type('application/json')
	  .send({"test" : "create"})
	  .expect(201)
	  .end(function (err, res) {
		if (err) {
		  return done(err);
		}
		assert.deepEqual(res.body, {"ok": 1});
		var location = res.header.location.split('/').slice(1);
		assert.equal(location[0], 'api');
		assert.equal(location[1], 'v1');
		assert.equal(location[2], 'tests');
		assert.equal(location[3], 'tests');
		objectId = location[4];
		done();
	  });
	});

  
	it("Should check that document exists", function (done) {
	request
	  .get('/api/v1/tests/tests/' + objectId)
	  .type('application/json')
	  .expect(200)
	  .end(function (err, res) {
		if (err) {
		  return done(err);
		}
		
		assert.deepEqual(res.body, {
		  "test": "create",
		  "_id": objectId
		});
		
		done();
	  });
	});
  
	it("Should update a document", function (done) {
	request
	  .put('/api/v1/tests/tests/' + objectId)
	  .type('application/json')
	  .send({"test" : "updated"})
	  .expect(200)
	  .end(function (err, res) {
		if (err) {
		  return done(err);
		}
		assert.deepEqual(res.body, {"ok": 1});
		done();
	  });
	});


	it("Should check that document is updated", function (done) {
	request
	  .get('/api/v1/tests/tests/' + objectId)
	  .type('application/json')
	  .expect(200)
	  .end(function (err, res) {
		if (err) {
		  return done(err);
		}
		assert.deepEqual(res.body, {
		  "_id": objectId,
		  "test": "updated",
		});
		done();
	  });
	});

	
	it("Should delete a document", function (done) {
	request
	  .del('/api/v1/tests/tests/' + objectId)
	  .type('application/json')	  
	  .expect(200)
	  .end(function (err, res) {
		if (err) {
		  return done(err);
		}
		assert.deepEqual(res.body, {"ok": 1});
		done();
	  });
	});

	it("Should check that document is deleted", function (done) {
	request
	  .get('/api/v1/tests/tests/' + objectId)
	  .type('application/json')
	  .expect(404, done);
	});

});