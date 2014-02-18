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

deviceControl.checkDevice = function(st,params){
    //センサーから取得した現在値をセット
    var nowc = params.celsius,
          nowh = params.humidity;
   /**************************
    *  2位置制御(on-off control)  *
    **************************/
    if(nowc >= st['c_top_r_o']){//現在値が上限を超えている場合
        changeDevice('celsius-top-over',st['c_top_r_o']);
    } else if(nowc <= st['c_bot_r_o']) {//現在値がを下回っている場合
        changeDevice('celsius-bot-over',st['c_bot_r_o']);
    } else if((nowc < st['c_top_r']) && (nowc > st['c_bot_r'])){
        //現在温度が設定範囲内に収まっているのでＯＦＦ
        changeDevice('celsius-off',null);
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

//リレーの動作を変更する
function changeDevice(command,param){
    if(command === 'celsius-up'){
        exec('gpio -g write '+pin['cels_up']+' 1');
    }
    if(command === 'celsius-off'){
        exec('gpio -g write '+pin['cels_up']+' 0');
    }
    
    if(command === 'celsius-top-over'){
        if(param === 0){//OFF
            exec('gpio -g write '+pin['cels_up']+' 0');
        } else if(param === 1){//ON
            exec('gpio -g write '+pin['cels_up']+' 0');
        }
    }
    
    if(command === 'celsius-bot-over'){
        if(param === 0){//OFF
            exec('gpio -g write '+pin['cels_up']+' 0');
        } else if(param === 1){//ON
            exec('gpio -g write '+pin['cels_up']+' 1');
        }
    }
    
    
    
    if(command === 'humidity-up'){
        exec('gpio -g write '+pin['humd_up']+' 1');
    }
    if(command === 'humidity-down'){
        exec('gpio -g write '+pin['humd_up']+' 0');
    }
    if(command === 'humidity-off'){
        exec('gpio -g write '+pin['humd_up']+' 0');
    }
}
