
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
var db_mongo = require('./models/database_mongo');
var request = require('request');
var chksensor = require('./models/checkSensor');
var deviceCtrl = require('./models/deviceControl');
var cronJob = require('cron').CronJob;
var checkTime = "*/1 * * * *";//１分
var saveTime = "*/10 * * * *";//１０分
var gPoints = [];//前回のセンサー値保存用

//定期的に処理を実行する
var checkjob = new cronJob({
    cronTime:checkTime,
    onTick:function() {
        console.log('onTick');
        chksensor.getPoints(function(err,stdout,stderr){
            if(!err){
                console.log('app.js stdout: ' + stdout);
                //awsのnode.jsｻｰﾊﾞｰに取得したセンサー値をpost送信する
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
        console.log('onTick at Save');
        
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
