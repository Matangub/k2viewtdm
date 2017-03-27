var logger = require('../utils/logger');
var _ = require('underscore');
var async = require('async');


var getInterval = function(interval){
    if (interval == 'Day'){
        return '1 day'
    }
    else if (interval == 'Week'){
        return '1 week'
    }
    else if (interval == 'Month'){
        return '1 month'
    }
    else if (interval == '3Month'){
        return '3 month'
    }
    else if (interval == 'Year'){
        return '1 year'
    }
    else {
        return '1 month'
    }
};

var getEnvironments = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err);
            return cb(err)
        }

        client.query('SELECT "' + schema + '".environments.environment_id, ' +
            '"' + schema + '".environments.environment_name, "' + schema + '".environments.environment_description, ' +
            '"' + schema + '".environments.environment_point_of_contact_first_name, "' + schema + '".environments.environment_point_of_contact_last_name, ' +
            '"' + schema + '".environments.environment_point_of_contact_phone1, "' + schema + '".environments.environment_point_of_contact_phone2, ' +
            '"' + schema + '".environments.environment_point_of_contact_email, "' + schema + '".environments.environment_created_by, ' +
            '"' + schema + '".environments.environment_creation_date, "' + schema + '".environments.environment_last_updated_date, ' +
            '"' + schema + '".environments.environment_last_updated_by, "' + schema + '".environments.environment_status, ' +
            '"' + schema + '".environment_owners.user_name ' +
            ' FROM "' + schema + '".environments ' +
            'LEFT JOIN "' + schema + '".environment_owners ON ( ' +
            '"' + schema + '".environments.environment_id = "' + schema + '".environment_owners.environment_id )', function (err, result) {
            done();
            if (err) {
                logger.log('error', err);
                return cb(err)
            }

            result.rows = _.groupBy(result.rows, function (o) {
                return o.environment_id;
            });

            var environments = [];
            for (var environmentId in result.rows) {
                var environmentsGroup = result.rows[environmentId];
                var environment = {};
                for (var i = 0;i < environmentsGroup.length ; i++){
                    if (i == 0){
                        environment = environmentsGroup[i];
                        environment.environment_id = parseInt(environment.environment_id);
                        environment.owners = [];
                        if (environment.user_name){
                            environment.owners.push(environment.user_name);
                        }
                    }
                    else{
                       if (environmentsGroup[i].user_name){
                           environment.owners.push(environmentsGroup[i].user_name);
                       }
                    }
                }
                environments.push(environment);
            }
            return cb(null,environments);
        });
    });
};

var getEnvironmentsByUser = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('SELECT * FROM "' + schema + '".environments ' +
            'INNER JOIN "' + schema + '".environment_role_users ' +
            'ON ("' + schema + '".environments.environment_id = "' + schema + '".environment_role_users.environment_id) ' +
            'INNER JOIN "' + schema + '".environment_roles ' +
            'ON ("' + schema + '".environments.environment_id = "' + schema + '".environment_roles.environment_id AND ' +
            '"' + schema + '".environment_roles.role_status = \'Active\' AND "' + schema + '".environment_role_users.role_id = "' + schema + '".environment_roles.role_id ) ' +
            "WHERE user_id = \'" + req.decoded.user_id + "\'", function (err, result) {
            done();
            if (err) {
                logger.log('error', err.message);
                return cb(err.message)
            }

            if (result.rows.length > 0) {
                result.rows = _.map(result.rows, function (row) {
                    row.environment_id = parseInt(row.environment_id);
                    return row;
                });

                cb(null, result.rows);
            }
            else {
                client.query('SELECT * FROM "' + schema + '".environments ' +
                    'INNER JOIN "' + schema + '".environment_owners ' +
                    'ON ("' + schema + '".environments.environment_id = "' + schema + '".environment_owners.environment_id) ' +
                    "WHERE user_id = \'" + req.decoded.user_id + "\'", function (err, result) {
                    done();
                    if (err) {
                        logger.log('error', err.message);
                        return cb(err.message)
                    }

                    result.rows = _.map(result.rows, function (row) {
                        row.environment_id = parseInt(row.environment_id);
                        return row;
                    });

                    cb(null, result.rows);
                });
            }
        });
    });
};

