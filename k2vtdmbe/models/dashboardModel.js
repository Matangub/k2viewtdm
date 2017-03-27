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

var getTasksStatus = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        var query = 'SELECT "' + schema + '".tasks.task_status,"' + schema + '".tasks.task_execution_status,count(distinct "' + schema + '".tasks.task_id) ' +
            'FROM "' + schema + '".tasks ' +
            'where "' + schema + '".tasks.task_creation_date >= (  select now() - interval \'' + getInterval(req.params.interval) + '\') ';

        if (req.decoded.role.id == 1){
            if (req.decoded.role.tdmType == 'owner'){
                query = query + ' and "' + schema + '".tasks.environment_id in ( select environment_id from environment_owners e ' +
                    'where e.user_name = \'' + req.decoded.username + '\' )';
            }
            else if (req.decoded.role.tdmType == 'tester'){
                query = query + 'AND "' + schema + '".tasks.environment_id in (select environment_role_users.environment_id from environment_role_users, environment_roles ' +
                    'where environment_roles.role_id = environment_role_users.role_id ' +
                    'and environment_roles.environment_id = environment_role_users.environment_id ' +
                    'and username = \'' + req.decoded.username + '\' ' +
                    'and role_status = \'Active\') ';
            }
            else{
                return cb('You are not allowed to see this data');
            }
        }
        query = query + 'group by "' + schema + '".tasks.task_status,"' + schema + '".tasks.task_execution_status ';
        client.query(query, function (err, result) {
            done();
            if (err) {
                logger.log('error', err.message);
                return cb(err.message)
            }
            cb(null,result.rows);
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
                return (execution.execution_status.toUpperCase() == 'FAILED');
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
            if (runningFound == true){
                continue;
            }
        }
        executionsStatus.completed++;
    }
    return executionsStatus;
};

var getTasksExecutionsStatus = function(req,cb){
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }
        var query = "";
        query = query + 'SELECT "' + schema + '".task_execution_list.task_execution_id,"' + schema + '".task_execution_list.execution_status FROM "' + schema + '".task_execution_list ' +
            ' WHERE date_trunc(\'day\', NOW() - interval \'' + getInterval(req.params.interval) + '\') <= "' + schema + '".task_execution_list.creation_date '
        if (req.decoded.role.id == 1){
            if (req.decoded.role.tdmType == 'owner'){
                query = query + '  and "' + schema + '".task_execution_list.environment_id in ( select environment_id from environment_owners e ' +
                    'where e.user_name = \'' + req.decoded.username + '\' )';
            }
            else if (req.decoded.role.tdmType == 'tester'){
                query = query + 'AND "' + schema + '".task_execution_list.environment_id in (select environment_role_users.environment_id from environment_role_users, environment_roles ' +
                    'where environment_roles.role_id = environment_role_users.role_id ' +
                    'and environment_roles.environment_id = environment_role_users.environment_id ' +
                    'and username = \'' + req.decoded.username + '\' ' +
                    'and role_status = \'Active\') ';
            }
            else{
                return cb('You are not allowed to see this data');
            }
        }
        client.query(query, function (err, result) {
            done();
            if (err) {
                logger.log('error', err.message);
                return cb(err.message)
            }

            var executionsStatusGroup = _.groupBy(result.rows, function (o) {
                return o.task_execution_id;
            });

            cb(null,extractExecutionStatus(executionsStatusGroup));
        });
    });
};

var getTasksPerBE = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        var query = "";
        query = query + 'SELECT "' + schema + '".business_entities.be_name,"' + schema + '".business_entities.be_id,COUNT("' + schema + '".tasks.task_id) FROM "' + schema + '".tasks ' +
            'INNER JOIN "' + schema + '".business_entities ON("' + schema + '".business_entities.be_id = "' + schema + '".tasks.be_id) ' +
            'WHERE (  select now() - interval \'' + getInterval(req.params.interval) + '\') <= "' + schema + '".tasks.task_creation_date AND "public".tasks.task_status = \'Active\' ';
        if (req.decoded.role.id == 1){
            if (req.decoded.role.tdmType == 'owner'){
                query = query + ' and "' + schema + '".tasks.environment_id in ( select environment_id from environment_owners e ' +
                    'where e.user_name = \'' + req.decoded.username + '\' )';
            }
            else if (req.decoded.role.tdmType == 'tester'){
                query = query + 'AND "' + schema + '".tasks.environment_id in (select environment_role_users.environment_id from environment_role_users, environment_roles ' +
                    'where environment_roles.role_id = environment_role_users.role_id ' +
                    'and environment_roles.environment_id = environment_role_users.environment_id ' +
                    'and username = \'' + req.decoded.username + '\' ' +
                    'and role_status = \'Active\') ';
            }
            else{
                return cb('You are not allowed to see this data');
            }
        }
        query = query + 'GROUP BY "' + schema + '".business_entities.be_name,"' + schema + '".business_entities.be_id';

        client.query(query, function (err, result) {
            done();
            if (err) {
                logger.log('error', err.message);
                return cb(err.message)
            }

            async.each(result.rows, function (be, callback) {
                var beQuery = "";
                beQuery = beQuery + 'SELECT "' + schema + '".task_execution_list.task_execution_id,"' + schema + '".task_execution_list.execution_status FROM "' + schema + '".task_execution_list ';
                beQuery = beQuery + 'WHERE (  select now() - interval \'' + getInterval(req.params.interval) + '\') <= "' + schema + '".task_execution_list.creation_date AND ' + be.be_id + ' = "' + schema + '".task_execution_list.be_id ';
                beQuery = beQuery + 'GROUP BY "' + schema + '".task_execution_list.task_execution_id,"' + schema + '".task_execution_list.execution_status';
                client.query(beQuery, function (err, result) {
                    done();
                    if (err) {
                        logger.log('error', err.message);
                        return cb(err.message)
                    }

                    var executionsStatusGroup = _.groupBy(result.rows, function (o) {
                        return o.task_execution_id;
                    });
                    be.taskExecutions = extractExecutionStatus(executionsStatusGroup);
                    callback(null);
                });
            }, function(err) {
                if( err ) {
                    return cb(err.message)
                }
                cb(null,result.rows);
            });
        });
    });
};

