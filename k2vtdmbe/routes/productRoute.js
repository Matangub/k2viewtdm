var express = require('express');
var router = express.Router();
var logger = require('../utils/logger');
var model = require('../models/productModel');
var modelUtils = require('../models/utilsModel');

router.get('/api/products', function (req, res, next) {
    model.getProducts(req, function (err, data) {
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

router.get('/api/product/:prodId', function (req, res, next) {
    model.getProduct(req, function (err, data) {
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

router.post('/api/product', function (req, res, next) {
    model.postProduct(req, function (err, data) {
        if (err) {
            return res.json({
                errorCode: "FAIL",
                message: err
            });
        }

        var activityDesc = 'Product ' + req.body.product_name + ' was created';
        modelUtils.insertActivity('create', 'Products', req.decoded.user_id, req.decoded.username, activityDesc, function (err) {
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

router.put('/api/product/:prodId', function (req, res, next) {
    model.putProduct(req, function (err) {
        if (err) {
            return res.json({
                errorCode: "FAIL",
                message: err
            });
        }

        var activityDesc = 'Product ' + req.body.product_name + ' was updated';
        modelUtils.insertActivity('update', 'Products', req.decoded.user_id, req.decoded.username, activityDesc, function (err) {
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

router.delete('/api/product/:prodId', function (req, res, next) {
    model.updateProductDate(req);
    model.deleteProduct(req, function (err,productName) {
        if (err) {
            return res.json({
                errorCode: "FAIL",
                message: err
            });
        }
        var activityDesc = 'Product ' + productName + ' was deleted';
        modelUtils.insertActivity('delete', 'Products', req.decoded.user_id, req.decoded.username, activityDesc, function (err) {
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

router.get('/api/product/:prodId/interfaces', function (req, res, next) {
    model.getProductInterfaces(req, function (err, data) {
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

router.post('/api/product/:prodId/productname/:prodName/interface', function (req, res, next) {
    model.updateProductDate(req);
    model.postProductInterface(req, function (err,result) {
        if (err) {
            return res.json({
                errorCode: "FAIL",
                message: err
            });
        }

        var activityDesc = 'Interface ' + req.body.interface_name + ' was added to product ' + req.params.prodName;
        modelUtils.insertActivity('create', 'Products', req.decoded.user_id, req.decoded.username, activityDesc, function (err) {
            if (err) {
                logger.log('error', err.message);
            }
        });

        res.json({
            errorCode: "SUCCESS",
            message: null,
            result : result
        });
    });
});

router.put('/api/product/:prodId/productname/:prodName/interface/:interfaceId', function (req, res, next) {
    model.updateProductDate(req);
    model.putProductInterface(req, function (err) {
        if (err) {
            return res.json({
                errorCode: "FAIL",
                message: err
            });
        }

        var activityDesc = 'Interface ' + req.body.interface_name + ' of product ' + req.params.prodName + ' was updated';
        modelUtils.insertActivity('update', 'Products', req.decoded.user_id, req.decoded.username, activityDesc, function (err) {
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

router.delete('/api/product/:prodId/productname/:prodName/interface/:interfaceId/interfacename/:interfaceName/' +
    'interfacecount/:interfaceCount/envcount/:envCount', function (req, res, next) {
    model.updateProductDate(req);
    model.deleteProductInterface(req, function (err) {
        if (err) {
            return res.json({
                errorCode: "FAIL",
                message: err
            });
        }

        var activityDesc = 'Interface ' + req.params.interfaceName + ' of product ' + req.params.prodName + ' was deleted';
        modelUtils.insertActivity('delete', 'Products', req.decoded.user_id, req.decoded.username, activityDesc, function (err) {
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

router.get('/api/product/:prodId/logicalunits', function (req, res, next) {
    model.getProductLogicalUnits(req, function (err, data) {
        if (err) {product
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

router.get('/api/logicalunitswithoutproduct', function (req, res, next) {
    model.getLogicalUnitsWithoutProduct(req, function (err, data) {
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

router.get('/api/product/:productId/envcount', function (req, res, next) {
    model.getProductEnvironmentCount(req, function (err, data) {
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


router.get('/api/productsWithLUs', function (req, res, next) {
    model.getProductsWithAtLeastOneLU(req, function (err, data) {
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