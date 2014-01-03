var database = require('./database_mysql');
var db = database.createClient();
var mushrecord = exports;

mushrecord.readRecord = function(line,lineno,start,end,callback){
    var params = [line,lineno,start,end];
    var sql = 'select * from mushrecord where line = ? and lineno = ? and t_date between cast(? as datetime) and cast(? as datetime);';
    db.query(sql,params,function(err,results){
            db.end();
            if(err){
                    console.log(err);
                    callback(new Error('select failed.'));
                    return;
            } 
            callback(err,results);
    });
};

mushrecord.readRecordAll = function(line,lineno,start,end,callback){
    var params = [line,lineno,start,end];
    var sql = 'select * from mushrecord;';
    db.query(sql,params,function(err,results){
            db.end();
            if(err){
                    console.log(err);
                    callback(new Error('select failed.'));
                    return;
            } 
            callback(err,results);
    });
};