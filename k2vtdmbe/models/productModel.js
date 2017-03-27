var logger = require('../utils/logger');
var _ = require('underscore');
var async = require('async');

var getProducts = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('SELECT * FROM "' + schema + '".products', function (err, result) {
            done();
            if (err) {
                logger.log('error', err.message);
                return cb(err.message)
            }

            result.rows = _.map(result.rows, function (row) {
                row.product_id = parseInt(row.product_id);
                return row;
            });

            cb(null, result.rows);
        });
    });
};

var getProduct = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('SELECT * FROM "' + schema + '".products WHERE "' + schema + '".products.product_id = ' + req.params.prodId, function (err, result) {
            done();
            if (err) {
                logger.log('error', err.message);
                return cb(err.message)
            }

            var product = {};
            if (result.rows.length > 0) {
                product = {
                    "product_id": result.rows[0].product_id,
                    "product_name": result.rows[0].product_name,
                    "product_description": result.rows[0].product_description,
                    "product_vendor": result.rows[0].product_vendor,
                    "product_version": result.rows[0].product_version
                }
            }

            cb(null, product);
        });
    });
};

var postProduct = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('INSERT INTO "' + schema + '".products ' +
            '(product_name, product_description, product_vendor, product_versions, product_created_by, ' +
            'product_creation_date, product_last_updated_date, product_last_updated_by, product_status) ' +
            'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING product_id',
            [
                req.body.product_name,
                req.body.product_description,
                req.body.product_vendor,
                req.body.product_versions,
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
                cb(null, {id: parseInt(result.rows[0].product_id)});
            }
        );
    });
};

var putProduct = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('UPDATE "' + schema + '".products SET ' +
            'product_name=($1),' +
            'product_description=($2),' +
            'product_vendor=($3),' +
            'product_versions=($4), ' +
            'product_last_updated_date=($5),' +
            'product_last_updated_by=($6) ' +
            'WHERE product_id = ' + req.params.prodId,
            [
                req.body.product_name,
                req.body.product_description,
                req.body.product_vendor,
                req.body.product_versions,
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

var deleteProduct = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('UPDATE "' + schema + '".products SET ' +
            'product_status=($1) ' +
            'WHERE product_id = ' + req.params.prodId + ' RETURNING product_name',
            [
                'Inactive'
            ], function (err,productResult) {
                done();
                if (err) {
                    logger.log('error', err.message);
                    return cb(err.message)
                }

                var queries = [
                    {
                        queryString : 'UPDATE "' + schema + '".product_logical_units ' +
                        'SET product_id=($1), product_name=($2) ' +
                        'WHERE product_id = ' + req.params.prodId ,
                        queryValues : [-1,'']
                    },
                    {
                        queryString : 'UPDATE "' + schema + '".environment_products ' +
                        'SET status=($1) ' +
                        'WHERE product_id = ' + req.params.prodId ,
                        queryValues : ['Inactive']
                    },
                    {
                        queryString: 'UPDATE "' + schema + '".environment_product_interfaces SET ' +
                        'env_product_interface_status=($1) ' +
                        'WHERE product_id = ' + req.params.prodId,
                        queryValues: ['Inactive']
                    },
                    {
                        queryString :'WITH src AS ( ' +
                        'UPDATE "' + schema + '".tasks_products ' +
                        'SET task_product_status = ($1) ' +
                        'WHERE "' + schema + '".tasks_products.product_id = ' + req.params.prodId + ' ' +
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
                        'WHERE "' + schema + '".tasks_products.product_id = ' + req.params.prodId + ' ) AS sq ' +
                        'WHERE "' + schema + '".tasks.task_id = sq.task_id AND "' + schema + '".tasks.task_status = \'Active\'',
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
                    cb(null,productResult.rows[0].product_name);
                });
            }
        );
    });
};

var getProductInterfaces = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('SELECT * FROM "' + schema + '".product_interfaces ' +
            'WHERE "' + schema + '".product_interfaces.product_id = ' + req.params.prodId,
            function (err, result) {
                done();
                if (err) {
                    logger.log('error', err.message);
                    return cb(err.message)
                }

                cb(null, result.rows);
            });
    });
};

var postProductInterface = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }
        client.query('INSERT INTO "' + schema + '".product_interfaces ' +
            '(product_id, interface_name, interface_type_id,interface_status) ' +
            'VALUES ($1, $2, $3, $4) RETURNING interface_id',
            [
                req.params.prodId,
                req.body.interface_name,
                req.body.interface_type_id,
                'Active'
            ]
            , function (err,result) {
                done();
                if (err) {
                    logger.log('error', err.message);
                    return cb(err.message);
                }
                cb(null,result.rows[0].interface_id);
            });
    });
};

var putProductInterface = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }
        client.query('UPDATE "' + schema + '".product_interfaces ' +
            'SET interface_name=($1),' +
            'interface_type_id=($2) ' +
            "WHERE interface_id = \'" + req.params.interfaceId + "\'",
            [
                req.body.interface_name,
                req.body.interface_type_id
            ],
            function (err) {
                done();
                if (err) {
                    logger.log('error', err.message);
                    return cb(err.message)
                }

                if (req.body.general_interface_type_id == req.body.interface_type_id){
                    return cb(null);
                }

                client.query('UPDATE "' + schema + '".environment_product_interfaces ' +
                    'SET db_host=($1), ' +
                    'db_port=($2), ' +
                    'db_user=($3), ' +
                    'db_password=($4), ' +
                    'db_schema=($5), ' +
                    'db_connection_string=($6) ' +
                    "WHERE interface_id = \'" + req.params.interfaceId + "\'",
                    [
                        null,null,null,null,null,null
                    ],function(err){
                        if (err) {
                            logger.log('error', err.message);
                            return cb(null)
                        }
                        cb(null);
                    });
            });
    });
};

