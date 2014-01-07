var database = require('./database_mysql');
var db = database.createClient();
var rdsAccess = exports;

rdsAccess.setrecord = function(params,callback){
    console.log(params);
    db.query(
            'INSERT INTO mushrecord '
            + '(lineid,lineno,t_date,celsius,humidity)'
            + ' VALUES '
            + '(?,?,?,?,?)'
            + ';',
            params,
            function(err,results,fields){
               db.end();
               if(err){
                   callback(new Error('Insert Failed.'));
               }
               callback(null);
            });
};