var getEnvironment = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('SELECT * FROM "' + schema + '".environments WHERE environment_id = ' + req.params.envId, function (err, result) {
            done();
            if (err) {
                logger.log('error', err.message);
                return cb(err.message)
            }

            result.rows = _.map(result.rows, function (row) {
                row.environment_id = parseInt(row.environment_id);
                return row;
            });

            cb(null, result.rows);
        });
    });
};

var postEnvironment = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('INSERT INTO "' + schema + '".environments (environment_name, environment_description, ' +
            'environment_point_of_contact_first_name, environment_point_of_contact_last_name, ' +
            'environment_point_of_contact_phone1, environment_point_of_contact_phone2, environment_point_of_contact_email, environment_created_by,' +
            'environment_creation_date, environment_last_updated_date, environment_last_updated_by, environment_status) ' +
            'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING environment_id',
            [
                req.body.environment_name,
                req.body.environment_description,
                req.body.environment_point_of_contact_fist_name,
                req.body.environment_point_of_contact_last_name,
                req.body.environment_point_of_contact_phone1,
                req.body.environment_point_of_contact_phone2,
                req.body.environment_point_of_contact_email,
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
                cb(null, {id: parseInt(result.rows[0].environment_id)});
            }
        );
    });
};

var putEnvironment = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('UPDATE "' + schema + '".environments SET ' +
            'environment_name=($1),' +
            'environment_description=($2),' +
            'environment_point_of_contact_first_name=($3),' +
            'environment_point_of_contact_last_name=($4),' +
            'environment_point_of_contact_phone1=($5),' +
            'environment_point_of_contact_phone2=($6),' +
            'environment_point_of_contact_email=($7),' +
            'environment_last_updated_date=($8),'+
            'environment_last_updated_by=($9) '+
            'WHERE environment_id = ' + req.params.envId,
            [
                req.body.environment_name,
                req.body.environment_description,
                req.body.environment_point_of_contact_first_name,
                req.body.environment_point_of_contact_last_name,
                req.body.environment_point_of_contact_phone1,
                req.body.environment_point_of_contact_phone2,
                req.body.environment_point_of_contact_email,
                (new Date()).toISOString(),
                req.decoded.username
            ], function (err) {
                done();
                if (err) {
                    logger.log('error', err.message);
                    return cb(err.message)
                }

                client.query('DELETE FROM "' + schema + '".environment_owners WHERE environment_id = ($1)',
                    [
                        req.params.envId
                    ],
                    function (err) {
                        done();
                        if (err) {
                            logger.log('error', err.message);
                            return callback(err.message)
                        }

                        async.each(req.body.owners, function (owner, callback) {
                            client.query('INSERT INTO "' + schema + '".environment_owners (environment_id, user_id, user_name) VALUES ($1, $2, $3)',
                                [
                                    req.params.envId,
                                    owner.user_id,
                                    owner.username ? owner.username : owner.user_name
                                ],
                                function (err) {
                                    done();
                                    if (err) {
                                        logger.log('error', err.message);
                                        return callback(err.message)
                                    }

                                    callback(null);
                                });
                        }, function (err) {
                            if (err) {
                                logger.log('error', err.message);
                                return cb(err.message)
                            }

                            cb(null);
                        });
                    });
            }
        );
    });
};

var deleteEnvironment = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('UPDATE "' + schema + '".environments SET ' +
            'environment_status=($1) '+
            'WHERE environment_id = ' + req.params.envId,
            [
                'Inactive'
            ], function (err,result) {
                done();
                if (err) {
                    logger.log('error', err.message);
                    return cb(err.message)
                }

                var queries = [
                    {
                        queryString: 'UPDATE "' + schema + '".tasks ' +
                        'SET task_status = \'Inactive\'' +
                        'WHERE environment_id = ' + req.params.envId,
                        queryValues: []
                    },
                    {
                        queryString: 'UPDATE "' + schema + '".environment_products ' +
                        'SET status = \'Inactive\'' +
                        "WHERE environment_id = \'" + req.params.envId + "\'",
                        queryValues: []
                    },
                    {
                        queryString: 'UPDATE "' + schema + '".environment_roles ' +
                        'SET role_status = \'Inactive\'' +
                        "WHERE environment_id = \'" + req.params.envId + "\'",
                        queryValues: []
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
                    cb(null);
                });
            }
        );
    });
};

