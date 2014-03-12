var deviceControl = exports;
var bs = require('bonescript');
var localclient = require('redis').createClient(6379,'127.0.0.1');
//var cels_up_pin = 'gpio -g  write 4 ';
var pin = {
    'celsius_up':'P8_15',
    'humidity_up':'P8_16',
    'ventilation_dw':'P8_17',
    'co2_dw':'P8_18'
};

//リレーのスイッチ状態の保存用 0:OFF 1:ON
var sw = {
   celsius:0,
   humidity:0,
   ventilation:0,
   co2:0
};

var exec = require('child_process').exec;    
//exec('gpio -g mode 4 out');

//リレー状態から変更や分岐をおこなう
deviceControl.checkDevice = function(st,sensorType){
    console.log(':::'+sensorType+':::');
    console.log(st);
    //センサーから取得した現在値をセット
    var nowp = st.now_p;
   /**************************
    *  2位置制御(on-off control)  *
    **************************/
    if(nowp >= st['top_r']){
        ////現在値が上限を超えている場合
        //changeDevice(sensorType+'-topover',st);
        if(sensorType === 'celsius'){
            if(sw.celsius === 0){
                changeDevice(sensorType+'-off',st);
            } else {
                sw.celsius = 0;
                changeDevice(sensorType+'-topover',st);
            }
        } else if(sensorType === 'humidity'){
            
        } else if(sensorType === 'ventilation'){
            
        } else if(sensorType === 'co2'){
            
        }
    } else if(nowp <= st['bot_r']) {
        ////現在値が下限を下回っている場合
        //changeDevice(sensorType+'-botover',st);
        if(sensorType === 'celsius'){
            if(sw.celsius === 0){
                sw.celsius = 1;//スイッチをON状態に変更
                changeDevice(sensorType+'-botover',st);
            } else {
                changeDevice(sensorType+'-on',st);
            }
        } else if(sensorType === 'humidity'){
            
        } else if(sensorType === 'ventilation'){
            
        } else if(sensorType === 'co2'){
            
        }
    } else if((nowp < st['top_r']) && (nowp > st['bot_r'])){
        //現在値が設定範囲内に収まっている状態の時
        //changeDevice(sensorType+'-off',st);
        if(sensorType === 'celsius'){
            if(sw.celsius === 0){
                changeDevice(sensorType+'-off',st);
            } else {
                changeDevice(sensorType+'-on',st);
            }
        } else if(sensorType === 'humidity'){
            
        } else if(sensorType === 'ventilation'){
            
        } else if(sensorType === 'co2'){
            
        }
    }
                 
};

//起動時の初期化処理
deviceControl.init = function(){
    for (var key in pin){
        bs.pinMode(pin[key],bs.OUTPUT);
        console.log('init: '+pin[key]);
    }
};

//与えられたﾊﾟﾗﾒｰﾀでリレーの動作を変更する
function changeDevice(command,st){
    console.log(command);
    var str = command.split("-");
    var sensorType = str[0],
          com = str[1],
          top_r_o = st.top_r_o,
          bot_r_o = st.bot_r_o;
    
    if(com === 'on'){
        bs.digitalWrite(pin[sensorType+'_up'],bs.HIGH);
        localclient.hset('deviceStatus',sensorType+'_up',1);
    }
    if(com === 'off'){
        bs.digitalWrite(pin[sensorType+'_up'],bs.LOW);
        localclient.hset('deviceStatus',sensorType+'_up',0);
    }
    
    if(com === 'topover'){
        if(top_r_o === 0){//OFF
            bs.digitalWrite(pin[sensorType+'_up'],bs.LOW);
            localclient.hset('deviceStatus',sensorType+'_up',0);
        } else if(top_r_o === 1){//ON
            bs.digitalWrite(pin[sensorType+'_up'],bs.HIGH);
            localclient.hset('deviceStatus',sensorType+'_up',1);
        }
    }
    
    if(com === 'botover'){
        if(bot_r_o === 0){//OFF
            bs.digitalWrite(pin[sensorType+'_up'],bs.LOW);
            localclient.hset('deviceStatus',sensorType+'_up',0);
        } else if(bot_r_o === 1){//ON
            bs.digitalWrite(pin[sensorType+'_up'],bs.HIGH);
            localclient.hset('deviceStatus',sensorType+'_up',1);
        }
    }

}
