var express = require('express');
var router = express.Router();
var logger = require('../utils/logger');
var model = require('../models/businessEntityModel');
var productModel = require('../models/productModel.js');
var modelUtils = require('../models/utilsModel');

/**
 * @api {get} /api/businessentities Get Business Entities
 * @apiName GetBusinessEntities
 * @apiGroup Business Entities
 *
 */
router.get('/api/businessentities', function (req, res, next) {
    model.getBusinessEntities(req, function (err, data) {
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
 * @api {post} /api/businessentities Create New Business Entity
 * @apiName CreateBusinessEntity
 * @apiGroup Business Entities
 *
 */
router.post('/api/businessentity', function (req, res, next) {
    model.postBusinessEntity(req, function (err, data) {
        if (err) {
            return res.json({
                errorCode: "FAIL",
                message: err
            });
        }

        var activityDesc = 'Business entity ' + req.body.be_name + ' was created';
        modelUtils.insertActivity('create', 'Business entities', req.decoded.user_id, req.decoded.username, activityDesc, function (err) {
            if (err) {
                logger.log('error', err.message);
            }
        });

        res.json({
            errorCode: "SUCCESS",
            message: null,
            result: data
        });
    });
});

/**
 * @api {put} /api/businessentities/:beId Modify Business Entity
 * @apiName ModifyBusinessEntity
 * @apiGroup Business Entities
 *
 * @apiParam {Number} beId - Business Entity unique ID.
 */
router.put('/api/businessentity/:beId', function (req, res, next) {
    model.putBusinessEntity(req, function (err) {
        if (err) {
            return res.json({
                errorCode: "FAIL",
                message: err
            });
        }

        var activityDesc = 'Business entity ' + req.body.be_name + ' was updated';
        modelUtils.insertActivity('update', 'Business entities', req.decoded.user_id, req.decoded.username, activityDesc, function (err) {
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
 * @api {delete} /api/businessentities/:beId Delete Business Entity
 * @apiName DeleteBusinessEntity
 * @apiGroup Business Entities
 *
 * @apiParam {Number} beId - Business Entity unique ID.
 */
router.delete('/api/businessentity/:beId', function (req, res, next) {
    model.updateBusinessEntityDate(req);
    model.deleteBusinessEntity(req, function (err,result) {
        if (err) {
            return res.json({
                errorCode: "FAIL",
                message: err
            });
        }

        var activityDesc = 'Business entity ' + result.rows[0].be_name + ' was deleted';
        modelUtils.insertActivity('delete', 'Business entities', req.decoded.user_id, req.decoded.username, activityDesc, function (err) {
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
 * @api {get} /api/logicalunits Get Logical Units
 * @apiName GetLogicalUnits
 * @apiGroup Business Entities
 *
 */
router.get('/api/logicalunits', function (req, res, next) {
    model.getLogicalUnits(req, function (err, data) {
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
 * @api {get} /api/businessentity/:beId/logicalunits Get Logical Units of a Business Entity
 * @apiName GetLogicalUnitsPerBusinessEntity
 * @apiGroup Business Entities
 *
 * @apiParam {Number} beId - Business Entity unique ID.
 */
router.get('/api/businessentity/:beId/logicalunits', function (req, res, next) {
    model.getBusinessEntityLogicalUnits(req, function (err, data) {
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
 * @api {put} /api/businessentity/:beId/logicalunit/:luId Update Logical Unit under a Business Entity
 * @apiName UpdateLogicalUnitsInBusinessEntity
 * @apiGroup Business Entities
 *
 * @apiParam {Number} beId - Business Entity unique ID.
 * @apiParam {Number} luId - Logical Unit ID.
 */
router.put('/api/businessentity/:beId/logicalunit/:luId', function (req, res, next) {
    model.updateBusinessEntityDate(req);
    if (req.body.product_id != -1 || req.body.product_id != "-1"){
        req.params.prodId = req.body.product_id;
        productModel.updateProductDate(req);
    }
    model.putLogicalUnit(req, function (err) {
        if (err) {
            return res.json({
                errorCode: "FAIL",
                message: err
            });
        }

        var activityDesc = 'Logical unit ' + req.body.lu_name + ' was updated';
        modelUtils.insertActivity('update', 'Business entities', req.decoded.user_id, req.decoded.username, activityDesc, function (err) {
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

router.delete('/api/businessentity/:beId/bename/:beName/logicalunit/:luId/luname/:luName', function (req, res, next) {
    model.updateBusinessEntityDate(req);
    model.deleteLogicalUnit(req, function (err) {
        if (err) {
            return res.json({
                errorCode: "FAIL",
                message: err
            });
        }

        var activityDesc = 'Logical unit ' + req.body.lu_name + ' of business entity ' + req.params.beName + ' was deleted';
        modelUtils.insertActivity('update', 'Business entities', req.decoded.user_id, req.decoded.username, activityDesc, function (err) {
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

router.post('/api/businessentity/:beId/bename/:beName/logicalunit', function (req, res, next) {
    model.updateBusinessEntityDate(req);
    model.postLogicalUnit(req, function (err, data) {
        if (err) {
            return res.json({
                errorCode: "FAIL",
                message: err
            });
        }
        var activityDesc = 'Logical unit ' + req.body.lu_name + ' was added to business entity ' + req.params.beName;
        modelUtils.insertActivity('update', 'Business entities', req.decoded.user_id, req.decoded.username, activityDesc, function (err) {
            if (err) {
                logger.log('error', err.message);
            }
        });
        res.json({
            errorCode: "SUCCESS",
            message: null,
            result: data
        });
    });
});

/**
 * @api {get} /api/businessentity/:beId/productCount Get Product Count of a Business Entity
 * @apiName GetProductCountPerBusinessEntity
 * @apiGroup Business Entities
 *
 * @apiParam {Number} beId - Business Entity unique ID.
 */
router.get('/api/businessentity/:beId/productCount', function (req, res, next) {
    model.getBusinessEntityProductCount(req, function (err, data) {
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

router.delete('/api/businessentity/:beId/task', function (req, res, next) {
    model.deleteTaskForBE(req, function (err) {
        if (err) {
            return res.json({
                errorCode: "FAIL",
                message: err
            });
        }

        res.json({
            errorCode: "SUCCESS",
            message: null
        });
    });
});

module.exports = router;