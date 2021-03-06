/*
 *  ObservationDevice Ver.
 */
var config = require('./config');
var lineid = config.line,
      lineno = config.lineno;
console.log('LINE: '+lineid+':'+lineno);      
//設定情報の初期値

//リレー１
var setData = [];
setData[0] = {
   top_r:0,
   bot_r:0,
   top_r_o:0,
   bot_r_o:0,
   now_p:0,
   start_date:0,
   end_date:0
};
//リレー２
setData[1]= {
   top_r:0,
   bot_r:0,
   top_r_o:0,
   bot_r_o:0,
   now_p:0,
   start_date:0,
   end_date:0
};
//リレー３
setData[2] = {
   top_r:0,
   bot_r:0,
   top_r_o:0,
   bot_r_o:0,
   now_p:0,
   start_date:0,
   end_date:0
};
//リレー４
setData[3] = {
   top_r:0,
   bot_r:0,
   top_r_o:0,
   bot_r_o:0,
   now_p:0,
   start_date:0,
   end_date:0
};

var relayNum = setData.length;

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');

var app = express();
var server = http.createServer(app);
var io = require('socket.io');
var skt = io.listen(server);

//var db_mongo = require('./models/database_mongo');
var chksensor = require('./models/checkSensorBBB');
var devicecontrol = require('./models/deviceControlBBB');
var rdsAccess = require('./models/rdsAccess');
var async = require('async');
var localredis = require('redis').createClient(6379,'127.0.0.1');

//Redisから設定情報を引き出す
var obj;
async.series([
    function (callback){
       var t_date = parseInt((new Date)/1000);
       for(var x = 0; x < relayNum; x++){
           //リレー毎にレコードを取得
           chksensor.readtimeScheduleLocalRedis(lineid,lineno,t_date,(x+1),function(res,count){
               if(Object.keys(res).length === 6){
                     console.log('SetData Set for Redis.');
                     setData[count-1].top_r = res.top_range;
                     setData[count-1].bot_r = res.bottom_range;
                     setData[count-1].top_r_o = res.top_range_over;
                     setData[count-1].bot_r_o = res.bottom_range_over;
                     setData[count-1].start_date = res.start_date;
                     setData[count-1].end_date = res.end_date;
               }
               if(relayNum === (count+1)){
                   callback(null,'RedisReadSchedule.');
               }
           });
        }      
    },
    function (callback){
        console.log(setData);
       callback(null,'Mysql selected data set.');
    }
],function(err, result){
        console.log( 'final callback & result = ' + result );
});

//GPIOpinの初期化
devicecontrol.init();

var cronJob = require('cron').CronJob;
var checkTime = "*/1  * * * *";//1s
var saveTime = "*/10 * * * *";//１０分
var gPoints = [];//前回のセンサー値保存用

//var request = require('request');

