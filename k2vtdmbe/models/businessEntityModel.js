var logger = require('../utils/logger');
var async = require('async');
var _ = require('underscore');

var getBusinessEntities = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('SELECT * FROM "' + schema + '".business_entities',
            function (err, result) {
                done();
                if (err) {
                    logger.log('error', err.message);
                    return cb(err.message)
                }

                result.rows = _.map(result.rows, function (row) {
                    row.be_id = parseInt(row.be_id);
                    return row;
                });

                cb(null, result.rows);
            }
        );
    });
};

var postBusinessEntity = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('INSERT INTO "' + schema + '".business_entities ' +
            '(be_name, be_description, be_created_by, be_creation_date, be_last_updated_date, be_last_updated_by, be_status) ' +
            'VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING be_id',
            [
                req.body.be_name,
                req.body.be_description,
                req.decoded.username,
                (new Date()).toISOString(),
                (new Date()).toISOString(),
                req.decoded.username,
                'Active'
            ]
            , function (err, result) {
                done();
                if (err) {
                    logger.log('error', err.message);
                    return cb(err.message)
                }
                cb(null, {id: parseInt(result.rows[0].be_id)});
            }
        );
    });
};

var putBusinessEntity = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('UPDATE "' + schema + '".business_entities ' +
            'SET be_name=($1),' +
            'be_description=($2),' +
            'be_last_updated_date=($3),' +
            'be_last_updated_by=($4) ' +
            'WHERE be_id = ' + req.params.beId,
            [
                req.body.be_name,
                req.body.be_description,
                (new Date()).toISOString(),
                req.decoded.username
            ],
            function (err) {
                done();
                if (err) {
                    logger.log('error', err.message);
                    return cb(err.message)
                }
                cb(null);

            });
    });
};

var deleteBusinessEntity = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('UPDATE "' + schema + '".business_entities SET be_status=($1) WHERE be_id = ' + req.params.beId + '  RETURNING be_name',
            [
                'Inactive'
            ],
            function (err,result) {
                done();
                if (err) {
                    logger.log('error', err.message);
                    return cb(err.message)
                }
                var queries = [
                    {
                        queryString : 'UPDATE "public".environment_products ' +
                        'SET status= ($1) ' +
                        'from ( ' +
                        'select product_id, count(product_id) ' +
                        'from "public".product_logical_units ' +
                        'WHERE be_id = ' + req.params.beId + '  AND  ' +
                        'product_id not in (select product_id from "public".product_logical_units where be_id <> ' + req.params.beId + ' AND product_id <> -1) ' +
                        'GROUP BY product_id ) l ' +
                        'WHERE "public".environment_products.status = \'Active\' AND l.product_id = "public".environment_products.product_id AND l.count = 1',
                        queryValues : ['Inactive']
                    },
                    {
                        queryString : 'UPDATE "' + schema + '".product_logical_units ' +
                        'SET product_id=($1) ' +
                        'WHERE be_id = ' + req.params.beId ,
                        queryValues : [-1]
                    },
                    {
                        queryString : 'UPDATE "' + schema + '".tasks ' +
                        'SET task_status=($1) ' +
                        'WHERE be_id = ' + req.params.beId,
                        queryValues : ['Inactive']
                    }
                ];

                async.each(queries, function (query, callback) {
                    client.query(query.queryString, query.queryValues, function (err) {
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
                    cb(null,result);
                });

            });
    });
};

var getLogicalUnits = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('SELECT * FROM "' + schema + '".product_logical_units ' +
            'INNER JOIN "' + schema + '".business_entities ON( "' + schema + '".business_entities.be_id = "' + schema + '".product_logical_units.be_id ) ' +
            'WHERE "' + schema + '".business_entities.be_status = \'Active\'',
            function (err, result) {
                done();
                if (err) {
                    logger.log('error', err.message);
                    return cb(err.message)
                }

                result.rows = _.map(result.rows, function (row) {
                    row.lu_id = parseInt(row.lu_id);
                    return row;
                });

                cb(null, result.rows);
            }
        );
    });
};


var getBusinessEntityLogicalUnits = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('SELECT * FROM "' + schema + '".product_logical_units WHERE be_id = ' + req.params.beId,
            function (err, result) {
                done();
                if (err) {
                    logger.log('error', err.message);
                    return cb(err.message)
                }

                result.rows = _.map(result.rows, function (row) {
                    row.lu_id = parseInt(row.lu_id);
                    return row;
                });
                cb(null, result.rows);
            }
        );
    });
};

var putLogicalUnit = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('UPDATE "' + schema + '".product_logical_units ' +
            'SET lu_name=($1), lu_description=($2), product_id=($3), lu_parent_id=($4), product_name=($5), lu_parent_name=($6) ' +
            'WHERE lu_id = ' + req.params.luId,
            [
                req.body.lu_name,
                req.body.lu_description,
                req.body.product_id,
                req.body.lu_parent_id,
                req.body.product_name,
                req.body.lu_parent_name
            ],
            function (err) {
                done();
                if (err) {
                    logger.log('error', err.message);
                    return cb(err.message)
                }
                cb(null);
            });
    });
};

