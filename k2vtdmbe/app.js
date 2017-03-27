var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var fs = require('fs');
var pg = require('pg');

var logger = require('./utils/logger');
var config = require('./config');
var app = express();

var pgConfig = {
    user: config.postgres.user, //env var: PGUSER
    database: config.postgres.database, //env var: PGDATABASE
    password: config.postgres.pass, //env var: PGPASSWORD
    host: config.postgres.host, // Server hosting the postgres database
    port: config.postgres.port, //env var: PGPORT
    max: 100, // max number of clients in the pool
    idleTimeoutMillis: 20000, // how long a client is allowed to remain idle before being closed
    ssl: config.postgres.ssl
};

schema = config.postgres.schema;

pool = new pg.Pool(pgConfig);


process.on('uncaughtException', function (err) {
    logger.log('error', err);
});

app.use('/apidoc', express.static(__dirname + '/apidoc'));

app.use(function (req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'accept, Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, x-access-token');
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if ('OPTIONS' == req.method) {
        res.sendStatus(200);
    }
    else {
        next();
    }
});

logger.setLevel(config.debug.level);
logger.setOutputType(config.debug.outputType);
logger.setStatus(config.debug.status);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

app.get("/api/bla",function(req,res,next){
    res.status(503);
    res.json({
        message : "hello"
    });
});



app.use(require('./routes/loginRoute'));
app.use(require('./routes/dashboardRoute'));
app.use(require('./routes/utilsRoute'));
app.use(require('./routes/taskRoute'));
app.use(require('./routes/environmentRoute'));
app.use(require('./routes/productRoute'));
app.use(require('./routes/businessEntityRoute'));
app.use(require('./routes/dataCenterRoute'));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    console.error(err);
    if (err.status) {
        res.status(err.status);
        return res.json({
            errorCode: "FAIL",
            message: err.message
        });
    }
    res.status(500);
    res.json({
        errorCode: "FAIL",
        message: "Internal Error"
    });
});

var port = 3000;
app.set('port', (process.env.PORT || port));
app.listen(app.get('port'),function(){
    console.log('K2VIEW TDM - Back End v1.0 running on port: ' + port);
    logger.log('info', 'LOGGER: K2VIEW TDM - Back End running on port: ' + port)
});