//定期的に処理を実行する
var checkjob = new cronJob({
    cronTime:checkTime,
    onTick:function() {
        console.log('onTick');
        
        chksensor.getPoints(function(params){
            var chkdate = parseInt((new Date)/1000);
            var insertDate = chkdate+32400;
            if((params.celsius !== 0) && (params.humidity !== 0)){
                async.series([
                    function(callback){
                            gPoints = params;
                            setData[0]['now_p'] = gPoints.celsius;//温度の現在値
                            setData[1]['now_p'] = gPoints.humidity;//湿度の現在値
                            
                            //Redisから設定情報を引き出す
                            async.series([
                                function (callback){
                                   for(var x = 0; x < relayNum; x++){
                                        //リレー毎にレコードを取得
                                            chksensor.readtimeScheduleLocalRedis(lineid,lineno,chkdate,(x+1),function(res,count){
                                                   if(Object.keys(res).length === 6){
                                                         console.log('SetData Set for Redis.');
                                                         setData[count-1].top_r = res.top_range;
                                                         setData[count-1].bot_r = res.bottom_range;
                                                         setData[count-1].top_r_o = res.top_range_over;
                                                         setData[count-1].bot_r_o = res.bottom_range_over;
                                                         setData[count-1].start_date = res.start_date;
                                                         setData[count-1].end_date = res.end_date;
                                                   }
                                                   if(relayNum === (count+1)){
                                                       callback(null,'RedisReadSchedule CronJob.');
                                                   }
                                            });
                                     }     
                                }
                            ],function(err, result){
                                    console.log( 'final callback & result = ' + result );
                                    callback(null,'cronJob GetPoints.');
                            });   
                    },
                     function(callback){          
                            //現在の情報から各機器の状態を切り替える
                            console.log(setData);
                                //設定スケジュールの範囲内なら実行
                                if((setData[0].start_date <= chkdate) && (setData[0].end_date >= chkdate)){
                                    devicecontrol.checkDevice(setData[0],'celsius');
                                }
                            
                            //devicecontrol.checkDevice(setData[1],'humidity');
                            callback(null,'cron:2');
                     }
                 ],function(err, result){
                            localredis.hgetall('deviceStatus',function(err,obj){
                                  if(!err){
                                          var publishParams = {
                                              lineid:lineid,
                                              lineno:lineno,
                                              t_date:chkdate,
                                              celsius:gPoints.celsius,
                                              humidity:gPoints.humidity,
                                              ventilation:0,
                                              co2:0,
                                              relay1:parseInt(obj.celsius_up),
                                              relay2:parseInt(obj.humidity_up),
                                              relay3:parseInt(obj.ventilation_dw),
                                              relay4:parseInt(obj.co2_dw),
                                              top_range1:setData[0].top_r,
                                              bottom_range1:setData[0].bot_r,
                                              top_range2:setData[1].top_r,
                                              bottom_range2:setData[1].bot_r,
                                              top_range3:setData[2].top_r,
                                              bottom_range3:setData[2].bot_r,
                                              top_range4:setData[3].top_r,
                                              bottom_range4:setData[3].bot_r
                                          };
                                  }
                                  //redisサーバーにセンサー値をセット&publish
                                  chksensor.publishAndSetRedis(publishParams);
                                  
                                    var insertParams = [
                                        config.line,
                                        config.lineno,
                                        insertDate,
                                        gPoints.celsius,
                                        gPoints.humidity,
                                        0,
                                        0,
                                        parseInt(obj.celsius_up),
                                        parseInt(obj.humidity_up),
                                        parseInt(obj.ventilation_dw),
                                        parseInt(obj.co2_dw),
                                        setData[0].top_r,
                                        setData[0].bot_r,
                                        setData[0].top_r_o,
                                        setData[0].bot_r_o,
                                        setData[1].top_r,
                                        setData[1].bot_r,
                                        setData[1].top_r_o,
                                        setData[1].bot_r_o,
                                        setData[2].top_r,
                                        setData[2].bot_r,
                                        setData[2].top_r_o,
                                        setData[2].bot_r_o,
                                        setData[3].top_r,
                                        setData[3].bot_r,
                                        setData[3].top_r_o,
                                        setData[3].bot_r_o
                                    ];

                                    rdsAccess.setrecord(insertParams,function(err){
                                        if(err){
                                            console.log('sensor params Insert failed.');
                                        } else {
                                            console.log('sensor params Insert Success.');
                                        };
                                    });                                     
                            });
                        console.log( 'final callback & result = ' + result );
                 });
                
            } else {
                console.log('app.js: getPoints Error');
            }
        });
    },
    onComplete:function() {
        console.log('onComplete');
    },
    start:false,
    timeZone:"Asia/Tokyo"
});
checkjob.start();

//定期的にAWSのRDSにセンサー値を書き込む
var savejob = new cronJob({
    cronTime:saveTime,
    onTick:function() {
        if(gPoints.length > 0){
            console.log('onTick at Save');
            var chkdate = parseInt(((new Date)/1000)+32400);
            //redisにセット
            //chksensor.setWriteTime(rParams);
            localredis.hgetall('deviceStatus',function(err,obj){
                if(!err){
                        var insertParams = [
                            config.line,
                            config.lineno,
                            chkdate,
                            gPoints[0],
                            gPoints[1],
                            0,
                            0,
                            parseInt(obj.celsius_up),
                            parseInt(obj.humidity_up),
                            parseInt(obj.illumination_up),
                            parseInt(obj.co2_up),
                            setData[0].top_r,
                            setData[0].bot_r,
                            setData[0].top_r_o,
                            setData[0].bot_r_o,
                            setData[1].top_r,
                            setData[1].bot_r,
                            setData[1].top_r_o,
                            setData[1].bot_r_o,
                            setData[2].top_r,
                            setData[2].bot_r,
                            setData[2].top_r_o,
                            setData[2].bot_r_o,
                            setData[3].top_r,
                            setData[3].bot_r,
                            setData[3].top_r_o,
                            setData[3].bot_r_o
                        ];

                        rdsAccess.setrecord(insertParams,function(err){
                            if(err){
                                console.log('sensor params Insert failed.');
                            } else {
                                console.log('sensor params Insert Success.');
                            };
                        });                    
                }
            });

    }
    },
    onComplete:function() {
        console.log('onComplete');
    },
    start:false,
    timeZone:"Asia/Tokyo"
});
//savejob.start();

skt.set('destroy upgrade',false);

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon(path.join(__dirname, 'public/images/favicon.ico')));
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);
/*
var queryMongo = db_mongo.getDbQuery();
queryMongo.getObservationSetting(function(err,items){
        queryMongo.close();
        if(err){
            console.log(err);
            return;
        }
        var obj = items[0];
        console.log(obj['targetcelsius']);
});
*/

//待ち受け開始
server.listen(app.get('port'),function(){
    console.log("Node.js Server Listening on Port "+app.get('port'));
});

skt.sockets.on('connection',function(socket){
    console.log('socket.io connection');
    
    socket.on('message',function(data){
        console.log('node.js on message '+' '+data);
        socket.emit('greeting',{message:'Mushroom, '},function(data){
                console.log('result: '+data);
        });
    });
           
    
    
    //クライアントから切断された時の処理
    socket.on('disconnect',function(){
        console.log('socket disconnect');
    });
});
//http.createServer(app).listen(app.get('port'), function(){
//  console.log('Express server listening on port ' + app.get('port'));
//});

