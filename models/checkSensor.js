var exec = require('child_process').exec;
var checkSensor = exports;

//センサーから現在の値を読み取って返す
checkSensor.getPoints = function(callback){
    exec('usbrh',{maxBuffer:400*1024},function(error,stdout,stderr){
        if(!error){
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
            var points = stdout.split(' ');
            console.log('split Points :'+(1*points[0])+'-' +(1*points[1])+';');
            callback(error,stdout,stderr);
        } else {
            console.log(error);
            console.log(error.code);
            console.log(error.signal);
            callback(new Error('usbrh failed'));
            return;
        }
    });
};
