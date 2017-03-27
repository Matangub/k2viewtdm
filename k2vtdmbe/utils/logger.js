// author: Majdy Abu Adba

var fs = require('fs');

var logger = exports;

var errorFileName = './logs/log.err';
var warnFileName = './logs/log.warn';
var infoFileName = './logs/log.info';
var debugLevel;
var status;
var outputType;

logger.setLevel = function(debugLevel) {
	debugLevel = debugLevel;
};

logger.setStatus = function(p_status) {
	status = p_status;
};

logger.setOutputType = function(p_type) {
	outputType = p_type;
};

logger.log = function(level, message) {

	if (status === 'on') {

		var levels = ['info', 'warn', 'error'];

		if (levels.indexOf(level) >= levels.indexOf(debugLevel)) {

			if (typeof message !== 'string') {
				message = JSON.stringify(message);
			}


			if (level === 'error') {
				if (outputType === 'file') {
					fs.appendFileSync(errorFileName, message + '\n');
				} else if (outputType === 'console') {
					console.log(level + ": " + message)
				}
			}
			else if (level === 'warn') {
				if (outputType === 'file') {
					fs.appendFileSync(warnFileName, message + '\n');
				} else if (outputType === 'console') {
					console.log(level + ": " + message)
				}
			}
			else if (level === 'info') {
				if (outputType === 'file') {
					fs.appendFileSync(infoFileName, message + '\n');
				} else if (outputType === 'console') {
					console.log(level + ": " + message)
				}
			}
		}
	}
};


