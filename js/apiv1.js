//External libraries
var http = require('http');
var url = require('url');
var path = require('path');
var fs = require('fs');
var querystring = require('querystring');
var sqlite3 = require('sqlite3');

//Revealing Module Design Pattern 
//Immediately-Invoked-Function-Expression, it declares a function, which then calls itself immediately 
var apiV1 = (function () {
	var	mimeTypes = {'html': 'text/html', 'png': 'image/png', "jpeg": "image/jpeg", "jpg": "image/jpeg", 'js': 'text/javascript', 'css': 'text/css'};
		
	var msgMissingParms = '{"error": "missing parameters: ';
	var msgBadRequest = '{"error": "bad request"}';
	
	var serveFromDisk = function(filename, response) {
		var pathname;
		var stats, extension, mimeType, fileStream;		

		
		try {
			pathname = path.join(process.cwd(), unescape(filename));		
			extension = path.extname(pathname).substr(1);
			
			if(extension == null || extension == '') {
				extension = 'html';
				pathname += '.html';
			}

			mimeType = mimeTypes[extension] || 'application/octet-stream';
			stats = fs.lstatSync(pathname); // throws error if path doesn't exist
		} catch (e) {
			try {
				//remove .html, might be a directory
				pathname = pathname.slice(0,-5)
				stats = fs.lstatSync(pathname); // throws error if path doesn't exist	
			} catch (e) {
				response.writeHead(404, {'Content-Type': 'text/plain'});
				response.write('404 Not Found\n');
				response.end();
				return;
			}
		}

		if (stats.isFile()) {
			//path exists, is a file
		} else if (stats.isDirectory()) {
			//path exists, is a directory
			filename = filename + '/index.html';
			pathname = pathname  + '\\index.html';
		} else {
			// Symbolic link, other?
			response.writeHead(500, {'Content-Type': 'text/plain'});
			response.write('500 Internal server error\n');
			response.end();
		}	 


		console.log('serving ' + filename + ' as ' + mimeType);
		
		//cache for 10 minutes local, shared cache 1 hour  -- or use without cache for dev debugging	
		response.writeHead(200, {'Content-Type': mimeType,"Cache-Control": "public, max-age=600, s-maxage=3600"});			
		//response.writeHead(200, {'Content-Type': mimeType});
		
		fileStream = fs.createReadStream(pathname);
		fileStream.pipe(response);
	}; 
	
	var fetchTeams = function(data, callback) {
		console.log('api v1: fetchTeams');
		var jsonData = { results: [] };	
		
		jsonData.results.push({"team":"Team A"});
		jsonData.results.push({"team":"Team B"});
		
		callback(null,jsonData);
	};		
	
	//Expose methods as public
	return {
		serveFromDisk: serveFromDisk,
		fetchTeams: fetchTeams
	};
	
})();

//Export functions that are exposed for use by other modules
exports.serveFromDisk = apiV1.serveFromDisk;
exports.fetchTeams = apiV1.fetchTeams;