var getActivities = function (req, cb) {
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        client.query('SELECT * FROM "' + schema + '".activities ' +
            'WHERE (  select now() - interval \'' + getInterval(req.params.interval) + '\') <= "' + schema + '".activities.date', function (err, result) {
            done();
            if (err) {
                logger.log('error', err.message);
                return cb(err.message)
            }

            cb(null,result.rows);
        });
    });
};

var getNumOfProcessedFailedCopiedEntities = function(req, cb){
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        var queries = [
            {
                queryString : 'select sum(num_of_processed_entities) from ' +
                '(select distinct num_of_processed_entities num_of_processed_entities, task_execution_id from task_Execution_list ',
                index : 'processedentites'
            },
            {
                queryString : 'select sum(num_of_copied_entities) from ' +
                '(select distinct num_of_copied_entities num_of_copied_entities, task_execution_id from task_Execution_list ',
                index : 'copiedentites'
            },
            {
                queryString : 'select sum(num_of_failed_entities) from ' +
                '(select distinct num_of_failed_entities num_of_failed_entities, task_execution_id from task_Execution_list ',
                index : 'failedentities'
            }
        ];

        var resultData = {};

        async.each(queries, function (query, callback) {
            query.queryString = query.queryString + ' where "' + schema + '".task_execution_list.creation_date >= (  select now() - interval \'' + getInterval(req.params.interval) + '\') ';

            if (req.decoded.role.id == 1){
                if (req.decoded.role.tdmType == 'owner'){
                    query.queryString = query.queryString + '  and "' + schema + '".task_execution_list.environment_id in ( select environment_id from environment_owners e ' +
                        'where e.user_name = \'' + req.decoded.username + '\' )';
                }
                else if (req.decoded.role.tdmType == 'tester'){
                    query.queryString = query.queryString + 'AND "' + schema + '".task_execution_list.environment_id in (select environment_role_users.environment_id from environment_role_users, environment_roles ' +
                        'where environment_roles.role_id = environment_role_users.role_id ' +
                        'and environment_roles.environment_id = environment_role_users.environment_id ' +
                        'and username = \'' + req.decoded.username + '\' ' +
                        'and role_status = \'Active\') ';
                }
                else{
                    return cb('You are not allowed to see this data');
                }
            }
            query.queryString = query.queryString + ') t';
            client.query(query.queryString, function (err, result) {
                done();
                if (err) {
                    logger.log('error', err.message);
                    return cb(err.message)
                }
                resultData[query.index] = result.rows[0].sum;
                callback();
            });

        }, function(err) {
            if( err ) {
                return cb(err.message)
            }
            cb(null,resultData);
        });
    });
};

var getNumOfCopiedFailedEntitiesPerLU = function(req,cb){
    pool.connect(function (err, client, done) {
        if (err) {
            logger.log('error', err.message);
            return cb(err.message)
        }

        var query = 'select lu_name, sum(num_of_copied_entities) total_num_of_copied_entities, sum(num_of_failed_entities) total_num_of_failed_entities ' +
            'from (select distinct p.lu_name lu_name, num_of_processed_entities, num_of_copied_entities, num_of_failed_entities, task_execution_id ' +
            'from task_execution_list t, product_logical_units p ' +
            'where t.creation_date >= date_trunc(\'day\', NOW() - interval \'' + getInterval(req.params.interval) + '\') ';


        if (req.decoded.role.id == 1){
            if (req.decoded.role.tdmType == 'owner'){
                query = query + '  and t.environment_id in ( select environment_id from environment_owners e ' +
                    'where e.user_name = \'' + req.decoded.username + '\' )';
            }
            else if (req.decoded.role.tdmType == 'tester'){
                query = query + 'AND t.environment_id in (select environment_role_users.environment_id from environment_role_users, environment_roles ' +
                    'where environment_roles.role_id = environment_role_users.role_id ' +
                    'and environment_roles.environment_id = environment_role_users.environment_id ' +
                    'and username = \'' + req.decoded.username + '\' ' +
                    'and role_status = \'Active\') ';
            }
            else{
                return cb('You are not allowed to see this data');
            }
        }
        query = query + 'and t.lu_id = p.lu_id ) t group by lu_name;';
        client.query(query, function (err, result) {
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
    getTasksStatus : getTasksStatus,
    getTasksExecutionsStatus : getTasksExecutionsStatus,
    getTasksPerBE : getTasksPerBE,
    getActivities : getActivities,
    getNumOfProcessedFailedCopiedEntities : getNumOfProcessedFailedCopiedEntities,
    getNumOfCopiedFailedEntitiesPerLU : getNumOfCopiedFailedEntitiesPerLU
};