var config = require('../socketconf');
var redisport = config.redisPort,
      redishost = config.redisHost;
      
var redis = require('redis'),
      client = redis.createClient(redisport,redishost),
      pub = redis.createClient(redisport,redishost),
      sub = redis.createClient(redisport,redishost);
      
var exec = require('child_process').exec;
var checkSensor = exports;

//センサーから現在の値を読み取って返す
checkSensor.getPoints = function(callback){
    exec('usbrh',{maxBuffer:400*1024},function(error,stdout,stderr){
        if(!error){
            if(stdout){
                var points = stdout.split(' ');
                if(!isNaN(parseFloat(points[0])) && !isNaN(parseFloat(points[1]))){//数値かどうかチェック
                    var params = [parseFloat(points[0]),parseFloat(points[1])];
                    callback(error,params,stderr);
                } else {
                    console.log('param isNaN Error');
                    callback(new Error('param isNaN Error'));
                }
            }
        } else {
            console.log(error);
            console.log(error.code);
            console.log(error.signal);
            callback(new Error('usbrh failed'));
            return;
        }
    });
};

//センサー値をサーバーにpublish
checkSensor.publishAndSetRedis = function(params){
    var hashkey = 'linepub:'+params.lineid;
    try {
        setObj(hashkey,params.lineno+'#'+params.unix_write_date,{celsius:params.celsius,humidity:params.humidity});
        client.publish(hashkey,JSON.stringify({lineno:params.lineno,celsius:params.celsius,humidity:params.humidity,t_date:params.unix_write_date}));
    } catch(e){
        console.log(e);
        return;
    }
    ///////////////////
};

checkSensor.setWriteTime = function(params){
    var list_key = 'linedate:'+params.lineid+':'+params.lineno+':'+computeDate(params.unix_write_date);
    var hash_key = 'linepoints:'+params.lineid+':'+params.lineno;
    try {
        client.rpush(list_key,params.unix_write_date,redis.print);
        setObj(hash_key,params.unix_write_date,{celsius:params.celsius,humidity:params.humidity});
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