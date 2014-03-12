/*
 *  Beagle Bone Black Ver.
 */
var config = require('../socketconf');
var redisport = config.redisPort,
      redishost = config.redisHost;
      
var redis = require('redis'),
      client = redis.createClient(redisport,redishost),
      pub = redis.createClient(redisport,redishost),
      sub = redis.createClient(redisport,redishost);
var localredis = redis.createClient(6379,'127.0.0.1');
var rds = require('./rdsAccess');

var bs = require('bonescript');
var async = require('async');
var checkSensor = exports;

//センサーから現在の値を読み取って返す
checkSensor.getPoints = function(callback){
    var c=0,h=0;
    bs.analogRead('P9_39',function(x){
        bs.analogRead('P9_39',function(d){
            if(d.err === void 0){
                h = (d.value*1.8)*100;
            }
            bs.analogRead('P9_40',function(x){
                bs.analogRead('P9_40',function(d){
                    if(d.err === void 0){
                        c = (d.value*1.8)*100;
                    }
                    callback({celsius:c.toFixed(2),humidity:h.toFixed(2)});
                })
            });
        });
    });
    
};

//センサー値をサーバーにpublish
checkSensor.publishAndSetRedis = function(params){
    var listkey = 'linepubdate:'+params.lineid+':'+params.lineno;
    var hashkey = 'linepub:'+params.lineid+':'+params.lineno;
    try {
        client.lpush(listkey,params.t_date,function(err){
            client.ltrim(listkey,0,99,function(err){
                setObj(hashkey,params.t_date,{
                        t_date:params.t_date,
                        celsius:params.celsius,
                        humidity:params.humidity,
                        ventilation:params.ventilation,
                        co2:params.co2,
                        relay1:params.relay1,
                        relay2:params.relay2,
                        relay3:params.relay3,
                        relay4:params.relay4,
                        top_range1:params.top_range1,
                        bottom_range1:params.bottom_range1,
                        top_range2:params.top_range2,
                        bottom_range2:params.bottom_range2,
                        top_range3:params.top_range3,
                        bottom_range3:params.bottom_range3,
                        top_range4:params.top_range4,
                        bottom_range4:params.bottom_range4
                });
            });
        });

                client.publish('linepub',JSON.stringify({
                        lineid:params.lineid,
                        lineno:params.lineno,
                        t_date:params.t_date,
                        celsius:params.celsius,
                        humidity:params.humidity,
                        ventilation:params.ventilation,
                        co2:params.co2,
                        relay1:params.relay1,
                        relay2:params.relay2,
                        relay3:params.relay3,
                        relay4:params.relay4,
                        top_range1:params.top_range1,
                        bottom_range1:params.bottom_range1,
                        top_range2:params.top_range2,
                        bottom_range2:params.bottom_range2,
                        top_range3:params.top_range3,
                        bottom_range3:params.bottom_range3,
                        top_range4:params.top_range4,
                        bottom_range4:params.bottom_range4                   
                }));            

    } catch(e){
        console.log(e);
        return;
    }
    ///////////////////
};

//Redisから設定情報を引き出す
checkSensor.getSettingRedis = function(params,callback){
    var subkey = params.lineid + ':' + params.lineno;
    var replay;
    client.hget('linesetting',subkey,function(err,obj){
        
        if(err){
           replay = null; 
        } else {
           replay = JSON.parse(obj);
        }
        callback(replay);
    });
};

//10分ごとのデータのキャッシュをRedisに追加
checkSensor.setWriteTime = function(params){
    var list_key = 'linedate:'+params.lineid+':'+params.lineno+':'+computeDate(params.unix_write_date);
    var hash_key = 'linepoints:'+params.lineid+':'+params.lineno;
    try {
        client.rpush(list_key,params.unix_write_date,redis.print);
        var obj= {
            celsius:params.celsius,
            humidity:params.humidity
        };
        setObj(hash_key,params.unix_write_date,obj);
    } catch(e){
        console.log(e);
        return;
    }
    /*
    client.set("string key", "string val", redis.print);
    client.hset("hash key", "hashtest 1", "some value", redis.print);
    client.hset(["hash key", "hashtest 2", "some other value"], redis.print);
    client.hkeys("hash key", function (err, replies) {
        console.log(replies.length + " replies:");
        replies.forEach(function (reply, i) {
            console.log("    " + i + ": " + reply);
        });
        client.quit();
    });
    */
};

function setObj(key,subkey,obj){
   var strobj;
   try {
       strobj = JSON.stringify(obj);
       client.hset(key,subkey,strobj,redis.print);
   } catch(e){
       console.log(e);
       return;
   }
};

