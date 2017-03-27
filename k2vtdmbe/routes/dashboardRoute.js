var express = require('express');
var router = express.Router();
var logger = require('../utils/logger');
var model = require('../models/dashboardModel');
var modelUtils = require('../models/utilsModel');

/**
 * @api {get} /api/tasksStatus/:interval Get task status according to a pre-defined time interval.
 * @apiName GetTaskStatus
 * @apiGroup Dashboard
 *
 * @apiParam {String} interval - Pre-Defined Time Interval: [Day, Week, Month, 3Month, Year].
 */
router.get('/api/tasksStatus/:interval', function (req, res, next) {
    model.getTasksStatus(req, function (err, data) {
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
 * @api {get} /api/tasksExecutionsStatus/:interval Get task execution status according to a pre-defined time interval.
 * @apiName GetTaskExecutionStatus
 * @apiGroup Dashboard
 *
 * @apiParam {String} interval - Pre-Defined Time Interval: [Day, Week, Month, 3Month, Year].
 */
router.get('/api/tasksExecutionsStatus/:interval',function(req,res,next){
    model.getTasksExecutionsStatus(req, function (err, data) {
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
 * @api {get} /api/tasksPerBE/:interval Get tasks of a business entity according to a pre-defined time interval.
 * @apiName GetTasksPerBE
 * @apiGroup Dashboard
 *
 * @apiParam {String} interval - Pre-Defined Time Interval: [Day, Week, Month, 3Month, Year].
 */
router.get('/api/tasksPerBE/:interval',function(req,res,next){
    model.getTasksPerBE(req, function (err, data) {
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
 * @api {get} /api/activities/:interval Get activities according to a pre-defined time interval.
 * @apiName GetActivities
 * @apiGroup Dashboard
 *
 * @apiParam {String} interval - Pre-Defined Time Interval: [Day, Week, Month, 3Month, Year].
 */
router.get('/api/activities/:interval', function (req, res, next) {
    model.getActivities(req, function (err, data) {
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
 * @api {get} /api/numofprocessedcopiedfailedentities/:interval Get number of processed ,copied and failed entities according to a pre-defined time interval.
 * @apiName GetNumOfCopiedAndFailedEntities
 * @apiGroup Dashboard
 *
 * @apiParam {String} interval - Pre-Defined Time Interval: [Day, Week, Month, 3Month, Year].
 */
router.get('/api/numofprocessedcopiedfailedentities/:interval', function (req, res, next) {
    model.getNumOfProcessedFailedCopiedEntities(req, function (err, data) {
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

router.get('/api/numofcopiedfailedentitiesperlu/:interval', function (req, res, next) {
    model.getNumOfCopiedFailedEntitiesPerLU(req, function (err, data) {
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