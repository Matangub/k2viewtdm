var logger = require('../utils/logger');
var _ = require('underscore');
var async = require('async');

var getTasks = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }
        var query="SELECT tasks.*,environments.*,business_entities.*,environment_owners.user_name  as owner,"+
            "( SELECT COUNT(*) FROM task_execution_list WHERE task_execution_list.task_id = tasks.task_id AND"+
            " ( UPPER(task_execution_list.execution_status)"+
            "  IN ('RUNNING','EXECUTING','STARTED','PENDING','PAUSED','STARTEXECUTIONREQUESTED'))) AS executioncount"+
            " FROM tasks INNER JOIN environments"+
            " ON (tasks.environment_id = environments.environment_id) INNER JOIN business_entities ON"+
            " (tasks.be_id = business_entities.be_id) LEFT JOIN environment_owners ON"+
            " (tasks.environment_id =environment_owners.environment_id)";

        client.query(query,
            function (err, result) {
                done();
                if (err) {
                    logger.log('error', err.message);
                    return cb(err.message)
                }

                result.rows = _.map(result.rows, function (row) {
                    row.task_id = parseInt(row.task_id);
                    row.environment_id = parseInt(row.environment_id);
                    row.be_id = parseInt(row.be_id);
                    row.executioncount = parseInt(row.executioncount);
                    row.number_of_entities_to_copy = parseInt(row.number_of_entities_to_copy);
                    row.owners = [];
                    row.owners.push(row.owner);
                    return row;
                });
                var newResult=[];
                for(var i = 0;i < result.rows.length ; i++){
                    var task = _.find(newResult,{task_id: result.rows[i].task_id});
                    if (task){
                        task.owners.push(result.rows[i].owner);
                    }
                    else{
                        result.rows[i].owners = [];
                        if (result.rows[i].owner) {
                            result.rows[i].owners.push(result.rows[i].owner);
                            delete result.rows[i].owner;
                        }
                        newResult.push(result.rows[i]);
                    }
                }
                cb(null, newResult);
            });
    });
};

var postTask = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('INSERT INTO "' + schema + '".tasks (be_id, environment_id, scheduler, delete_before_load,' +
            'request_of_fresh_data, number_of_entities_to_copy,selection_method,selection_param_value,entity_exclusion_list,  task_execution_status, ' +
            'task_created_by, task_creation_date, task_last_updated_date, task_last_updated_by, task_status, task_title, parameters, refresh_reference_data,replace_sequences) ' +
            'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING task_id',
            [
                req.body.be_id,
                req.body.environment_id,
                req.body.scheduler,
                req.body.delete_before_load,
                req.body.request_of_fresh_data,
                req.body.number_of_entities_to_copy,
                req.body.selection_method,
                req.body.selection_param_value,
                req.body.entity_exclusion_list,
                'Active',
                req.decoded.username,
                (new Date()).toISOString(),
                (new Date()).toISOString(),
                req.decoded.username,
                'Active',
                req.body.task_title,
                req.body.parameters,
                req.body.refresh_reference_data,
                req.body.replace_sequences
            ]
            , function (err, result) {
                done();
                if (err) {
                    logger.log('error', err.message);
                    return cb(err.message)
                }
                cb(null, {id: parseInt(result.rows[0].task_id)});
            }
        );
    });
};

var putTask = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('UPDATE "' + schema + '".tasks SET ' +
            'task_status=($1) ' +
            'WHERE task_id = ' + req.params.taskId,
            [
                'Inactive'
            ], function (err) {
                done();
                if (err) {
                    logger.log('error', err.message);
                    return cb(err.message)
                }

                client.query('INSERT INTO "' + schema + '".tasks (be_id, environment_id, scheduler, delete_before_load,' +
                    'request_of_fresh_data, number_of_entities_to_copy, selection_method,selection_param_value,entity_exclusion_list,  task_execution_status,' +
                    'task_created_by, task_creation_date, task_last_updated_date, task_last_updated_by, task_status, ' +
                    'task_title, parameters,refresh_reference_data, replace_sequences) ' +
                    'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING task_id',
                    [
                        req.body.be_id,
                        req.body.environment_id,
                        req.body.scheduler,
                        req.body.delete_before_load,
                        req.body.request_of_fresh_data,
                        req.body.number_of_entities_to_copy,
                        req.body.selection_method,
                        req.body.selection_param_value,
                        req.body.entity_exclusion_list,
                        'Active',
                        req.body.task_created_by,
                        req.body.task_creation_date,
                        (new Date()).toISOString(),
                        req.decoded.username,
                        'Active',
                        req.body.task_title,
                        req.body.parameters,
                        req.body.refresh_reference_data,
                        req.body.replace_sequences
                    ]
                    , function (err, result) {
                        done();
                        if (err) {
                            logger.log('error', err.message);
                            return cb(err.message)
                        }
                        cb(null, {id: parseInt(result.rows[0].task_id)});
                    }
                );
            }
        );
    });
};

