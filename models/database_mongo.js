var mongodb = require('mongodb');
var db_mongo = exports;
var config = require('../config');

var Database = function () {};

//データベースに接続する
Database.prototype._open = function (callback){
    //すでにデータベースが開かれていれば再利用する
   if(this._db){
       callback(null,this._db);
       return;
   }
   
   var database = config.mongo_db;
   var server = new mongodb.Server(config.mongo_host,config.mongo_port,{});
   var db_connector = new mongodb.Db(database,server,{safe:true});
   var self = this;
   
   //データベースを開く
   db_connector.open(function (err,db){
       if(err){
           callback(err);
           return;
       }
       self._db = db;
       callback(null,self._db);
   });
};

//データベース接続を閉じる
Database.prototype.close = function() {
   if(this._db){
       this._db.close();
       delete this._db;
   }
};

//コレクションにアクセスするためのオブジェクトを取得する
Database.prototype._getCollection = function (collectionName,callback){
        this._open(function(err,db){
                db.createCollection(collectionName,callback);
        });
};

//mush_dataにアクセスするためのクラス
var Mush_data = function () {};
Mush_data.prototype = new Database();
db_mongo.getMush_data = function() {
   return new Mush_data(); 
};

//ObservationSettingにアクセスするためのクラス
var DbQuery = function() {};
DbQuery.prototype = new Database();
db_mongo.getDbQuery = function(){
   return new DbQuery(); 
};

DbQuery.prototype.getObservationSetting = function (callback){
    //observationsettingコレクションを取得する
    this._getCollection('observationSetting',function(err,collection){
        if(err){
            callback(err);
            return;
        }
        console.log('getObservationSetting');
        var cursor = collection.find({});
        cursor.toArray(callback);
    });
};

/**
 *   mush_dataを新しい順にソートし、start番目からend番目までのmush_dataを取得する
 * 
 */
Mush_data.prototype.getLatest = function (start,end,callback){
    //mush_dataコレクションを取得する
    this._getCollection('mush_data',function(err,collection){
        if(err){
            callback(err);
            return;
        }
        console.log('getLatest');
        var cursor = collection.find({});
        cursor.sort([['date',-1]]).limit(end - start).skip(start);
        cursor.toArray(callback);
    });
};

/*
 *   auto_settingコレクションから設定値を取得する
 */
Mush_data.prototype.getAutoSetting = function(callback){
        console.log('getAutoSetting');
        //auto_settingコレクションを取得
        this._getCollection('auto_setting',function(err,collection){
                if(err){
                    callback(err);
                    return;
                }
                var cursor = collection.find({id:1});
                cursor.toArray(callback);
        });
};

/*
 *  mush_dataのデータを新規作成する 
 * 
 */
Mush_data.prototype.insert = function(topic,callback){
        var self = this;
        
        //countersコレクションからカウンターの値を取得する
        self._getCollection('counters',function (err,collection){
            if(err){
                callback(err);
                return;
            }
            //counterの値を取得すると同時にインクリメントする
            collection.findAndModify({name:'topics'},{},{$inc: {count:1}},createTopic);
        });
        
        function createTopic(err,counter){
            console.log('createTopic_first_col');
            console.log(topic);
            console.log(topic.lineNO);
            var newTopic = {
               date:new Date(),
               lineNo:[topic.lineNo[0],topic.lineNo[1]],
               celsius:topic.celsius,
               humidity:topic.humidity 
            };
            self._getCollection('mush_data',function(err,collection){
                if(err){
                    callback(err);
                    return;
                }
                collection.insert(newTopic,function(err,obj){
                        if(err){
                            callback(err);
                            return;
                        }
                        callback(err,obj[0]);
                });
            });
        }
};

Mush_data.prototype.update = function(topic,callback){
    console.log('database_mongo.js update()');
     var self = this;
     console.log(topic);
     
     if (topic.d_id === 'celsius') { 
            var update_data = {
                    $set:{
                        'celsius.point':topic.d_point,
                        'celsius.range.top':topic.d_top,
                        'celsius.range.bottom':topic.d_bottom,
                        'celsius.auto_toggle':topic.d_option,
                        'celsius.get_time':topic.d_time,
                        'celsius.active':topic.d_active
                
                    }
            };
     } else if (topic.d_id === 'humidity'){//humidity
            var update_data = {
                    $set:{
                        'humidity.point':topic.d_point,
                        'humidity.range.top':topic.d_top,
                        'humidity.range.bottom':topic.d_bottom,
                        'humidity.auto_toggle':topic.d_option,
                        'humidity.get_time':topic.d_time,
                        'humidity.active':topic.d_active
                    }
            };
     } else if (topic.d_id === 'celsius_active'){
             var update_data = {$set:{'celsius.active':topic.d_active}};   
     } else if(topic.d_id === 'humidity_active'){
             var update_data = {$set:{'humidity.active':topic.d_active}};
     } else if(topic.d_id === 'celsius_mode') {
             var update_data = {$set:{'celsius.mode':topic.d_mode}};
     } else if(topic.d_id === 'humidity_mode') {
             var update_data = {$set:{'humidity.mode':topic.d_mode}};
     };
     var sort = [['id','asc']];
     console.log(update_data);
     self._getCollection('auto_setting',function(err,collection){
           console.log('update_auto_setting');
            if(err){
                console.log(err);
                callback(err);
                return;
            }
            //console.log(collection);
            //objには更新されたドキュメントが格納される
//            collection.findAndModify({id:1},sort,update_data,{safe:true},function(err,result){
//                if(err){
//                    callback(err);
//                    return;
//                }
//                console.dir(result);
//                callback(err,result[0]);
//            });      
        collection.update({id:1},update_data,{safe:true},function(err,result){
                if(err){
                    callback(err);
                    return;
                }
                console.dir(result);
                callback(err,result[0]);
            });      
     });
};