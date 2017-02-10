var express = require('express') 
  , router = express.Router()
  , jwt = require('jsonwebtoken')
  , Controller = require('../../../controllers/syncjobs')
  , config = require('../../../config/config')
  ;

router.get('/', isLoggedIn, function(req, res) {
  Controller.syncJobs(req, res);
});

router.get('/testtrabajando', function(req, res) {
  Controller.testTrabajando(req, res);
});



// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
    
    var token = req.body.token || req.headers['x-access-token'];

    // decode token
 	if (token) {
 		// verifies secret and checks exp
 		jwt.verify(token, config.secret, function(err, decoded) {
 			if (err) {
				return res.status(401).send({
					success: false,
					message: 'Failed to authenticate token.'
				});
		 	} else {
		 		// if everything is good, save to request for use in other routes
		 		req.userData = decoded;
		 		return next();

		 	}
 		});

 	} else {

		// if there is no token
		// return an HTTP response of 403 (access forbidden) and an error message
		return res.status(401).send({
			success: false,
			message: 'No token provided.'
		});
	}
}

module.exports = router;