var deleteProductInterface = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }
        var queries = [
            {
                queryString: 'UPDATE "' + schema + '".environment_product_interfaces ' +
                'SET env_product_interface_status = \'Inactive\'' +
                'WHERE product_id = \'' + req.params.prodId +'\' AND interface_id = \'' + req.params.interfaceId +'\'',
                queryValues: [],
                index : 1
            },
            {
                queryString: 'UPDATE "' + schema + '".environment_products ' +
                'SET status = \'Inactive\'' +
                "WHERE product_id = \'" + req.params.prodId + "\'",
                queryValues: [],
                index : 2
            },
            {
                queryString :'WITH src AS ( ' +
                'UPDATE "' + schema + '".tasks_products ' +
                'SET task_product_status = ($1) ' +
                'WHERE "' + schema + '".tasks_products.product_id = ' + req.params.prodId + ' ' +
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
                'WHERE "' + schema + '".tasks_products.product_id = ' + req.params.prodId + ' ) AS sq ' +
                'WHERE "' + schema + '".tasks.task_id = sq.task_id AND "' + schema + '".tasks.task_status = \'Active\'',
                queryValues : ['Inactive','Inactive'],
                index : 3
            },
            {
                queryString: 'UPDATE "' + schema + '".product_interfaces ' +
                'SET interface_status=($1)' +
                "WHERE interface_id = \'" + req.params.interfaceId + "\'",
                queryValues: ['Inactive'],
                index : 4
            }
        ];

        async.each(queries, function (query, callback) {

            if ((query.index == 1 && req.params.envCount > 0) || (query.index == 2 && req.params.interfaceCount == 1) || (query.index > 2) ) {
                client.query(query.queryString, query.queryValues, function (err) {
                    done();
                    if (err) {
                        logger.log('error', err.message);
                        return callback(err.message)
                    }
                    callback();
                });
            }
            else{
                callback();
            }

        }, function (err) {
            if (err) {
                logger.log('error', err.message);
                return cb(err.message)
            }
            cb(null);
        });
    });
};

var getProductLogicalUnits = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('SELECT * FROM "' + schema + '".product_logical_units ' +
            'INNER JOIN "' + schema + '".business_entities ON ("' + schema + '".product_logical_units.be_id = "' + schema + '".business_entities.be_id) ' +
            'WHERE product_logical_units.product_id = ' + req.params.prodId,
            function (err, result) {
                done();
                if (err) {
                    logger.log('error', err.message);
                    return cb(err.message)
                }

                cb(null, result.rows);
            }
        );
    });
};


var getLogicalUnitsWithoutProduct = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('SELECT * FROM "' + schema + '".product_logical_units ' +
            'INNER JOIN "' + schema + '".business_entities ON ("' + schema + '".product_logical_units.be_id = "' + schema + '".business_entities.be_id) ' +
            "WHERE product_id = -1 AND be_status = 'Active'",
            function (err, result) {
                done();
                if (err) {
                    logger.log('error', err.message);
                    return cb(err.message)
                }

                cb(null, result.rows);
            }
        );
    });
};

var getProductEnvironmentCount = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('SELECT * FROM "' + schema + '".environment_products ' +
            'INNER JOIN "' + schema + '".environments ' +
            'ON ("' + schema + '".environments.environment_id = "' + schema + '".environment_products.environment_id AND "' + schema + '".environments.environment_status = \'Active\' )'+
            'WHERE "' + schema + '".environment_products.product_id = ' +  req.params.productId + ' AND "' + schema + '".environment_products.status = \'Active\'',function(err, result) {
            done();
            if (err) {
                logger.log('error', err.message);
                return cb(err.message)
            }
            cb(null,result.rows);
        });

    });
};


var getProductsWithAtLeastOneLU = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('SELECT "' + schema + '".products.product_id,"' + schema + '".products.product_versions,"' + schema + '".products.product_name,COUNT("' + schema + '".product_logical_units.lu_id) as lus ' +
            'FROM "' + schema + '".products ' +
            'LEFT JOIN "' + schema + '".product_logical_units ON ("' + schema + '".product_logical_units.product_id = "' + schema + '".products.product_id) ' +
            'WHERE "' + schema + '".products.product_status = \'Active\' ' +
            'GROUP BY "' + schema + '".products.product_id ', function (err, result) {
            done();
            if (err) {
                logger.log('error', err.message);
                return cb(err.message)
            }

            result.rows = _.map(result.rows, function (row) {
                row.product_id = parseInt(row.product_id);
                return row;
            });

            cb(null, result.rows);
        });
    });
};

var updateProductDate = function (req) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return;
        }

        client.query('UPDATE "' + schema + '".products SET ' +
            'product_last_updated_date=($1),' +
            'product_last_updated_by=($2) ' +
            'WHERE product_id = ' + req.params.prodId,
            [
                (new Date()).toISOString(),
                req.decoded.username
            ], function (err) {
                done();
                if (err) {
                    logger.log('error', err.message);
                }
            }
        );
    });
};

module.exports = {
    getProducts : getProducts,
    getProduct : getProduct,
    postProduct : postProduct,
    putProduct : putProduct,
    deleteProduct : deleteProduct,
    getProductInterfaces : getProductInterfaces,
    postProductInterface : postProductInterface,
    putProductInterface : putProductInterface,
    deleteProductInterface : deleteProductInterface,
    getProductLogicalUnits : getProductLogicalUnits,
    getLogicalUnitsWithoutProduct : getLogicalUnitsWithoutProduct,
    getProductEnvironmentCount : getProductEnvironmentCount,
    getProductsWithAtLeastOneLU : getProductsWithAtLeastOneLU,
    updateProductDate : updateProductDate
};