/*
 *  ObservationDevice Ver.
 */
var config = require('./config');
var lineid = config.line,
      lineno = config.lineno;
      
//設定情報の初期値
var setData = {
   'c_top_r':0,
   'c_bot_r':0,
   'h_top_r':0,
   'h_bot_r':0,
   'c_top_r_o':0,
   'c_bot_r_o':0,
   'h_top_r_o':0,
   'h_bot_r_o':0
};

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
var chksensor = require('./models/checkSensor');
var devicecontrol = require('./models/deviceControl');
var deviceCtrl = require('./models/deviceControl');
var rdsAccess = require('./models/rdsAccess');
var async = require('async');

//Redisから設定情報を引き出す
var obj;
async.series([
    function (callback){
        /*
        chksensor.getSettingRedis({lineid:lineid,lineno:lineno},function(rep){
            obj = rep;
            callback(null,'getSetting:1');
        });
        */
       rdsAccess.readDeviceSetting(lineid,lineno,function(err,res){
           if(res){
                setData['c_top_r'] = res[0].celsius_top_range;
                setData['c_bot_r'] = res[0].celsius_bottom_range;
                setData['h_top_r'] = res[0].humidity_top_range;
                setData['h_bot_r'] = res[0].humidity_bottom_range;
                setData['c_top_r_o'] = res[0].celsius_top_range_over;
                setData['c_bot_r_o'] = res[0].celsius_bottom_range_over;
                setData['h_top_r_o'] = res[0].humidity_top_range_over;
                setData['h_bot_r_o'] = res[0].humidity_bottom_range_over;
           }
           callback(null,'Mysql selected.');
       });
    },
    function (callback){
        /*
        if(obj){
            setData.targetCelsius = obj.targetCelsius,
            setData.targetHumidity = obj.targetHumidity,
            setData.celsiusMode = obj.celsiusMode,
            setData.humidityMode = obj.humidityMode,
            setData.delayCelsius = obj.delayCelsius,
            setData.delayhumidity = obj.delayHumidity;
        }
        console.log(setData);
        callback(null,'getSettin:2');
        */
       callback(null,'Mysql selected data set.');
    }
],function(err, result){
        console.log( 'final callback & result = ' + result );
});

//GPIOpinの初期化
deviceCtrl.init();

var cronJob = require('cron').CronJob;
var checkTime = "*/1  * * * *";//1s
var saveTime = "*/10 * * * *";//１０分
var gPoints = [];//前回のセンサー値保存用


var request = require('request');

//定期的に処理を実行する
var checkjob = new cronJob({
    cronTime:checkTime,
    onTick:function() {
        console.log('onTick');
        
        chksensor.getPoints(function(err,params,stderr){
            if(!err){
                async.series([
                    function(callback){
                            gPoints = params;
                            var chkdate = parseInt((new Date)/1000);
                            var rParams = {
                                    lineid:lineid,
                                    lineno:lineno,
                                    celsius:gPoints[0],
                                    humidity:gPoints[1],
                                    unix_write_date:chkdate
                                };
                            //redisサーバーにセンサー値をセット&publish
                            chksensor.publishAndSetRedis(rParams);
                            //Redisから設定情報を引き出す
                            /*
                            var obj;
                            chksensor.getSettingRedis({lineid:lineid,lineno:lineno},function(rep){
                                    obj = rep;
                                    if(obj){
                                        setData.targetCelsius = obj.targetCelsius,
                                        setData.targetHumidity = obj.targetHumidity,
                                        setData.celsiusMode = obj.celsiusMode,
                                        setData.humidityMode = obj.humidityMode,
                                        setData.delayCelsius = obj.delayCelsius,
                                        setData.delayhumidity = obj.delayHumidity;
                                    }
                                    console.log(setData);
                                    callback(null,'cron:1');
                            });     
                        */
                       var obj;
                            async.series([
                                function (callback){
                                   rdsAccess.readDeviceSetting(lineid,lineno,function(err,res){
                                       if(res){
                                            setData['c_top_r'] = res[0].celsius_top_range;
                                            setData['c_bot_r'] = res[0].celsius_bottom_range;
                                            setData['h_top_r'] = res[0].humidity_top_range;
                                            setData['h_bot_r'] = res[0].humidity_bottom_range;
                                            setData['c_top_r_o'] = res[0].celsius_top_range_over;
                                            setData['c_bot_r_o'] = res[0].celsius_bottom_range_over;
                                            setData['h_top_r_o'] = res[0].humidity_top_range_over;
                                            setData['h_bot_r_o'] = res[0].humidity_bottom_range_over;
                                        }
                                       callback(null,'Mysql selected.');
                                   });
                                },
                                function (callback){
                                   callback(null,'Mysql selected data set.');
                                }
                            ],function(err, result){
                                    console.log( 'final callback & result = ' + result );
                            });
                    },
                     function(callback){          
                            //現在の情報から各機器の状態を切り替える
                            devicecontrol.checkDevice(setData,{celsius:gPoints[0],humidity:gPoints[1]});
                            callback(null,'cron:2');
                     }
                 ],function(err, result){
                        console.log( 'final callback & result = ' + result );
                 });
                
                //awsのnode.jsｻｰﾊﾞｰに取得したセンサー値をpost送信する
                /*
                request.post(config.url,
                { form: {lineid:lineid,lineno:lineno,celsius:gPoints[0],humidity:gPoints[1],tDate:chkdate} },
                function(err,res,body){
                    if(!err && res.statusCode == 200){
                        console.log('status 200 res -> '+res);
                        console.log('status 200 body -> '+body);
                    } else {
                        console.log('request err res -> '+res);
                        console.log('request err body -> '+body);
                    }
                });
                */
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
            var rParams = {
                    lineid:lineid,
                    lineno:lineno,
                    celsius:gPoints[0],
                    humidity:gPoints[1],
                    unix_write_date:parseInt((new Date)/1000)
                };
                
            //redisにセット
            chksensor.setWriteTime(rParams);
            
            rdsAccess.setrecord([config.line,config.lineno,chkdate,gPoints[0],gPoints[1]],function(err){
                if(err){
                    console.log('sensor params Insert failed.');
                } else {
                    console.log('sensor params Insert Success.');
                };
            });
    }
    },
    onComplete:function() {
        console.log('onComplete');
    },
    start:false,
    timeZone:"Asia/Tokyo"
});
savejob.start();

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
