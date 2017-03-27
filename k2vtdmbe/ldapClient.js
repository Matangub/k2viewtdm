var ldap = require('ldapjs');
var config = require('./config');

var opts = {
    scope: 'sub',
    attributes: ['uid', 'displayName']
};

var auth = function (username, password, cb) {

  var client = ldap.createClient({
    url: config.ldap.urlString
  });

  opts.filter = '(uid=' + username + ')';

  client.bind(config.ldap.adminDN, config.ldap.adminPassword, function(err) {

    if (err) {
      return cb(err);
    }
    var found = false;
    client.search('ou=system', opts, function (err, res) {
      if (err) {
        return cb(err);
      }
      res.on('searchEntry', function (entry) {
        found = true;
        if (err){
          cb(err);
        }
        var userClient = ldap.createClient({
          url: config.ldap.urlString
        });
        userClient.bind(entry.object.dn, password, function(err) {
          if (err){
            cb(err);
          }
          cb(null,entry.object);
        });
      });

      res.on('error', function (err) {
        cb(err);
      });

      res.on('end',function(result){
        if (found == false){
          cb(true);
        }
        client.destroy();
      });

    });
  });
};

var getEnvOwners = function (cb) {

  var client = ldap.createClient({
    url: config.ldap.urlString
  });

  var clientOpts = {
    scope: 'sub',
    attributes: ['uid', 'displayName']
  };

  client.bind(config.ldap.adminDN, config.ldap.adminPassword, function(err) {
    if (err){
      cb(err);
    }
    client.search(config.ldap.ownersDN,clientOpts, function (err, res) {

      var envOwners = [];
      res.on('searchEntry', function (entry) {
        envOwners.push(entry.object)
      });

      res.on('error', function (err) {
        cb(err)
      });

      res.on('end', function (result) {
        cb(null, envOwners);
        client.destroy();
      });

    });
  });
};


var getTesters = function (cb) {

  var client = ldap.createClient({
    url: config.ldap.urlString
  });

  var clientOpts = {
    scope: 'sub',
    attributes: ['uid', 'displayName']
  };
  client.bind(config.ldap.adminDN, config.ldap.adminPassword, function(err) {

    if (err) {
      cb(err);
    }
    client.search(config.ldap.testersDN, clientOpts, function (err, res) {

      var testers = [];
      res.on('searchEntry', function (entry) {
        testers.push(entry.object);
      });

      res.on('error', function (err) {
        cb(err);
      });
      res.on('end', function (result) {
        cb(null, testers);
        client.destroy();
      });
    });
  });
};

module.exports = {
  auth: auth,
  getTesters : getTesters,
  getEnvOwners : getEnvOwners
};