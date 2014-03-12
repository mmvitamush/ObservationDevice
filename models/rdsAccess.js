/*
 *  ObservationDevice
 */

var database = require('./database_mysql');
var db = database.createClient();
var rdsAccess = exports;

rdsAccess.setrecord = function(params,callback){
    console.log(params);
    db.query(
            'INSERT INTO mushrecord '
            + ' VALUES '
            + '(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
            + ';',
            params,
            function(err,results){
                console.log(results);
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
rdsAccess.readTimeSchedule = function(lineid,lineno,t_date,relayno,cb){
    //条件に合うレコードの最初の一件のみ取得
        var sql = 'select \n\
                       top_range,\n\
                       bottom_range,\n\
                       top_range_over,\n\
                       bottom_range_over,\n\
                       start_date,\n\
                       end_date,\n\
                       vent_value,\n\
                       vent_flg \n\
                       from timeSchedule'+relayno+' \n\
                       where lineid = "?" and lineno = "?" and start_date <= ? and end_date >= ? order by start_date ASC limit 1;';
        db.query(sql,[lineid,lineno,t_date,t_date],function(err,result){
            db.end();
            if(err){
                console.log(err);
                cb(new Error('TimeSchedule select failed.'));
                return;
            }
            cb(err,result,relayno-1);
        });               
};
