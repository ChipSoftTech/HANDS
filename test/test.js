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
  
console.log("testCRUD Starting");	
var objectId;
var request = supertest(main.server);

/* Setting up configuration for testing */
main.debug("test.js is loaded");

main.config.flavor = "normal";
main.config.debug = true;
delete main.config.db.username;
delete main.config.db.password;

describe("Testing HANDS CRUD", function () {

	after(function (done) {
		main.server.close();
		done();
	});

	it("Should create a simple document", function (done) {
	request
	  .post('/api/v1/0tests/tests/t1')
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
		assert.equal(location[2], '0tests');
		assert.equal(location[3], 'tests');
		assert.equal(location[4], 't1');
		objectId = location[5];
		done();
	  });
	});

  
	it("Should check that document exists", function (done) {
	request
	  .get('/api/v1/0tests/tests/t1/' + objectId)
	  .type('application/json')
	  .expect(200)
	  .end(function (err, res) {
		if (err) {
		  return done(err);
		}
		
		assert.deepEqual(res.body, {
		  "test": "create",
		  "_id": objectId,
		  "_channel": "0tests"
		});
		
		done();
	  });
	});
  
	it("Should update a document", function (done) {
	request
	  .put('/api/v1/0tests/tests/t1/' + objectId)
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
	  .get('/api/v1/0tests/tests/t1/' + objectId)
	  .type('application/json')
	  .expect(200)
	  .end(function (err, res) {
		if (err) {
		  return done(err);
		}
		assert.deepEqual(res.body, {
		  "_id": objectId,
		  "test": "updated",
		  "_channel": "0tests"
		});
		done();
	  });
	});

	
	it("Should delete a document", function (done) {
	request
	  .del('/api/v1/0tests/tests/t1/' + objectId)
	  .type('application/json')	  
	  .expect(200)
	  .end(function (err, res) {
		if (err) {
		  return done(err);
		}
		assert.deepEqual(res.body,        
			{
			  "n": 1,
              "ok": 1
            }
        );
		done();
	  });
	});

	it("Should check that document is deleted", function (done) {
	request
	  .get('/api/v1/0tests/tests/t1/' + objectId)
	  .type('application/json')
	  .expect(404, done);
	});

});