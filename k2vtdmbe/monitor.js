var config = require('./config');
var logger = require('./utils/logger');
var async = require('async');
var request = require('request');
var _ = require('underscore');

var getMonitorData = function (taskExecutions,cb) {
    var executionResponseData = [];


    var executionsByEtlIpAddress = _.groupBy(taskExecutions,function(execution){
        return execution.etl_ip_address;
    });

    async.forEachOf(executionsByEtlIpAddress,function(executionIds,etl_ip_address,callback){
        request(config.monitor.url.replace('[etlIpAddress]',etl_ip_address) + "?" + config.monitor.tokenQuery, function (error, response, body) {
            if (error){
                logger.error(error.message);
                return cb("Failed to get monitor token");
            }
            var bodyData = JSON.parse(body);
            if (bodyData.errors != null || !bodyData.data.token) {
                return cb("Failed to get monitor token");
            }
            var executionQuery = config.monitor.executionQuery.replace("[webToken]",bodyData.data.token);
            var cookie = response.headers['set-cookie'][0];
            cookie = cookie.split(';')[0];
            async.each(executionIds, function (executionID, callback) {
                request({
                    url: config.monitor.url.replace('[etlIpAddress]',etl_ip_address) + '?' + executionQuery.replace('[executionId]',executionID.etl_execution_id),
                    method : 'GET',
                    headers: {
                        'Cookie': cookie
                    }
                } ,function(error,response,body){
                    if (error){
                        logger.error(error.message);
                        executionResponseData.push({
                            executionID : executionID.etl_execution_id,
                            data : null
                        });
                    }
                    else{
                        var executionBodyData;
                        try {
                            executionBodyData = JSON.parse(body);
                            if (error && executionBodyData.errors){
                                executionResponseData.push({
                                    executionID : executionID.etl_execution_id,
                                    data : null
                                });
                            }
                            else{
                                var dataToReturn = JSON.parse(body);
                                if (dataToReturn.data != null){
                                    executionResponseData.push({
                                        executionID : executionID.etl_execution_id,
                                        data : dataToReturn.data.migrationSummary.flowSummary.flow1
                                    });
                                }
                                else{
                                    executionResponseData.push({
                                        executionID : executionID.etl_execution_id,
                                        data : null
                                    });
                                }
                            }
                        } catch(e) {
                            logger.error("failed to parse response body [" + body + "]");
                            executionResponseData.push({
                                executionID : executionID.etl_execution_id,
                                data : null
                            });
                            return callback();
                        }
                    }
                    callback();
                })
            }, function (err) {
                if (err) {
                    return cb(err.message)
                }
                callback();
            });
        });
    }, function (err) {
        if (err) {
            return cb(err.message)
        }
        cb(null,executionResponseData);
    });
};

var stopExecution = function (taskExecution,cb) {
    request(config.monitor.url.replace('[etlIpAddress]',taskExecution.etl_ip_address) + "?" + config.monitor.tokenQuery, function (error, response, body) {
        if (error){
            logger.error(error.message);
            return cb("Failed to get monitor token");
        }
        var bodyData = JSON.parse(body);
        if (bodyData.errors != null || !bodyData.data.token) {
            return cb("Failed to get monitor token");
        }
        var executionQuery = config.monitor.stopExecution.replace("[webToken]",bodyData.data.token);
        executionQuery = executionQuery.replace('[executionId]',taskExecution.etl_execution_id);
        var cookie = response.headers['set-cookie'][0];
        cookie = cookie.split(';')[0];
            request({
                url: config.monitor.url.replace('[etlIpAddress]',taskExecution.etl_ip_address) + '?' + executionQuery,
                method : 'GET',
                headers: {
                    'Cookie': cookie
                }
            } ,function(error,response,body){
                if (error){
                    logger.error(error.message);
                    return cb("Failed to stop execution")
                }
                var bodyData = JSON.parse(body);
                if (bodyData.errors != null || bodyData.status != "stopped") {
                    return cb("Failed to stop execution");
                }
                cb(null);
            });
    });
};

module.exports = {
    getMonitorData : getMonitorData,
    stopExecution : stopExecution
};