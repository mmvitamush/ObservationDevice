var database = require('./database_mysql');
var db = database.createClient();
var db_schedule = exports;

//スケジュールを新規作成する
db_schedule.insert = function(data,callback){
       console.log(data);
        var params = [
           data.title,
           data.start,
           data.end
        ];
        db.query(
                'INSERT INTO schedule '
                + '(title,allday,start,end,editable,option1) '
                + 'values(?,0,?,?,1,NOW())'
                + ';',
            params,
            function(err,results){
                    db.end();
                    //console.log(results);
                    if(err){
                        console.log(err);
                        callback(new Error('Insert failed.'));
                        return;
                    }
                    callback(null);
            });
}; 

//表示範囲分のデータを読み込む
db_schedule.readSchedule = function(start,end,callback){
        var params = [start,end];
        var sql = "select title,(CASE WHEN allday > 0 THEN 'true' ELSE 'false' END) AS allday,DATE_FORMAT(start,'%Y-%m-%d %H:%i:%S') AS start,DATE_FORMAT(end,'%Y-%m-%d %H:%i:%S') AS end,editable from schedule where start >= ? and end <= ?;";
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
