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

//MySQLのデバイスの設定情報を格納したテーブルからid,noで引き出す
rdsAccess.readDeviceSetting = function(lineid,lineno,callback){
        var sql = 'select \n\
                       celsius_top_range,\n\
                       celsius_bottom_range,\n\
                       humidity_top_range,\n\
                       humidity_bottom_range,\n\
                       celsius_mode,\n\
                       humidity_mode,\n\
                       celsius_top_range_over,\n\
                       celsius_bottom_range_over,\n\
                       humidity_top_range_over,\n\
                       humidity_bottom_range_over\n\
                       from observationDevice \n\
                       where lineid = "?" and lineno = "?";';
        db.query(sql,[lineid,lineno],function(err,result){
            db.end();
            if(err){
                console.log(err);
                callback(new Error('observationDevice select failed.'));
                return;
            }
            callback(err,result);
        });               
};

//MySQLのデバイスの設定情報を格納したテーブルからid,noで引き出す
rdsAccess.readTimeSchedule = function(lineid,lineno,callback){
        var sql = 'select \n\
                       celsius_top_range,\n\
                       celsius_bottom_range,\n\
                       humidity_top_range,\n\
                       humidity_bottom_range,\n\
                       celsius_top_range_over,\n\
                       celsius_bottom_range_over \n\
                       from TimeSchedule \n\
                       where lineid = "?" and lineno = "?";';
        db.query(sql,[lineid,lineno],function(err,result){
            db.end();
            if(err){
                console.log(err);
                callback(new Error('TimeSchedule select failed.'));
                return;
            }
            callback(err,result);
        });               
};
