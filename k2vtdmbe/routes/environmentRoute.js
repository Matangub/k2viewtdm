var express = require('express');
var router = express.Router();
var logger = require('../utils/logger');
var model = require('../models/environmentModel');
var modelUtils = require('../models/utilsModel');
var ldapClient = require('../ldapClient');
var _ = require('underscore');

/**
 * @api {get} /api/environments Get Environments
 * @apiName GetEnvironments
 * @apiGroup Environments
 *
 */
router.get('/api/environments', function (req, res, next) {
    model.getEnvironments(req, function (err, data) {
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
 * @api {get} /api/environmentsbyuser Get Environments By User
 * @apiName GetEnvironments By User
 * @apiGroup Environments
 *
 */
router.get('/api/environmentsbyuser', function (req, res, next) {
    model.getEnvironmentsByUser(req, function (err, data) {
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
 * @api {get} /api/environment/:envId Get Environment by ID.
 * @apiName GetEnvironmentById
 * @apiGroup Environments
 *
 * @apiParam {Number} envId - Environment unique ID.
 */
router.get('/api/environment/:envId', function (req, res, next) {
    model.getEnvironment(req, function (err, data) {
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
 * @api {post} /api/environment Create New Environment.
 * @apiName CreateEnvironment
 * @apiGroup Environments
 *
 */
router.post('/api/environment', function (req, res, next) {
    if (req.decoded.role.type == 'admin') {
        model.postEnvironment(req, function (err, data) {
            if (err) {
                return res.json({
                    errorCode: "FAIL",
                    message: err
                });
            }

            var activityDesc = 'Environment ' + req.body.environment_name + ' was created';
            modelUtils.insertActivity('create', 'Environments', req.decoded.user_id, req.decoded.username, activityDesc, function (err) {
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
    } else {
        res.json({
            errorCode: "FAIL",
            message: "Permission denied"
        });
    }
});

/**
 * @api {put} /api/environment/:envId Modify Environment.
 * @apiName ModifyEnvironment
 * @apiGroup Environments
 *
 * @apiParam {Number} envId - Environment unique ID.
 */
router.put('/api/environment/:envId', function (req, res, next) {
    model.putEnvironment(req, function (err) {
        if (err) {
            return res.json({
                errorCode: "FAIL",
                message: err
            });
        }
        var activityDesc = 'Environment ' + req.body.environment_name + ' was updated';
        modelUtils.insertActivity('update', 'Environments', req.decoded.user_id, req.decoded.username, activityDesc, function (err) {
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
 * @api {delete} /api/environment/:envId Delete Environment.
 * @apiName DeleteEnvironment
 * @apiGroup Environments
 *
 * @apiParam {Number} envId - Environment unique ID.
 */
router.delete('/api/environment/:envId/envname/:envName', function (req, res, next) {
    model.updateEnvironmentDate(req);
    model.deleteEnvironment(req, function (err) {
        if (err) {
            return res.json({
                errorCode: "FAIL",
                message: err
            });
        }

        var activityDesc = 'Environment ' + req.params.envName + ' was deleted';
        modelUtils.insertActivity('delete', 'Environments', req.decoded.user_id, req.decoded.username, activityDesc, function (err) {
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
 * @api {get} /api/environment/:envId/owners Get Environment Owners.
 * @apiName GetEnvironmentOwners
 * @apiGroup Environments
 *
 * @apiParam {Number} envId - Environment unique ID.
 */
router.get('/api/environment/:envId/owners', function (req, res, next) {
    model.getEnvironmentOwners(req, function (err, data) {
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
 * @api {get} /api/environment/:envId/roles Get Environment Roles.
 * @apiName GetEnvironmentRoles
 * @apiGroup Environments
 *
 * @apiParam {Number} envId - Environment unique ID.
 */
router.get('/api/environment/:envId/roles', function (req, res, next) {
    model.getRoles(req, function (err, data) {
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
 * @api {post} /api/environment/:envId/envname/:envName/role Create Environment Role.
 * @apiName CreateEnvironmentRole
 * @apiGroup Environments
 *
 * @apiParam {Number} envId - Environment unique ID.
 * @apiParam {String} envName - Environment Name.
 */
router.post('/api/environment/:envId/envname/:envName/role', function (req, res, next) {
    model.updateEnvironmentDate(req);
    model.postRole(req, function (err, data) {
        if (err) {
            return res.json({
                errorCode: "FAIL",
                message: err
            });
        }

        var activityDesc = 'Role ' + req.body.role_name + ' was added to environment ' + req.params.envName;
        modelUtils.insertActivity('update', 'Environments', req.decoded.user_id, req.decoded.username, activityDesc, function (err) {
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
 * @api {put} /api/environment/:envId/envname/:envName/role/:roleId Modify Environment Role.
 * @apiName ModifyEnvironmentRole
 * @apiGroup Environments
 *
 * @apiParam {Number} envId - Environment unique ID.
 * @apiParam {String} envName - Environment Name.
 * @apiParam {Number} roleId - Role ID.
 */
router.put('/api/environment/:envId/envname/:envName/role/:roleId', function (req, res, next) {
    model.updateEnvironmentDate(req);
    model.putRole(req, function (err) {
        if (err) {
            return res.json({
                errorCode: "FAIL",
                message: err
            });
        }

        var activityDesc = 'Role ' + req.body.role_name + ' of environment ' + req.params.envName + ' was updated';
        modelUtils.insertActivity('update', 'Environments', req.decoded.user_id, req.decoded.username, activityDesc, function (err) {
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
 * @api {delete} /api/environment/:envId/envname/:envName/role/:roleId/rolename/:roleName Delete Environment Role.
 * @apiName DeleteEnvironmentRole
 * @apiGroup Environments
 *
 * @apiParam {Number} envId - Environment unique ID.
 * @apiParam {String} envName - Environment Name.
 * @apiParam {Number} roleId - Role ID.
 * @apiParam {String} roleName - Role Name.
 */
router.delete('/api/environment/:envId/envname/:envName/role/:roleId/rolename/:roleName', function (req, res, next) {
    model.updateEnvironmentDate(req);
    model.deleteRole(req, function (err) {
        if (err) {
            return res.json({
                errorCode: "FAIL",
                message: err
            });
        }

        var activityDesc = 'Role ' + req.params.roleName + ' of environment ' + req.params.envName + ' was deleted';
        modelUtils.insertActivity('update', 'Environments', req.decoded.user_id, req.decoded.username, activityDesc, function (err) {
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
 * @api {get} /api/environment/:envId/role/:roleId/users Get Environment Testers according to Role ID.
 * @apiName GetEnvironmentTestersByRole
 * @apiGroup Environments
 *
 * @apiParam {Number} envId - Environment unique ID.
 * @apiParam {Number} roleId - Role ID.
 */
router.get('/api/environment/:envId/role/:roleId/users', function (req, res, next) {
    model.getEnvRoleUsers(req, function (err, data) {
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

router.post('/api/environment/:envId/envname/:envName/role/:roleId/rolename/:roleName/users', function (req, res, next) {
    model.postEnvRoleUsers(req, function (err) {
        if (err) {
            return res.json({
                errorCode: "FAIL",
                message: err
            });
        }

        var activityDesc = 'Testers of role ' + req.params.roleName + ' of environment ' + req.params.envName + ' were updated';
        modelUtils.insertActivity('update', 'Environments', req.decoded.user_id, req.decoded.username, activityDesc, function (err) {
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

router.get('/api/environment/:envId/taskCount', function (req, res, next) {
    model.getEnvironmentTaskCount(req, function (err, data) {
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

router.get('/api/environment/:envId/products', function (req, res, next) {
    model.getEnvProducts(req, function (err, data) {
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

router.post('/api/environment/:envId/envname/:envName/product', function (req, res, next) {
    model.updateEnvironmentDate(req);
    model.postEnvProduct(req, function (err) {
        if (err) {
            return res.json({
                errorCode: "FAIL",
                message: err
            });
        }

        var activityDesc = 'Products of environment ' + req.params.envName + ' were updated';
        modelUtils.insertActivity('update', 'Environments', req.decoded.user_id, req.decoded.username, activityDesc, function (err) {
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

router.put('/api/environment/:envId/envname/:envName/product', function (req, res, next) {
    model.updateEnvironmentDate(req);
    model.putEnvProduct(req, function (err) {
        if (err) {
            return res.json({
                errorCode: "FAIL",
                message: err
            });
        }

        var activityDesc = 'Products of environment ' + req.params.envName + ' were updated';
        modelUtils.insertActivity('update', 'Environments', req.decoded.user_id, req.decoded.username, activityDesc, function (err) {
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

router.delete('/api/environment/:envId/envname/:envName/product/:prodId', function (req, res, next) {
    model.updateEnvironmentDate(req);
    model.deleteEnvProduct(req, function (err) {
        if (err) {
            return res.json({
                errorCode: "FAIL",
                message: err
            });
        }

        var activityDesc = 'Products of environment ' + req.params.envName + ' were updated';
        modelUtils.insertActivity('update', 'Environments', req.decoded.user_id, req.decoded.username, activityDesc, function (err) {
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

router.get('/api/environment/:envId/testers', function (req, res, next) {
    ldapClient.getTesters(function (err, testers) {
        if (err) {
            return res.json({
                errorCode: "FAIL",
                message: err
            });
        }

        req.testers = testers;
        model.getTesters(req, function (err, data) {
            if (err) {
                return res.json({
                    errorCode: "FAIL",
                    message: err
                });
            }

            data = _.each(data, function (tester) {
                tester.user_id = tester.uid;
                tester.username = tester.displayName;
                return tester;
            });

            res.json({
                errorCode: "SUCCESS",
                message: null,
                result: data
            });
        });
    });
});

router.get('/api/environment/:envId/summary/:interval', function (req, res, next) {
    model.getSummary(req, function (err, data) {
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