var config = require('../config/config')
	, Cloudant = require('cloudant')
	, https = require('https')
	;

module.exports = {
	startSyncRequest : function(callback) {
		Cloudant({account: config.cloudant.username, password: config.cloudant.password}, function(err, cloudant) {
			if (!err) {
				var db = cloudant.db.use(config.cloudant.base);
				db.insert({ type: "syncrequest", date: Date.now() }, "", function(errorInsertingSyncRequest, body){
					if (!errorInsertingSyncRequest){
						console.log("Sync Request Started with id: ", body);
						callback(null, body);
					} else {
						console.error("Error creating Sync Request ", errorInsertingSyncRequest);
						callback({
							"status" : 500,
							"message" : "Error creating Sync Request " + errorInsertingSyncRequest
						}, null);
					}
				});
			} else {
				console.error("Error connecting to " + config.cloudant.base + " database: ", err);
				callback({
					"status" : 500,
					"message" : "Error connecting to " + config.cloudant.base + " database: " + err
				}, null);
			}
		});
	}
	, closeSyncRequest : function(syncRequest, results, callback) {
		Cloudant({account: config.cloudant.username, password: config.cloudant.password}, function(err, cloudant) {
			if (!err) {
				var db = cloudant.db.use(config.cloudant.base);
				syncClosed = { 
					_id: syncRequest.id, 
					_rev: syncRequest.rev, 
					type: "syncrequest", 
					date: Date.now(),
					results: results
				}
				db.insert(syncClosed, function(errorInsertingSyncRequest, body){
					if (!errorInsertingSyncRequest){
						console.log("Sync Request closed with body: ", body);
						callback(null, body);
					} else {
						console.error("Error Closing Sync Request ", errorInsertingSyncRequest);
						callback({
							"status" : 500,
							"message" : "Error Closing Sync Request " + errorInsertingSyncRequest
						}, null);
					}
				});
			} else {
				console.error("Error connecting to " + config.cloudant.base + " database: ", err);
				callback({
					"status" : 500,
					"message" : "Error connecting to " + config.cloudant.base + " database: " + err
				}, null);
			}
		});
	}
	, insertSyncRecord :  function(idBrassring, idTrabajando, idSyncRequest, title, callback){
		//console.log("Insertando registro de job sincronizado brassring: ", idBrassring, " Trabajando.com: ", idTrabajando);
		Cloudant({account: config.cloudant.username, password: config.cloudant.password}, function(err, cloudant) {
			if (!err) {
				var db = cloudant.db.use(config.cloudant.base);
				var syncRecord = {
					type : "syncRecord",
					title: title,
					idBrassring : idBrassring,
					idTrabajando : idTrabajando,
					lastUpdate : Date.now(),
					lastAction : "created",
					actions : [
						{
							type: "created",
							idSyncRequest: idSyncRequest,
							date: Date.now()
						}
					]
				}
				db.insert(syncRecord, "", function(errorInsertingSyncRecord, body){
					if (!errorInsertingSyncRecord){
						callback(null, body);
					} else {
						console.error("Error creating Sync Record ", errorInsertingSyncRecord);
						callback({
							"status" : 500,
							"message" : "Error creating Sync Record " + errorInsertingSyncRecord
						}, null);
					}
				});
			} else {
				console.error("Error connecting to " + config.cloudant.base + " database: ", err);
				callback({
					"status" : 500,
					"message" : "Error connecting to " + config.cloudant.base + " database: " + err
				}, null);
			}
		});
	}
	, updateSyncRecord :  function(syncRecord, idSyncRequest, callback){
		//console.log("Actualizando registro de job sincronizado brassring: ", syncRecord);
		Cloudant({account: config.cloudant.username, password: config.cloudant.password}, function(err, cloudant) {
			if (!err) {
				var db = cloudant.db.use(config.cloudant.base);
				syncRecord.lastUpdate = Date.now();
				syncRecord.lastAction = "updated";
				syncRecord.actions.push({
							type: "updated",
							idSyncRequest: idSyncRequest,
							date: Date.now()
						});
				db.insert(syncRecord, function(errorUpdatingSyncRecord, body){
					if (!errorUpdatingSyncRecord){
						callback(null, body);
					} else {
						console.error("Error updating Sync Record ", errorUpdatingSyncRecord);
						callback({
							"status" : 500,
							"message" : "Error updating Sync Record " + errorUpdatingSyncRecord
						}, null);
					}
				});
			} else {
				console.error("Error connecting to " + config.cloudant.base + " database to update syncRecord: ", err);
				callback({
					"status" : 500,
					"message" : "Error connecting to " + config.cloudant.base + " database to update syncRecord: " + err
				}, null);
			}
		});
	}
	, validateRecord : function(idBrassring, callback){
		//console.log("Validando id: ", idBrassring);
		https.get(config.cloudant.url + '/kenexasync/_design/jobs/_view/byBrassringId?key="' + idBrassring + '"', 
			function(response) {
		        // Continuously update stream with data
		        var body = '';
		        response.on('data', function(d) {
		            body += d;
		        });
		        response.on('end', function() {
		        	if (response.statusCode == 200) {
			        	var parsed = JSON.parse(body);

			            if (parsed.rows.length <= 0){
			            	callback(null, false);
			            } else {
			            	callback(null, parsed.rows[0].value);
			            }
		        	} else {
		        		console.error("Error searching syncRecord in cloudant view: ", body);
		        		callback({
							"status" : 500,
							"message" : "Error searching syncRecord in cloudant view, status meddage of get: " + response.statusCode + ", message: " + body
						}, null);
		        	}
		        });
		        response.on('error', function(err){
		        	console.error('Error validating if Brassring Req has been synced before: ', err);
			        callback({
						"status" : 500,
						"message" : "Error validating if Brassring Req has been synced before: " + err
					}, null);
		        });
    		}
    	).end();
	}
}