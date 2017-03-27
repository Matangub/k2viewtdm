var config =
  {
    "secret" : "hello",
    "adminUsers" : [
      {
        "uid" : "mohamad",
        "displayName" : "mohamad"
      }
    ],
    "postgres": {
      "user":  "tdm",
      "pass":  "tdm",
      "host":   "163.172.176.227",
      "port": 5432,
      "database": "TDMDB",
      "schema":"public",
      "ssl": false
    },
    //"postgres": {
    //  "user":  "bkuapiwijfiyor",
    //  "pass":  "kdpoTIvSeY95dom3b_mMePSOfY",
    //  "host":   "ec2-54-217-208-206.eu-west-1.compute.amazonaws.com",
    //  "port": 5432,
    //  "database": "d4qr9ed1j9f6mj",
    //  "schema":"public",
    //  "ssl": true
    //},
    "debug": {
      "level": "info", // error or warn or info
      "outputType": "console", // console or file
      "status": "on" // on or off
    },
    "ldap" : {
      "urlString" : 'ldap://52.27.144.161:10389',
      "adminDN" : "uid=tdmldap,ou=users,ou=system",
      "adminPassword" : "Q1w2e3r4t5",
      "ownersDN" : "ou=k2venvownerg,ou=system",
      "testersDN" : "ou=k2vtestg,ou=system",
      "ownersGroupName" : "k2venvownerg",
      "testersGroupName" : "k2vtestg"
    },
    "monitor" : {
      "url" : "http://[etlIpAddress]:3210/k2ServerPro/k2CommandCenter/k2Agent.php",
      "tokenQuery" : "method=envGenerateWebToken",
      "executionQuery" : "method=plTDMGetExecutionStatus&executionID=[executionId]&k2WebToken=[webToken]",
      "stopExecution" : "method=plStopExecution&executionID=[executionId]&k2WebToken=[webToken]"
    }
  };

module.exports = config;