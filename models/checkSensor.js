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
