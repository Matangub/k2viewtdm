var express = require('express');
var router = express.Router();
var logger = require('../utils/logger');
var model = require('../models/taskModel');
var modelUtils = require('../models/utilsModel');
var _ = require('underscore');
var monitor = require('../monitor');

router.get('/api/tasks', function (req, res, next) {
    model.getTasks(req, function (err, data) {
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

router.post('/api/task', function (req, res, next) {
    model.postTask(req, function (err, data) {
        if (err) {
            return res.json({
                errorCode: "FAIL",
                message: err
            });
        }

        var activityDesc = 'Task ' + req.body.task_title + ' was created';
        modelUtils.insertActivity('create', 'Tasks', req.decoded.user_id, req.decoded.username, activityDesc, function (err) {
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


router.put('/api/task/:taskId', function (req, res, next) {
    model.putTask(req, function (err, data) {
        if (err) {
            return res.json({
                errorCode: "FAIL",
                message: err
            });
        }

        var activityDesc = 'Task ' + req.body.task_title + ' was updated';
        modelUtils.insertActivity('update', 'Tasks', req.decoded.user_id, req.decoded.username, activityDesc, function (err) {
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

router.delete('/api/task/:taskId/taskname/:taskName', function (req, res, next) {
    model.deleteTask(req, function (err) {
        if (err) {
            return res.json({
                errorCode: "FAIL",
                message: err
            });
        }

        var activityDesc = 'Task ' + req.params.taskName + ' was deleted';
        modelUtils.insertActivity('delete', 'Tasks', req.decoded.user_id, req.decoded.username, activityDesc, function (err) {
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

router.get('/api/task/:taskId/products', function (req, res, next) {
    model.getTaskProducts(req, function (err, data) {
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

router.get('/api/businessentity/:beId/environment/:envId/products', function (req, res, next) {
    model.getProductsForBusinessEntityAndEnv(req, function (err, data) {
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

router.get('/api/environment/:envId/businessEntitiesForEnvProducts', function (req, res, next) {
    model.getBusinessEntityForEnvProducts(req, function (err, data) {
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

router.post('/api/task/:taskId/taskname/:taskName/products', function (req, res, next) {
    model.postTaskProducts(req, function (err) {
        if (err) {
            return res.json({
                errorCode: "FAIL",
                message: err
            });
        }

        var activityDesc = 'Products of task ' + req.params.taskName + ' were updated';
        modelUtils.insertActivity('update', 'Tasks', req.decoded.user_id, req.decoded.username, activityDesc, function (err) {
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

router.get('/api/environment/:envId/userRole', function (req, res, next) {
    model.getRoleForUserInEnv(req, function (err, data) {
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

router.get('/api/businessentity/:beId/parameters', function (req, res, next) {
    model.getParameters(req, function (err, data) {
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

router.post('/api/businessentity/:beName/analysiscount', function (req, res, next) {
    model.postTaskAnalysisCount(req, function (err, data) {
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

router.get('/api/task/:taskId/history', function (req, res, next) {
    model.getTaskHistory(req, function (err, data) {
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

router.get('/api/task/:taskId/startTask', function (req, res, next) {
    model.isTaskRunning(req,function(err,count){
        if (err) {
            return res.json({
                errorCode: "FAIL",
                message: err
            });
        }
        if (count > 0){
            return res.json({
                errorCode: "FAIL",
                message: "Task already running"
            });
        }
        model.startTask(req, function (err, data) {
            if (err) {
                return res.json({
                    errorCode: "FAIL",
                    message: err
                });
            }

            var activityDesc = 'Execution list of task ' + req.params.taskName + ' was updated';
            modelUtils.insertActivity('update', 'Tasks', req.decoded.user_id, req.decoded.username, activityDesc, function (err) {
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
});


router.put('/api/task/:taskId/holdTask', function (req, res, next) {
    model.holdTask(req, function (err, task_name) {
        if (err) {
            return res.json({
                errorCode: "FAIL",
                message: err
            });
        }

        var activityDesc = 'task # ' + task_name + ' was Holded';
        modelUtils.insertActivity('update', 'Tasks', req.decoded.user_id, req.decoded.username, activityDesc, function (err) {
            if (err) {
                logger.log('error', err.message);
            }
        });

        res.json({
            errorCode: "SUCCESS",
            message: null,
            result: []
        });
    });
});

router.put('/api/task/:taskId/activateTask', function (req, res, next) {
    model.activateTask(req, function (err, task_name) {
        if (err) {
            return res.json({
                errorCode: "FAIL",
                message: err
            });
        }

        var activityDesc = 'task # ' + task_name + ' was activated';
        modelUtils.insertActivity('update', 'Tasks', req.decoded.user_id, req.decoded.username, activityDesc, function (err) {
            if (err) {
                logger.log('error', err.message);
            }
        });

        res.json({
            errorCode: "SUCCESS",
            message: null,
            result: []
        });
    });
});

router.post('/api/task/monitor', function (req, res, next) {
    monitor.getMonitorData(req.body.executions,function(err,data){
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

router.post('/api/taskexecution/stopexecution', function (req, res, next) {
    monitor.stopExecution(req.body,function(err){
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