
/**
 * Module dependencies.
 */

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
var deviceCtrl = require('./models/deviceControl');
var rdsAccess = require('./models/rdsAccess');

var cronJob = require('cron').CronJob;
var checkTime = "*/1  * * * *";//1s
var saveTime = "*/10 * * * *";//１０分
var gPoints = [];//前回のセンサー値保存用
var config = require('./config');
var lineid = config.line,
      lineno = config.lineno;

var request = require('request');


//定期的に処理を実行する
var checkjob = new cronJob({
    cronTime:checkTime,
    onTick:function() {
        console.log('onTick');
        
        chksensor.getPoints(function(err,params,stderr){
            if(!err){
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