var deleteTask = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('UPDATE "' + schema + '".tasks SET ' +
            'task_status=($1), ' +
            'task_last_updated_date=($2), ' +
            'task_last_updated_by=($3) ' +
            'WHERE task_id = ' + req.params.taskId,
            [
                'Inactive',
                (new Date()).toISOString(),
                req.decoded.username
            ], function (err) {
                done();
                if (err) {
                    logger.log('error', err.message);
                    return cb(err.message)
                }
                cb(null);
            }
        );
    });
};

var getTaskProducts = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }
        client.query('SELECT * FROM "' + schema + '".tasks_products INNER JOIN "' + schema + '".products ON ("' + schema + '".tasks_products.product_id = "' + schema + '".products.product_id) WHERE task_id =' + req.params.taskId, function (err, result) {
            done();
            if (err) {
                logger.log('error', err.message);
                return cb(err.message)
            }

            var retData = _.map(result.rows, function (row) {
                return parseInt(row.product_id);
            });

            cb(null, retData);
        });
    });
};

var getProductsForBusinessEntityAndEnv = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }
        client.query('SELECT * FROM "' + schema + '".product_logical_units ' +
            'INNER JOIN "' + schema + '".products ' +
            'ON ("' + schema + '".product_logical_units.product_id = "' + schema + '".products.product_id) ' +
            'INNER JOIN "' + schema + '".environment_products ' +
            'ON ("' + schema + '".product_logical_units.product_id = "' + schema + '".environment_products.product_id ' +
            'AND environment_products.status = \'Active\') ' +
            'WHERE be_id = ' + req.params.beId + ' AND environment_id = ' + req.params.envId, function (err, result) {
            done();
            if (err) {
                logger.log('error', err.message);
                return cb(err.message)
            }

            var retData = _.map(result.rows, function (row) {
                var retRow = {};
                retRow.product_id = parseInt(row.product_id);
                retRow.product_name = row.product_name;
                return retRow;
            });

            cb(null, _.uniq(retData, 'product_id'));
        });
    });
};

var getBusinessEntityForEnvProducts = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }
        client.query('SELECT * FROM "' + schema + '".product_logical_units ' +
            'INNER JOIN "' + schema + '".products ' +
            'ON ("' + schema + '".product_logical_units.product_id = "' + schema + '".products.product_id AND "' + schema + '".products.product_status = \'Active\') ' +
            'INNER JOIN "' + schema + '".environment_products ' +
            'ON ("' + schema + '".product_logical_units.product_id = "' + schema + '".environment_products.product_id AND "' + schema + '".environment_products.status = \'Active\') ' +
            'INNER JOIN "' + schema + '".business_entities ' +
            'ON ("' + schema + '".business_entities.be_id = "' + schema + '".product_logical_units.be_id) ' +
            'WHERE environment_id = ' + req.params.envId + " AND be_status = \'Active\'", function (err, result) {
            done();
            if (err) {
                logger.log('error', err.message);
                return cb(err.message)
            }

            var retData = _.map(result.rows, function (row) {
                var retRow = {};
                retRow.be_id = parseInt(row.be_id);
                retRow.be_name = row.be_name;
                return retRow;
            });

            cb(null, _.uniq(retData, 'be_id'));
        });
    });
};

var postTaskProducts = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('DELETE FROM "' + schema + '".tasks_products WHERE "' + schema + '".tasks_products.task_id = ' + req.params.taskId,function(err){
            done();
            if (err) {
                logger.log('error', err.message);
                return cb(err.message)
            }
            async.each(req.body, function (productId, callback) {

                client.query('INSERT INTO "' + schema + '".tasks_products (task_id, product_id,task_product_status) VALUES ($1, $2,$3)',
                    [
                        req.params.taskId,
                        productId,
                        'Active'
                    ]
                    , function (err) {
                        done();
                        if (err) {
                            logger.log('error', err.message);
                            return callback(err.message)
                        }
                        callback();
                    });
            }, function (err) {
                if (err) {
                    logger.log('error', err.message);
                    return cb(err.message)
                }
                cb(null);
            });
        });
    });
};