var getEnvironmentOwners = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('SELECT user_id, user_name FROM "' + schema + '".environment_owners WHERE environment_id = ' + req.params.envId, function (err, result) {
            done();
            if (err) {
                logger.log('error', err.message);
                return cb(err.message)
            }

            cb(null, result.rows);
        });
    })
};

var getRoles = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('SELECT * FROM "' + schema + '".environment_roles ' +
            'WHERE environment_id = ' + req.params.envId, function (err, result) {
            done();
            if (err) {
                logger.log('error', err.message);
                return cb(err.message)
            }

            result.rows = _.map(result.rows, function (row) {
                row.role_id = parseInt(row.role_id);
                row.environment_id = parseInt(row.environment_id);
                row.allowed_number_of_entities_to_copy = parseInt(row.allowed_number_of_entities_to_copy);
                return row;
            });

            cb(null, result.rows);
        });
    });
};

var postRole = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('INSERT INTO "' + schema + '".environment_roles (environment_id, role_name,' +
            'role_description, allowed_delete_before_load, allowed_creation_of_synthetic_data, ' +
            'allowed_random_entity_selection, allowed_request_of_fresh_data, allowed_task_scheduling, ' +
            'allowed_number_of_entities_to_copy, allowed_refresh_reference_data, role_created_by, role_creation_date, role_last_updated_date,' +
            'role_expiration_date,role_last_updated_by,role_status,allowed_replace_sequences) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,$17) RETURNING role_id',
            [
                req.params.envId,
                req.body.role_name,
                req.body.role_description,
                req.body.allowed_delete_before_load,
                req.body.allowed_creation_of_synthetic_data,
                req.body.allowed_random_entity_selection,
                req.body.allowed_request_of_fresh_data,
                req.body.allowed_task_scheduling,
                req.body.allowed_number_of_entities_to_copy,
                req.body.allowed_refresh_reference_data,
                req.decoded.username,
                (new Date()).toISOString(),
                (new Date()).toISOString(),
                req.body.role_expiration_date,
                req.decoded.username,
                'Active',
                req.body.allowed_replace_sequences
            ]
            , function (err, result) {
                done();
                if (err) {
                    logger.log('error', err.message);
                    return cb(err.message)
                }
                cb(null, {id: parseInt(result.rows[0].role_id)});
            });
    });
};

var putRole = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('UPDATE "' + schema + '".environment_roles SET ' +
            'role_name=($1),' +
            'role_description=($2),' +
            'allowed_delete_before_load=($3),' +
            'allowed_creation_of_synthetic_data=($4),' +
            'allowed_random_entity_selection=($5),' +
            'allowed_task_scheduling=($6),' +
            'allowed_number_of_entities_to_copy=($7),' +
            'allowed_request_of_fresh_data=($8),' +
            'allowed_replace_sequences=($9),' +
            'allowed_refresh_reference_data=($10),' +
            'role_last_updated_date=($11),'+
            'role_last_updated_by=($12)'+
            "WHERE environment_id = " + req.params.envId + " AND role_id = \'" + req.params.roleId + "\'",
            [
                req.body.role_name,
                req.body.role_description,
                req.body.allowed_delete_before_load,
                req.body.allowed_creation_of_synthetic_data,
                req.body.allowed_random_entity_selection,
                req.body.allowed_task_scheduling,
                req.body.allowed_number_of_entities_to_copy,
                req.body.allowed_request_of_fresh_data,
                req.body.allowed_replace_sequences,
                req.body.allowed_refresh_reference_data,
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

var deleteRole = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('UPDATE "' + schema + '".environment_roles SET ' +
            'role_status=($1) ' +
            "WHERE environment_id = " + req.params.envId + " AND role_id = \'" + req.params.roleId + "\'",
            [
                'Inactive'
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
}

var getEnvRoleUsers = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('SELECT * FROM "' + schema + '".environment_role_users ' +
            'WHERE environment_id = ' + req.params.envId + ' AND role_id = ' + req.params.roleId, function (err, result) {
            done();
            if (err) {
                logger.log('error', err.message);
                return cb(err.message)
            }

            cb(null, result.rows);
        });
    });
};

