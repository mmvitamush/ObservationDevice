var deviceControl = exports;
//var cels_up_pin = 'gpio -g  write 4 ';
var pin = {
    'cels_up':'4',
    'cels_dw':'17',
    'humd_up':'22',
    'humd_dw':'24'
};

//機器の状態　OFF状態で初期化
var st = [];
st['cels_up'] = 'off',
st['cels_dw'] = 'off',
st['humd_up'] = 'off',
st['humd_dw'] = 'off';
var exec = require('child_process').exec;    
//exec('gpio -g mode 4 out');

deviceControl.checkDevice = function(setting,params){
    var nowc = params.celsius,
          nowh = params.humidity;
   var target_c,target_h;
   
   if(setting.celsiusMode === 'WAIT'){
       exec('gpio -g write 4 0');
   }else{
       
   }
    
};

//起動時の初期化処理
deviceControl.init = function(){
    var str;
    for (var key in pin){
        str = 'gpio -g mode ' + pin[key] + ' out';
        exec(str);
        console.log(str);
        
        str = 'gpio -g write ' + pin[key] + ' 0';
        exec(str);
        console.log(str);
        //GPIOを初期化後、各機器をOFFにする
        /*
        exec(str,function(err,stdout,stderr){
            if(!err){
                str = 'gpio -g write ' + pin[key] + ' 0';
                exec(str,function(err,stdout,stderr){
                    if(!err){
                        console.log('gpio ' + pin[key] + ' init success.');
                    } else {
                        console.log('gpio ' + pin[key] + ' init failed.');
                    }
                });
            }
        });*/
    }
};