function setObjLocal(key,subkey,obj){
   var strobj;
   try {
       strobj = JSON.stringify(obj);
       localredis.hset(key,subkey,strobj,redis.print);
   } catch(e){
       console.log(e);
       return;
   }
};

//ローカルのredisから設定情報を引き出す
checkSensor.readtimeScheduleLocalRedis = function(lineid,lineno,t_date,relayNum,callback){
    /*
    localredis.hget('timeSchedule','relay'+relayNum,function(err,obj){
        if(err){
           replay = null; 
        } else if(!obj){
            //設定情報がなければ、RDSのtimeSchdule1~4からredisハッシュを作成する
            createRedisForRds(lineid,lineno,t_date,relayNum,function(err,obj){
                if(obj){
                    replay = JSON.parse(obj);
                    callback(replay,relayNum);
                } else {
                    var empty = {
                        top_range:0,
                        bottom_range:0,
                        top_range_over:0,
                        bottom_range_over:0,
                        start_date:0,
                        end_date:0
                    };
                    callback(empty,relayNum);
                }
            });
        } else {
            console.log('ReadTimeSchedule for Redis.');
           replay = JSON.parse(obj);
           //現在のRedisに存在するスケジュールが現時刻の範囲外の場合は再セットする
                if(!((replay.start_date <= t_date) && (replay.end_date >= t_date))){
                    console.log('reset Schedule.');
                     localredis.hdel('timeSchedule','relay'+relayNum,function(err,obj){
                         console.log('hdel: relay'+relayNum+' and create');
                             createRedisForRds(lineid,lineno,t_date,relayNum,function(err,obj){
                                 if(obj){
                                     replay = JSON.parse(obj);
                                     callback(replay,relayNum);
                                 } else {
                                     var empty = {
                                         top_range:0,
                                         bottom_range:0,
                                         top_range_over:0,
                                         bottom_range_over:0,
                                         start_date:0,
                                         end_date:0
                                     };
                                     callback(empty,relayNum);
                                 }
                             });                    
                     });
                } else {//再セットの必要なしの場合そのまま返す
                    callback(replay,relayNum);
                }
        }
    });
    */
            createRedisForRds(lineid,lineno,t_date,relayNum,function(err,obj){
                if(obj){
                    replay = JSON.parse(obj);
                    client.hset('linesetting:'+lineid+':'+lineno,'relay'+relayNum,obj,redis.print);
                    callback(replay,relayNum);
                } else {
                    //LocalRedisにも設定情報がない場合、空データを返して機器をＯＦＦ状態にする
                    var empty = {
                        top_range:0,
                        bottom_range:0,
                        top_range_over:0,
                        bottom_range_over:0,
                        start_date:0,
                        end_date:0
                    };
                    client.hset('linesetting:'+lineid+':'+lineno,'relay'+relayNum,JSON.stringify(empty),redis.print);
                    callback(empty,relayNum);
                }
            });   
};

//RDSのtimeScheduleからRedisハッシュを作成しrelayNumに対応した情報を返す
function createRedisForRds(lineid,lineno,t_date,relayNum,callback){
    var fcall;
    rds.readTimeSchedule(lineid,lineno,t_date,relayNum,function(err,res,count){
        if((err) || res.length === 0){
            //RDSサーバーからエラーが返された、もしくはRDSにもデータがない場合はLocalRedisから設定を読む
            console.log('Redis and RDS Schedule No Data.');
            localredis.hget('timeSchedule','relay'+relayNum,function(err,obj){
                        if(!err){
                            fcall = obj;
                            callback(null,fcall);
                        } else {
                            callback(null,null);
                        }
                    });

        } else if(res.length > 0){
            async.series([
                function (callback){
                    setObjLocal('timeSchedule','relay'+relayNum,res[0]);
                    callback(null,'createRedisForRds1');
                },function(callback){
                    localredis.hget('timeSchedule','relay'+relayNum,function(err,obj){
                        if(!err){
                            fcall = obj;
                            callback(null,'createRedisForRds2');
                        }
                    });
                }
            ],function(err, result){
                    console.log( 'final callback & result = ' + result );
                    callback(null,fcall);
            });
        }
        
    });
};

//日時の０埋め
function toDoubleDigits(num) {
  num += "";
  if (num.length === 1) {
    num = "0" + num;
  }
 return num;     
};
	
//ミリ秒を時分秒へ変換
function computeDate(ms){
    //var data = new Date(ms-32400000);
    var data = new Date(ms*1000);
    var hh = data.getFullYear();
    var mm = toDoubleDigits(data.getMonth()+1);
    var dd = toDoubleDigits(data.getDate());
  
    //return hh+':'+mm+':'+ss;
    return hh.toString()+mm.toString()+dd.toString();
}