var postEnvRoleUsers = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('DELETE FROM "' + schema + '".environment_role_users WHERE environment_id = ' + req.params.envId + " AND role_id = " + req.params.roleId, function (err) {
            done();
            if (err) {
                logger.log('error', err.message);
                return cb(err.message)
            }

            async.each(req.body, function (user, callback) {

                client.query('INSERT INTO "' + schema + '".environment_role_users (environment_id, role_id, user_id, username) VALUES ($1, $2, $3, $4)',
                    [
                        req.params.envId,
                        req.params.roleId,
                        user.user_id,
                        user.username
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

var getEnvironmentTaskCount = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('SELECT COUNT (environment_id) FROM "' + schema + '".tasks ' + 'WHERE "' + schema + '".tasks.environment_id = ' +  req.params.envId ,function(err, result) {
            done();
            if (err) {
                logger.log('error', err.message);
                return cb(err.message)
            }
            cb(null,result.rows[0].count != "0");
        });
    });
};

var getEnvProducts = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('SELECT * FROM "' + schema + '".environment_products ' +
            'INNER JOIN "' + schema + '".products ' +
            'ON ("' + schema + '".environment_products.product_id = "' + schema + '".products.product_id) ' +
            'INNER JOIN "' + schema + '".environment_product_interfaces ' +
            'ON ("' + schema + '".environment_products.environment_product_id = "' + schema + '".environment_product_interfaces.env_product_interface_id) ' +
            'INNER JOIN "' + schema + '".product_interfaces ' +
            'ON ("' + schema + '".product_interfaces.interface_id = "' + schema + '".environment_product_interfaces.interface_id) ' +
            'INNER JOIN "' + schema + '".data_centers ' +
            'ON ("' + schema + '".environment_products.data_center_id = "' + schema + '".data_centers.data_center_id) ' +
            'WHERE "' + schema + '".environment_products.environment_id = ' + req.params.envId, function (err, result) {
            done();
            if (err) {
                logger.log('error', err.message);
                return cb(err.message);
            }

            result.rows = _.map(result.rows, function (row) {
                row.product_id = parseInt(row.product_id);
                row.environment_id = parseInt(row.environment_id);
                row.environment_product_id =  parseInt(row.environment_product_id);
                return row;
            });

            var groupByProduct = _.groupBy(result.rows, function (o) {
                return o.environment_product_id;
            });

            var productsData = [];
            for (var envProductId in groupByProduct) {
                var products = groupByProduct[envProductId];
                var productData = {};
                if (products.length > 0) {
                    productData.environment_product_id = products[0].environment_product_id;
                    productData.product_id = products[0].product_id;
                    productData.product_name = products[0].product_name;
                    productData.product_description = products[0].product_description;
                    productData.product_vendor = products[0].product_vendor;
                    productData.product_versions = products[0].product_versions;
                    productData.product_status = products[0].product_status;
                    productData.data_center_id = products[0].data_center_id;
                    productData.data_center_name = products[0].data_center_name;
                    productData.product_version = products[0].product_version;
                    productData.created_by = products[0].created_by;
                    productData.creation_date = products[0].creation_date;
                    productData.last_updated_date = products[0].last_updated_date;
                    productData.last_updated_by = products[0].last_updated_by;
                    productData.status = products[0].status;
                    productData.interfaces = [];
                    _.each(products, function (product) {
                        if (product.interface_id != null) {
                            var interface = {};
                            interface.interface_id = product.interface_id;
                            interface.interface_name = product.interface_name;
                            interface.interface_type_id = product.interface_type_id;
                            interface.db_host = product.db_host;
                            interface.db_port = parseInt(product.db_port);
                            interface.db_user = product.db_user;
                            interface.db_password = product.db_password;
                            interface.db_schema = product.db_schema;
                            interface.db_connection_string = product.db_connection_string;
                            interface.env_product_interface_status = product.env_product_interface_status;
                            interface.env_product_interface_id = product.env_product_interface_id;
                            productData.interfaces.push(interface);
                        }
                    });
                    productsData.push(productData);
                }
            }
            cb(null, productsData);
        });
    });
};