var getRoleForUserInEnv = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('SELECT * FROM "' + schema + '".environment_role_users INNER JOIN "' + schema + '".environment_roles ON ("' + schema + '".environment_role_users.role_id = "' + schema + '".environment_roles.role_id AND ' +
            '"' + schema + '".environment_roles.role_status = \'Active\') WHERE "' +
            schema + '".environment_role_users.environment_id = ' + req.params.envId + ' AND "' + schema + '".environment_role_users.user_id = \'' + req.decoded.user_id + '\'', function (err, result) {
            done();
            if (err) {
                logger.log('error', err.message);
                return cb(err.message)
            }

            result.rows = _.map(result.rows, function (row) {
                row.role_id = parseInt(row.role_id);
                row.environment_id = parseInt(row.environment_id);
                return row;
            });

            cb(null, result.rows);
        });
    });
};

var getParameters = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('SELECT * FROM "' + schema + '".parameters WHERE be_id = ' + req.params.beId, function (err, result) {
            done();
            if (err) {
                logger.log('error', err.message);
                return cb(err.message)
            }

            result.rows = _.map(result.rows, function (row) {
                row.be_id = parseInt(row.be_id);
                row.min_value = parseInt(row.min_value);
                row.max_value = parseInt(row.max_value);
                return row;
            });

            cb(null,result.rows);
        });
    });
};

var postTaskAnalysisCount = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }
        req.body.query = req.body.query.replace(/\(\)/g, "(true = true)");
        client.query('SELECT COUNT (DISTINCT entity_id) FROM "' + schema + '".be_params_' + req.params.beName.replace(" ","_")  + ' WHERE ' + req.body.query, function (err, result) {
            done();
            if (err) {
                logger.log('error', err.message);
                return cb(err.message);
            }
            if (result.rows && result.rows.length > 0){
                cb(null, result.rows[0].count);
            }
            else{
                cb(null, 0);
            }
        });
    });
};

var getTaskHistory = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('SELECT * FROM "' + schema + '".task_execution_list ' +
            'INNER JOIN "' + schema + '".products ' +
            'ON ("' + schema + '".task_execution_list.product_id = "' + schema + '".products.product_id) ' +
            'INNER JOIN "' + schema + '".data_centers ' +
            'ON ("' + schema + '".task_execution_list.data_center_id = "' + schema + '".data_centers.data_center_id) ' +
            'INNER JOIN "' + schema + '".environments ' +
            'ON ("' + schema + '".task_execution_list.environment_id = "' + schema + '".environments.environment_id) ' +
            'INNER JOIN "' + schema + '".business_entities ' +
            'ON ("' + schema + '".task_execution_list.be_id = "' + schema + '".business_entities.be_id) ' +
            'INNER JOIN "' + schema + '".product_logical_units ' +
            'ON ("' + schema + '".task_execution_list.lu_id = "' + schema + '".product_logical_units.lu_id) ' +
            'WHERE task_id = ' + req.params.taskId, function (err, result) {
            done();
            if (err) {
                logger.log('error', err.message);
                return cb(err.message);
            }

            cb(null, result.rows);
        });
    });
};

