/*
 *  ObservationDevice Ver.
 */
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

//MySQLのデバイスの設定情報を格納したテーブルからid,noで引き出す
/*
mushrecord.readDeviceSetting = function(lineid,lineno,callback){
        var sql = 'select \n\
                       celsius_top_range,\n\
                       celsius_bottom_range,\n\
                       humidity_top_range,\n\
                       humidity_bottom_range,\n\
                       celsius_mode,\n\
                       humidity_mode,\n\
                       celsius_over_top_range_mode,\n\
                       celsius_over_bottom_range_mode,\n\
                       humidity_over_top_range_mode,\n\
                       humidity_over_bottom_range_mode\n\
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
*/