var postEnvProduct = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err);
            return cb(err)
        }
        client.query('INSERT INTO "' + schema + '".environment_products ' +
            '(environment_id, product_id, data_center_id, product_version, created_by, creation_date, last_updated_date, last_updated_by, status) ' +
            'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING environment_product_id',
            [
                req.params.envId,
                req.body.product_id,
                req.body.data_center_id,
                req.body.product_version,
                req.decoded.username,
                (new Date()).toISOString(),
                (new Date()).toISOString(),
                req.decoded.username,
                'Active'
            ]
            , function (err,result) {
                done();
                if (err) {
                    logger.log('error', err.message);
                    return cb(err.message)
                }

                if (req.body.interfaces && req.body.interfaces.length > 0) {
                    async.each(req.body.interfaces, function (interface, callback) {
                        client.query('INSERT INTO "' + schema + '".environment_product_interfaces ' +
                            '(environment_id, product_id, interface_id, db_host, db_port, db_user, db_password, db_schema, db_connection_string,env_product_interface_id,env_product_interface_status) ' +
                            'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,$11)',
                            [
                                req.params.envId,
                                req.body.product_id,
                                interface.interface_id,
                                interface.db_host,
                                interface.db_port,
                                interface.db_user,
                                interface.db_password,
                                interface.db_schema,
                                interface.db_connection_string,
                                result.rows[0].environment_product_id,
                                'Active'
                            ]
                            , function (err) {
                                done();
                                if (err) {
                                    logger.log('error', err.message);
                                    return callback(err.message)
                                }

                                callback(null);
                            });
                    }, function(err) {
                        if( err ) {
                            return cb(err.message)
                        }
                        cb(null, {})

                    });
                } else {
                    cb(null, {});
                }
            });
    });
};

var putEnvProduct = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('UPDATE "' + schema + '".environment_products SET ' +
            'data_center_id=($1),' +
            'product_version=($2),' +
            'last_updated_date=($3),' +
            'last_updated_by=($4) ' +
            'WHERE environment_product_id = ' + req.body.environment_product_id,
            [
                req.body.data_center_id,
                req.body.product_version,
                (new Date()).toISOString(),
                req.decoded.username

            ], function (err) {
                done();
                if (err) {
                    logger.log('error', err.message);
                    return cb(err.message)
                }
                if (req.body.interfaces && req.body.interfaces.length > 0) {
                    async.each(req.body.interfaces, function (interface, callback) {
                        if (interface.newInterface == true && !interface.env_product_interface_status){
                            client.query('INSERT INTO "' + schema + '".environment_product_interfaces ' +
                                '(environment_id, product_id, interface_id, db_host, db_port, db_user, db_password, db_schema, db_connection_string,env_product_interface_id,env_product_interface_status) ' +
                                'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
                                [
                                    req.params.envId,
                                    req.body.product_id,
                                    interface.interface_id,
                                    interface.db_host,
                                    interface.db_port,
                                    interface.db_user,
                                    interface.db_password,
                                    interface.db_schema,
                                    interface.db_connection_string,
                                    req.body.environment_product_id,
                                    'Active'
                                ]
                                , function (err) {
                                    done();
                                    if (err) {
                                        logger.log('error', err.message);
                                        return callback(err.message)
                                    }

                                    callback(null);
                                });
                        }
                        else {
                            client.query('UPDATE "' + schema + '".environment_product_interfaces SET ' +
                                'db_host=($1),' +
                                'db_port=($2),' +
                                'db_user=($3),' +
                                'db_password=($4),' +
                                'db_schema=($5),' +
                                'db_connection_string=($6) ' +
                                'WHERE env_product_interface_id = ' + interface.env_product_interface_id + ' AND interface_id = ' + "\'" + interface.interface_id + "\'",
                                [
                                    interface.db_host,
                                    interface.db_port,
                                    interface.db_user,
                                    interface.db_password,
                                    interface.db_schema,
                                    interface.db_connection_string
                                ], function (err) {
                                    done();
                                    if (err) {
                                        logger.log('error', err.message);
                                        return callback(err.message)
                                    }

                                    callback(null);
                                }
                            );
                        }
                    }, function(err) {
                        if( err ) {
                            return cb(err.message)
                        }
                        cb(null)
                    });
                }
                else {
                    cb(null);
                }
            }
        );
    });
};