var startTask = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('SELECT * FROM "' + schema + '".tasks ' +
            'INNER JOIN "' + schema + '".tasks_products ' +
            'ON ("' + schema + '".tasks.task_id = "' + schema + '".tasks_products.task_id) ' +
            'INNER JOIN "' + schema + '".product_logical_units ' +
            'ON ("' + schema + '".product_logical_units.product_id = "' + schema + '".tasks_products.product_id AND ' +
            '"' + schema + '".product_logical_units.be_id = "' + schema + '".tasks.be_id) ' +
            'INNER JOIN "' + schema + '".environment_products ' +
            'ON ("' + schema + '".environment_products.status = \'Active\' AND "' + schema + '".environment_products.product_id = "' + schema + '".tasks_products.product_id AND "' + schema + '".environment_products.environment_id = "' + schema + '".tasks.environment_id) ' +
            'INNER JOIN "' + schema + '".data_centers ' +
            'ON ("' + schema + '".data_centers.data_center_id = "' + schema + '".environment_products.data_center_id) ' +
            'WHERE tasks.task_id = ' + req.params.taskId, function (err, result) {
            done();
            if (err) {
                logger.log('error', err.message);
                return cb(err.message)
            }

            if (result.rows.length == 0){
                return cb('Failed to execute Task')
            }

            client.query('SELECT * FROM "' + schema + '".task_execution_list WHERE task_id = ' + req.params.taskId, function (err, result1) {
                done();
                if (err) {
                    logger.log('error', err.message);
                    return cb(err.message)
                }

                client.query("SELECT nextval('tasks_task_execution_id_seq')", function (err, nextValResult) {
                    done();
                    if (err) {
                        logger.log('error', err.message);
                        return cb(err.message)
                    }
                    var taskExecutionId;
                    if (nextValResult.rows.length > 0 ){
                        taskExecutionId = nextValResult.rows[0].nextval;
                    }
                    else{
                        logger.log('error', 'Sequence didn\'t return a new next val');
                        return cb('Sequence didn\'t return a new next val')
                    }

                    async.each(result.rows, function (entry, callback) {
                            client.query('INSERT INTO "' + schema + '".task_execution_list ' +
                                '(task_id, task_execution_id, creation_date, be_id, environment_id, product_id, product_version, lu_id, data_center_id, etl_ip_address,execution_status) ' +
                                'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,$11)',
                                [
                                    entry.task_id,
                                    taskExecutionId,
                                    (new Date()).toISOString(),
                                    entry.be_id,
                                    entry.environment_id,
                                    entry.product_id,
                                    entry.product_version,
                                    entry.lu_id,
                                    entry.data_center_id,
                                    entry.data_center_etl_ip_address,
                                    'Pending'
                                ],
                                function (err) {
                                    done();
                                    if (err) {
                                        logger.log('error', err.message);
                                        return callback(err.message)
                                    }
                                    callback();
                                }
                            );
                        }
                        , function (err) {
                            if (err) {
                                logger.log('error', err.message);
                                return cb(err.message)
                            }
                            cb(null, {});
                        });
                });
            });
        });
    });
};

var canUserModifyTask = function (req, cb){
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }
        client.query('SELECT * FROM "' + schema + '".be_params_' + req.params.beName  + ' WHERE ' + req.body.query, function (err, result) {
            done();
            if (err) {
                logger.log('error', err.message);
                return cb(err.message);
            }
            if (result.rows && result.rows.length > 0){
                cb(null, result.rows[0].count);
            }
            else{
                cb(null, 0);
            }
        });
    });
};

var holdTask = function (req, cb){
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }
        client.query('UPDATE "' + schema + '".tasks SET task_execution_status = \'onHold\' WHERE "' + schema + '".tasks.task_id = ' +req.params.taskId + 'RETURNING "' + schema + '".tasks.task_title', function (err, result) {
            done();
            if (err) {
                logger.log('error', err.message);
                return cb(err.message);
            }
            cb(null, result.rows[0].task_title);
        });
    });
};

var activateTask = function (req, cb){
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }
        client.query('UPDATE "' + schema + '".tasks SET task_execution_status = \'Active\' WHERE "' + schema + '".tasks.task_id = ' +req.params.taskId + 'RETURNING "' + schema + '".tasks.task_title', function (err, result) {
            done();
            if (err) {
                logger.log('error', err.message);
                return cb(err.message);
            }
            cb(null, result.rows[0].task_title);
        });
    });
};

var isTaskRunning = function (req, cb){
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }
        client.query('SELECT count(*) FROM"' + schema + '".task_execution_list ' +
            'WHERE task_id = ' + req.params.taskId + ' AND ' +
            '(lower(execution_status) <> \'failed\' AND lower(execution_status) <> \'completed\' AND lower(execution_status) <> \'stopped\' )', function (err, result) {
            done();
            if (err) {
                logger.log('error', err.message);
                return cb(err.message);
            }
            cb(null, result.rows[0].count);
        });
    });
};


module.exports = {
    getTasks : getTasks,
    postTask : postTask,
    putTask : putTask,
    deleteTask : deleteTask,
    postTaskProducts : postTaskProducts,
    getTaskProducts : getTaskProducts,
    getProductsForBusinessEntityAndEnv : getProductsForBusinessEntityAndEnv,
    getBusinessEntityForEnvProducts : getBusinessEntityForEnvProducts,
    getRoleForUserInEnv : getRoleForUserInEnv,
    getParameters : getParameters,
    postTaskAnalysisCount : postTaskAnalysisCount,
    getTaskHistory : getTaskHistory,
    startTask : startTask,
    canUserModifyTask : canUserModifyTask,
    holdTask : holdTask,
    activateTask : activateTask,
    isTaskRunning : isTaskRunning
};