var deleteLogicalUnit = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('DELETE FROM "' + schema + '".product_logical_units WHERE lu_id = ($1) RETURNING product_id', [req.params.luId],
            function (err,result) {
                done();
                if (err) {
                    logger.log('error', err.message);
                    return cb(err.message)
                }

                if (result.rows.length > 0 && result.rows[0].product_id != '-1'){
                    client.query('UPDATE "public".environment_products ' +
                        'SET status= ($1) ' +
                        'WHERE "public".environment_products.status = \'Active\' AND "public".environment_products.product_id = ' + result.rows[0].product_id + ' AND (select count("public".product_logical_units.product_id) ' +
                        'FROM "public".product_logical_units ' +
                        'WHERE "public".product_logical_units.product_id = ' + result.rows[0].product_id + ') = 0 RETURNING product_id', ['Inactive'], function (err,result) {
                        done();
                        if (err) {
                            logger.log('error', err.message);
                            return cb(err.message)
                        }
                        if (result.rows.length > 0){
                            client.query('WITH src AS ( ' +
                                'UPDATE "' + schema + '".tasks_products ' +
                                'SET task_product_status = ($1) ' +
                                'WHERE "' + schema + '".tasks_products.product_id = ' + result.rows[0].product_id + ' ' +
                                'RETURNING "' + schema + '".tasks_products.task_id ) ' +
                                ' ' +
                                'UPDATE "' + schema + '".tasks SET task_status = ($2) ' +
                                'FROM ( SELECT "' + schema + '".tasks_products.task_id FROM "' + schema + '".tasks_products ' +
                                'WHERE "' + schema + '".tasks_products.task_product_status = \'Active\' ' +
                                'GROUP BY "' + schema + '".tasks_products.task_id ' +
                                'HAVING COUNT(*) = 1 ' +
                                'INTERSECT ' +
                                'SELECT "' + schema + '".tasks_products.task_id ' +
                                'FROM "' + schema + '".tasks_products ' +
                                'WHERE "' + schema + '".tasks_products.product_id = ' + result.rows[0].product_id + ' ) AS sq ' +
                                'WHERE "' + schema + '".tasks.task_id = sq.task_id AND "' + schema + '".tasks.task_status = \'Active\'',['Inactive','Inactive'],function(err){
                                done();
                                if (err) {
                                    logger.log('error', err.message);
                                    return cb(err.message)
                                }
                                cb(null);
                            });
                        }
                        else {
                            cb(null);
                        }
                    });
                }
                else{
                    cb(null);
                }
            });
    });
};

var postLogicalUnit = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('INSERT INTO "' + schema + '".product_logical_units ' +
            '(lu_name, lu_description, be_id, lu_parent_id, lu_parent_name, product_id) ' +
            'VALUES ($1, $2, $3, $4, $5, $6) RETURNING lu_id',
            [
                req.body.lu_name,
                req.body.lu_description,
                req.body.be_id,
                req.body.lu_parent_id,
                req.body.lu_parent_name,
                -1
            ]
            , function (err, result) {
                done();
                if (err) {
                    logger.log('error', err.message);
                    return cb(err.message)
                }
                cb(null, {id: parseInt(result.rows[0].lu_id)});
            }
        );
    });
};

var getBusinessEntityProductCount = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('SELECT COUNT(be_id) FROM "' + schema + '".product_logical_units WHERE be_id = ' + req.params.beId + ' AND product_id <> -1',
            function (err, result) {
                done();
                if (err) {
                    logger.log('error', err.message);
                    return cb(err.message)
                }
                cb(null, parseInt(result.rows[0].count));
            }
        );
    });
};

var updateBusinessEntityDate = function (req) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return;
        }

        client.query('UPDATE "' + schema + '".business_entities ' +
            'SET be_last_updated_date=($1),' +
            'be_last_updated_by=($2) ' +
            'WHERE be_id = ' + req.params.beId,
            [
                (new Date()).toISOString(),
                req.decoded.username
            ],
            function (err) {
                done();
                if (err) {
                    logger.log('error', err.message);
                }
            });
    });
};

var deleteTaskForBE = function (req,cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return;
        }
        client.query('UPDATE "' + schema + '".tasks ' +
            'SET task_status=($1) ' +
            'WHERE be_id = ' + req.params.beId,
            [
                'Inactive'
            ],
            function (err) {
                done();
                if (err) {
                    logger.log('error', err.message);
                }
                cb(null);
            });
    });
};


module.exports = {
    getBusinessEntities: getBusinessEntities,
    postBusinessEntity: postBusinessEntity,
    putBusinessEntity: putBusinessEntity,
    deleteBusinessEntity: deleteBusinessEntity,
    getLogicalUnits: getLogicalUnits,
    getBusinessEntityLogicalUnits : getBusinessEntityLogicalUnits,
    putLogicalUnit : putLogicalUnit,
    deleteLogicalUnit : deleteLogicalUnit,
    postLogicalUnit : postLogicalUnit,
    getBusinessEntityProductCount : getBusinessEntityProductCount,
    updateBusinessEntityDate : updateBusinessEntityDate,
    deleteTaskForBE : deleteTaskForBE
};