var deleteEnvProduct = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        var queries = [
            {
                queryString: 'UPDATE "' + schema + '".environment_products SET ' +
                'status=($1) ' +
                'WHERE environment_id = ' + req.params.envId + ' AND product_id = ' + req.params.prodId,
                queryValues: ['Inactive']
            },
            {
                queryString: 'UPDATE "' + schema + '".environment_product_interfaces SET ' +
                'env_product_interface_status=($1) ' +
                'WHERE environment_id = ' + req.params.envId + ' AND product_id = ' + req.params.prodId,
                queryValues: ['Inactive']
            }
        ];

        async.each(queries, function (query, callback) {
            client.query(query.queryString,query.queryValues, function (err) {
                done();
                if (err) {
                    logger.log('error', err.message);
                    return cb(err.message)
                }
                callback(null);
            });
        }, function (err) {
            if (err) {
                logger.log('error', err.message);
                return cb(err.message)
            }

            cb(null);
        });
    });
};

var getTesters = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('SELECT * FROM "' + schema + '".environment_role_users ' +
            'INNER JOIN "' + schema + '".environment_roles ' +
            'ON ("' + schema + '".environment_role_users.role_id = "' + schema + '".environment_roles.role_id) ' +
            'WHERE "' + schema + '".environment_roles.role_status = \'Active\'' , function (err, result) {
            done();
            if (err) {
                logger.log('error', err.message);
                return cb(err.message)
            }

            var freeTesters = [];
            _.each(req.testers, function (tester) {
                if (!_.find(result.rows, {user_id: tester.uid, environment_id: req.params.envId})) {
                    freeTesters.push(tester);
                }
            });

            cb(null, freeTesters);
        });
    });
};

var extractExecutionStatus = function(executionsStatusGroup){
    var executionsStatus = {
        failed : 0,
        pending : 0,
        paused : 0 ,
        stopped : 0,
        running : 0,
        completed: 0
    };
    for (var execution_id in executionsStatusGroup) {
        if (_.findIndex(executionsStatusGroup[execution_id],function(execution) {
                if (!execution.execution_status){
                    return false;
                }
                return  (execution.execution_status.toUpperCase() == 'FAILED');
            }) >= 0){
            executionsStatus.failed++;
            continue;
        }
        else if (_.findIndex(executionsStatusGroup[execution_id],function(execution) {
                if (!execution.execution_status){
                    return false;
                }
                return  (execution.execution_status.toUpperCase() == 'PENDING');
            }) >= 0){
            executionsStatus.pending++;
            continue;
        }
        else if (_.findIndex(executionsStatusGroup[execution_id],function(execution) {
                if (!execution.execution_status){
                    return false;
                }
                return  (execution.execution_status.toUpperCase() == 'PAUSED');
            }) >= 0){
            executionsStatus.paused++;
            continue;
        }
        else if (_.findIndex(executionsStatusGroup[execution_id],function(execution) {
                if (!execution.execution_status){
                    return false;
                }
                return  (execution.execution_status.toUpperCase() == 'STOPPED');
            }) >= 0){
            executionsStatus.stopped++;
            continue;
        }
        else {
            var runningFound = false;
            for (var i = 0; i < executionsStatusGroup[execution_id].length; i++){
                if (!executionsStatusGroup[execution_id][i].execution_status)
                {
                    continue;
                }
                if (executionsStatusGroup[execution_id][i].execution_status.toUpperCase() == 'RUNNING' || executionsStatusGroup[execution_id][i].execution_status.toUpperCase() == 'EXECUTING' ||
                    executionsStatusGroup[execution_id][i].execution_status.toUpperCase() == 'STARTED' || executionsStatusGroup[execution_id][i].execution_status.toUpperCase() == 'STARTEXECUTIONREQUESTED'){
                    executionsStatus.running++;
                    runningFound = true;
                    break;
                }
            }
            if (runningFound){
                continue;
            }
        }
        executionsStatus.completed++;
    }
    return executionsStatus;
};

