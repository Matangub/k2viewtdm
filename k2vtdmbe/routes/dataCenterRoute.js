var express = require('express');
var router = express.Router();
var logger = require('../utils/logger');
var model = require('../models/dataCenterModel');
var modelUtils = require('../models/utilsModel');

/**
 * @api {get} /api/dataCenters Get Data Centers
 * @apiName GetDataCenters
 * @apiGroup Data Centers
 *
 */
router.get('/api/dataCenters', function (req, res, next) {
    model.getDataCenters(req, function (err, data) {
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

/**
 * @api {get} /api/dataCenter/:dcId Get Data Center by ID
 * @apiName GetDataCenterById
 * @apiGroup Data Centers
 *
 * @apiParam {Number} dcId - Data Center unique ID.
 */
router.get('/api/dataCenter/:dcId', function (req, res, next) {
    model.getDataCenter(req, function (err, data) {
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

/**
 * @api {post} /api/dataCenter Create Data Center
 * @apiName CreateDataCenter
 * @apiGroup Data Centers
 *
 */
router.post('/api/dataCenter', function (req, res, next) {
    model.postDataCenter(req, function (err) {
        if (err) {
            return res.json({
                errorCode: "FAIL",
                message: err
            });
        }

        var activityDesc = 'Data center ' + req.body.data_center_name + ' was created';
        modelUtils.insertActivity('create', 'Data Center', req.decoded.user_id, req.decoded.username, activityDesc, function (err) {
            if (err) {
                logger.log('error', err.message);
            }
        });

        res.json({
            errorCode: "SUCCESS",
            message: null
        });
    });
});

/**
 * @api {put} /api/dataCenter/:dcId Update Data Center
 * @apiName UpdateDataCenter
 * @apiGroup Data Centers
 *
 * @apiParam {Number} dcId - Data Center unique ID.
 */
router.put('/api/dataCenter/:dcId', function (req, res, next) {
    model.putDataCenter(req, function (err) {
        if (err) {
            return res.json({
                errorCode: "FAIL",
                message: err
            });
        }

        var activityDesc = 'Data center ' + req.body.data_center_name + ' was updated';
        modelUtils.insertActivity('update', 'Data Center', req.decoded.user_id, req.decoded.username, activityDesc, function (err) {
            if (err) {
                logger.log('error', err.message);
            }
        });

        res.json({
            errorCode: "SUCCESS",
            message: null
        });
    });
});

/**
 * @api {delete} /api/dataCenter/:dcId Delete Data Center
 * @apiName DeleteDataCenter
 * @apiGroup Data Centers
 *
 * @apiParam {Number} dcId - Data Center unique ID.
 */
router.delete('/api/dataCenter/:dcId', function (req, res, next) {
    model.deleteDataCenter(req, function (err,data_center_name) {
        if (err) {
            return res.json({
                errorCode: "FAIL",
                message: err
            });
        }

        var activityDesc = 'Data center ' + data_center_name + ' was deleted';
        modelUtils.insertActivity('delete', 'Data center', req.decoded.user_id, req.decoded.username, activityDesc, function (err) {
            if (err) {
                logger.log('error', err.message);
            }
        });


        res.json({
            errorCode: "SUCCESS",
            message: null
        });
    });
});


/**
 * @api {get} /api/datacenter/:dcId/envcount Get Environments Number Current Data Center Linked to
 * @apiName GetEnvCountPerDataCenter
 * @apiGroup Data Centers
 *
 * @apiParam {Number} dcId - Data Center unique ID.
 */
router.get('/api/datacenter/:dcId/envcount', function (req, res, next) {
    model.getDataCenterEnvironmentCount(req, function (err, data) {
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