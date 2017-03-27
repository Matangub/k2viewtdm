var fs = require('fs');
var logger = require('../utils/logger');
var async = require('async');

var getJsonFromFile = function (fileName, cb) {
    fs.readFile(__dirname + '/jsons/' + fileName, 'utf8', function (err, data) {
        if (err) {
            return cb("Unable to open Json File");
        }
        cb(null, JSON.parse(data));
    });
};


var insertActivity = function (action, entity, userId, username, description, cb) {
    pool.connect(function (err, client, done) {
            if (err) {
                logger.log('error', err.message);
                return cb(err.message)
            }

            client.query('INSERT INTO "' + schema + '".activities ' +
                '(date, action, entity, user_id, username, description) ' +
                'VALUES ($1, $2, $3, $4, $5, $6)',
                [
                    (new Date()).toISOString(),
                    action,
                    entity,
                    userId,
                    username,
                    description
                ],
                function (err) {
                    done();
                    if (err) {
                        logger.log('error', err.message);
                        return cb(err.message)
                    }
                    cb();
                }
            );
        }
    );
};

var getTimeZone = function(cb){
    pool.connect(function (err, client, done) {
            if (err) {
                logger.log('error', err.message);
                return cb(err.message)
            }

            client.query('SELECT  current_setting(\'TIMEZONE\')',
                function (err,result) {
                    done();
                    if (err) {
                        logger.log('error', err.message);
                        return cb(err.message)
                    }
                    cb(null,result.rows[0]);
                }
            );
        }
    );
};

module.exports = {
    getJsonFromFile: getJsonFromFile,
    insertActivity : insertActivity,
    getTimeZone : getTimeZone
};