var getSummary = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }
        var data = {};
        data.environment = req.params.envId;
        data.interval = req.params.interval;

        var queries = [
            {
                queryString : 'SELECT count(*) as numberOfTesters FROM  "' + schema + '".environment_role_users  ' +
                'INNER JOIN "' + schema + '".environment_roles  ON ("' + schema + '".environment_role_users.role_id = "' + schema + '".environment_roles.role_id)' +
                ' WHERE "' + schema + '".environment_roles.role_status = \'Active\' and "' + schema + '".environment_roles.environment_id = ' + req.params.envId,
                index : 'numberOfTesters'
            },
            {
                queryString : 'SELECT COUNT(case when "' + schema + '".tasks.task_execution_status = \'Active\' then 1 end) as active ,' +
                'COUNT(case when "' + schema + '".tasks.task_execution_status = \'onHold\' then 1 end  )  as onHold' +
                ' FROM "' + schema + '".tasks ' +
                ' where "' + schema + '".tasks.environment_id = ' + req.params.envId + ' AND "' + schema + '".tasks.task_status = \'Active\'',
                index : 'tasks'
            },
            {

                queryString : 'SELECT "' + schema + '".task_execution_list.task_execution_id,"' + schema + '".task_execution_list.execution_status FROM "' + schema + '".task_execution_list ' +
                ' WHERE "' + schema + '".task_execution_list.environment_id=' + req.params.envId + ' AND  (  select now() - interval \'' + getInterval(req.params.interval) + '\')  <= "' + schema + '".task_execution_list.creation_date',
                index : 'taskExecutionStatus'
            },
            {
                queryString : 'Select sum(num_of_processed_entities) from ' +
                '(select distinct COALESCE("' + schema + '".task_execution_list.num_of_processed_entities,0) num_of_processed_entities , "' + schema + '".task_execution_list.task_execution_id ' +
                'from "' + schema + '".task_execution_list ' +
                'Where "' + schema + '".task_execution_list.environment_id = ' + req.params.envId + ' ' +
                'And  "' + schema + '".task_execution_list.creation_date >= (  select now() - interval \'' + getInterval(req.params.interval) + '\') ) t',
                index : 'processedEntities'
            }
        ];




        async.each(queries, function (query, callback) {
            client.query(query.queryString, function (err, result) {
                done();
                if (err) {
                    logger.log('error', err.message);
                    return cb(err.message)
                }

                if (query.index == 'taskExecutionStatus'){
                    var executionsStatusGroup = _.groupBy(result.rows, function (o) {
                        return o.task_execution_id;
                    });
                    data[query.index] = extractExecutionStatus(executionsStatusGroup)
                }
                else{
                    data[query.index] = result.rows[0];
                }
                callback(null);
            });
        }, function (err) {
            if (err) {
                logger.log('error', err.message);
                return cb(err.message)
            }

            cb(null, data);
        });
    })
};

var updateEnvironmentDate = function (req) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return;
        }

        client.query('UPDATE "' + schema + '".environments SET ' +
            'environment_last_updated_date=($1),'+
            'environment_last_updated_by=($2) '+
            'WHERE environment_id = ' + req.params.envId,
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
    getEnvironments : getEnvironments,
    getEnvironmentsByUser : getEnvironmentsByUser,
    getEnvironment : getEnvironment,
    postEnvironment : postEnvironment,
    putEnvironment : putEnvironment,
    deleteEnvironment : deleteEnvironment,
    getEnvironmentOwners : getEnvironmentOwners,
    getRoles : getRoles,
    postRole : postRole,
    putRole : putRole,
    deleteRole : deleteRole,
    getEnvRoleUsers : getEnvRoleUsers,
    postEnvRoleUsers : postEnvRoleUsers,
    getEnvironmentTaskCount : getEnvironmentTaskCount,
    getEnvProducts : getEnvProducts,
    postEnvProduct : postEnvProduct,
    putEnvProduct : putEnvProduct,
    deleteEnvProduct : deleteEnvProduct,
    getTesters : getTesters,
    getSummary : getSummary,
    updateEnvironmentDate : updateEnvironmentDate
};