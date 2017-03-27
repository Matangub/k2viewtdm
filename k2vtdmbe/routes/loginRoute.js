var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var _ = require('underscore');
var config = require('../config');
var ldapClient = require('../ldapClient');

router.get('/api/alive', function (req, res, next) {
    res.json({
        message: "I am alive"
    });
});

function createToken(user) {
    return jwt.sign(_.omit(user, 'password'), config.secret);
}

router.post('/api/login', function (req, res, next) {

    ldapClient.auth(req.body.username, req.body.password, function (err, entryObject) {
        if (err) {
            return res.json({
                errorCode: "FAIL",
                message: "Authentication Error"
            });
        }

        var user;
        var isAdmin = _.find(config.adminUsers, {uid: req.body.username});

        if (isAdmin) {
            user = {
                role: {
                    type: 'admin',
                    id: 0
                },
                user_id: entryObject.uid,
                username: req.body.username
            };
        }
        else  {
            var userType = undefined;
            if (entryObject.dn.indexOf(config.ldap.ownersGroupName) >= 0){
                userType = 'owner';
            }
            else if (entryObject.dn.indexOf(config.ldap.testersGroupName) >= 0){
                userType = 'tester';
            }
            user = {
                role: {
                    type: 'user',
                    id: 1,
                    tdmType : userType
                },
                user_id: entryObject.uid,
                username: req.body.username
            };
        }

        var token = createToken(user);
        return res.json({
            errorCode: "SUCCESS",
            message: null,
            result: {
                token: token,
                role: user.role,
                user_id: user.user_id,
                username: entryObject.displayName
            }
        });
    })
});

var getToken = function (req) {
    return req.headers['x-access-token']
};

router.use(function (req, res, next) {
    var token = getToken(req);
    if (token != null) {
        jwt.verify(token, config.secret, function (err, decoded) {
            if (err) {
                //logger.log('error', err);
                return res.json({success: false, message: 'Failed to authenticate token.'});
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;
                next();
            }
        });
    }
    else {
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });
    }
});


module.exports = router;
