var logger = require('../utils/logger');
var async = require('async');


var getDataCenters = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }
        client.query('SELECT * FROM "' + schema + '".data_centers', function (err, result) {
            done();
            if (err) {
                logger.log('error', err);
                return cb(err.message)
            }

            cb(null, result.rows);
        });
    });
};

var getDataCenter = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err);
            return cb(err.message)
        }

        client.query('SELECT * FROM "' + schema + '".data_centers WHERE data_center_id = ' + "\'" + req.params.dcId + "\'", function (err, result) {
            done();
            if (err) {
                logger.log('error', err.message);
                return cb(err.message)
            }

            cb(null, result.rows[0]);
        });
    });
};

var postDataCenter = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('INSERT INTO "' + schema + '".data_centers ' +
            '(data_center_name, data_center_description, data_center_created_by, data_center_etl_ip_address, ' +
            'data_center_creation_date, data_center_last_updated_date, data_center_expiration_date, data_center_last_updated_by, data_center_status) ' +
            'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [
                req.body.data_center_name,
                req.body.data_center_description,
                req.decoded.username,
                req.body.data_center_etl_ip_address,
                (new Date()).toISOString(),
                (new Date()).toISOString(),
                req.body.data_center_expiration_date,
                req.decoded.username,
                "Active"
            ]
            , function (err) {
                done();
                if (err) {
                    logger.log('error', err.message);
                    return cb(err.message)
                }
                cb(null);
            });
    });
};

var putDataCenter = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('UPDATE "' + schema + '".data_centers SET ' +
            'data_center_description=($1),' +
            'data_center_etl_ip_address=($2),' +
            'data_center_last_updated_date=($3),' +
            'data_center_expiration_date=($4),' +
            'data_center_last_updated_by=($5) ' +
            "WHERE data_center_Id = \'" + req.params.dcId + "\'",
            [
                req.body.data_center_description,
                req.body.data_center_etl_ip_address,
                (new Date()).toISOString(),
                req.body.data_center_expiration_date,
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

var deleteDataCenter = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('UPDATE "' + schema + '".data_centers SET ' +
            'data_center_status=($1), ' +
            'data_center_last_updated_date=($2), ' +
            'data_center_last_updated_by=($3) ' +
            "WHERE data_center_id = \'" + req.params.dcId + "\' RETURNING data_center_name",
            [
                'Inactive',
                (new Date()).toISOString(),
                req.decoded.username
            ], function (err,result) {
                done();
                if (err) {
                    logger.log('error', err.message);
                    return cb(err.message)
                }


                var queries = [
                    {
                        queryString : 'UPDATE "' + schema + '".environment_products ' +
                        'SET status=($1) ' +
                        'WHERE data_center_id = ' + req.params.dcId ,
                        queryValues : ['Inactive']
                    },
                    {
                        queryString : 'WITH src AS (  UPDATE "' + schema + '".tasks_products SET task_product_status = ($1) ' +
                        'FROM ( SELECT "' + schema + '".tasks_products.product_id FROM "' + schema + '".tasks_products ' +
                        'INNER JOIN "' + schema + '".environment_products ON ("' + schema + '".environment_products.product_id = "' + schema + '".tasks_products.product_id) ' +
                        'WHERE "' + schema + '".environment_products.data_center_id = ' + req.params.dcId + ' ' +
                        'GROUP BY "' + schema + '".tasks_products.product_id ) AS sq1 ' +
                        'WHERE"' + schema + '".tasks_products.product_id = sq1.product_id ' +
                        'RETURNING "' + schema + '".tasks_products.task_id )' +
                        ' ' +
                        'UPDATE "' + schema + '".tasks SET task_status = ($2) ' +
                        'FROM ( SELECT "' + schema + '".tasks_products.task_id FROM "' + schema + '".tasks_products ' +
                        'WHERE "' + schema + '".tasks_products.task_product_status = \'Active\' ' +
                        'GROUP BY "' + schema + '".tasks_products.task_id ' +
                        'HAVING COUNT(*) = 1 ' +
                        'INTERSECT ' +
                        'SELECT "' + schema + '".tasks_products.task_id FROM "' + schema + '".tasks_products ' +
                        'INNER JOIN "' + schema + '".environment_products ' +
                        'ON("' + schema + '".tasks_products.product_id = "' + schema + '".environment_products.product_id) ' +
                        'WHERE "' + schema + '".environment_products.data_center_id = ' + req.params.dcId + ' ' +
                        ') AS sq ' +
                        'WHERE "' + schema + '".tasks.task_id = sq.task_id AND "' + schema + '".tasks.task_status = \'Active\' ',
                        queryValues : ['Inactive','Inactive']
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
                    cb(null,result.rows[0].data_center_name);
                });
            }
        );
    });
};

var getDataCenterEnvironmentCount = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('SELECT * FROM "' + schema + '".environment_products ' +
            'WHERE "' + schema + '".environment_products.data_center_id = ' +  req.params.dcId, function(err, result) {
            done();
            if (err) {
                logger.log('error', err.message);
                return cb(err.message)
            }
            cb(null,result.rows);
        });

    });
};

module.exports = {
    getDataCenters: getDataCenters,
    getDataCenter: getDataCenter,
    postDataCenter: postDataCenter,
    putDataCenter: putDataCenter,
    deleteDataCenter: deleteDataCenter,
    getDataCenterEnvironmentCount : getDataCenterEnvironmentCount
};