var express = require('express');
var router = express.Router();
var logger = require('../utils/logger');
var model = require('../models/utilsModel');
var ldapClient = require('../ldapClient');
var _ = require('underscore');

router.get('/api/supportedDbTypes', function (req, res, next) {
    model.getJsonFromFile('supported_db_types.json', function (err, data) {
        if (err) {
            return res.json({
                errorCode: "FAIL",
                message: err
            });
        }

        res.json({
            errorCode: "SUCCESS",
            message: null,
            result: data
        });
    });
});

router.get('/api/owners', function (req, res, next) {
    ldapClient.getEnvOwners(function (err, envOwners) {
        if (err) {
            //logger.log('error', err);
            return res.json({
                errorCode: "FAIL",
                message: err
            });
        }

        envOwners = _.each(envOwners, function (envOwner) {
            envOwner.user_id = envOwner.uid;
            envOwner.username = envOwner.displayName;
            return envOwner;
        });

        res.json({
            errorCode: "SUCCESS",
            message: null,
            result: envOwners
        });
    });
});

router.get('/api/dbtimezone',function(req,res,next){
    model.getTimeZone(function (err, data) {
        if (err) {
            return res.json({
                errorCode: "FAIL",
                message: err
            });
        }

        res.json({
            errorCode: "SUCCESS",
            message: null,
            result: data
        });
    });
});

module.exports = router;