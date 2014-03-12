var deviceControl = exports;
var localclient = require('redis').createClient(6379,'127.0.0.1');
var send_ses = require('./sendMailSes');
//var cels_up_pin = 'gpio -g  write 4 ';
var pin = {
    'celsius':'4',
    'humidity':'17',
    'ventilation':'22',
    'co2':'24'
};

//リレーのスイッチ状態の保存用 0:OFF 1:ON
var sw = {
   celsius:0,
   humidity:0,
   ventilation:0,
   co2:0
};

//換気リレーは１つを３つの項目で使いまわすので１項目が換気完了するまで、他項目に換気制御をさせないようにする
var vent_sw = {
   celsius:0,
   humidity:0,
   co2:0
};

var exec = require('child_process').exec;    
//exec('gpio -g mode 4 out');

//リレー状態から変更や分岐をおこなう
deviceControl.checkDevice = function(st,sensorType,line){
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
        //換気上限値を超えて、なおかつ実行フラグが1なら換気開始
        if((nowp >= st['vent_value']) && (st['vent_flg'] == 1)){
                ventilation(sensorType,1,line);
        } else {
                if(sensorType === 'celsius'){
                    if(sw.celsius === 0){
                        changeDevice(sensorType+'-off',st,line);
                    } else {
                        sw.celsius = 0;
                        changeDevice(sensorType+'-topover',st,line);
                    }

                } else if(sensorType === 'humidity'){
                    if(sw.humidity === 0){
                        changeDevice(sensorType+'-off',st,line);
                    } else {
                        sw.humidity = 0;
                        changeDevice(sensorType+'-topover',st,line);
                    }            
                } else if(sensorType === 'co2'){

                }
        }
    } else if(nowp <= st['bot_r']) {
        ////現在値が下限を下回っている場合
        //changeDevice(sensorType+'-botover',st);
        if(sensorType === 'celsius'){
            if(sw.celsius === 0){
                sw.celsius = 1;//スイッチをON状態に変更
                changeDevice(sensorType+'-botover',st,line);
            } else {
                changeDevice(sensorType+'-on',st,line);
            }
        } else if(sensorType === 'humidity'){
            if(sw.humidity === 0){
                sw.humidity = 1;//スイッチをON状態に変更
                changeDevice(sensorType+'-botover',st,line);
            } else {
                changeDevice(sensorType+'-on',st,line);
            }            
        } else if(sensorType === 'co2'){
            
        }
    } else if((nowp < st['top_r']) && (nowp > st['bot_r'])){
        //現在値が設定範囲内に収まっている状態の時
        //changeDevice(sensorType+'-off',st);
        ventilation(sensorType,0,line);
        if(sensorType === 'celsius'){
            
            if(sw.celsius === 0){
                changeDevice(sensorType+'-off',st,line);
            } else {
                changeDevice(sensorType+'-on',st,line);
            }
        } else if(sensorType === 'humidity'){
            if(sw.humidity === 0){
                changeDevice(sensorType+'-off',st,line);
            } else {
                changeDevice(sensorType+'-on',st,line);
            }            
        } else if(sensorType === 'co2'){
            
        }
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
    }
};

//与えられたﾊﾟﾗﾒｰﾀでリレーの動作を変更する
function changeDevice(command,st,line){
    console.log(command);
    var str = command.split("-");
    var sensorType = str[0],
          com = str[1],
          top_r_o = st.top_r_o,
          bot_r_o = st.bot_r_o;
    
    if(com === 'on'){
        exec('gpio -g write '+pin[sensorType]+' 1',function(err,stdout,stderr){
            if(err){ sendAlertMail(err,pin[sensorType]+' ON',line); }
        });
        localclient.hset('deviceStatus',sensorType,1);
    }
    if(com === 'off'){
        exec('gpio -g write '+pin[sensorType]+' 0',function(err,stdout,stderr){
            if(err){ sendAlertMail(err,pin[sensorType]+' OFF',line); }
        });
        localclient.hset('deviceStatus',sensorType,0);
    }
    
    if(com === 'topover'){
        if(top_r_o === 0){//OFF
            exec('gpio -g write '+pin[sensorType]+' 0',function(err,stdout,stderr){
                if(err){ sendAlertMail(err,pin[sensorType]+' OFF',line); }
            });
            localclient.hset('deviceStatus',sensorType,0);
        } else if(top_r_o === 1){//ON
            exec('gpio -g write '+pin[sensorType]+' 1',function(err,stdout,stderr){
                if(err){ sendAlertMail(err,pin[sensorType]+' ON',line); }
            });
            localclient.hset('deviceStatus',sensorType,1);
        }
    }
    
    if(com === 'botover'){
        if(bot_r_o === 0){//OFF
            exec('gpio -g write '+pin[sensorType]+' 0',function(err,stdout,stderr){
                if(err){ sendAlertMail(err,pin[sensorType]+' OFF',line); }
            });
            localclient.hset('deviceStatus',sensorType,0);
        } else if(bot_r_o === 1){//ON
            exec('gpio -g write '+pin[sensorType]+' 1',function(err,stdout,stderr){
                if(err){ sendAlertMail(err,pin[sensorType]+' ON',line); }
            });
            localclient.hset('deviceStatus',sensorType,1);
        }
    }

}

//換気の制御
//type -> celsiu,humidity,co2(どのリレーが換気を必要としているか)
//swc -> 1なら換気リレーＯＮ 0なら換気リレーＯＦＦ
function ventilation(type,swc,line){
    var flg = true;
    //flgにfalseが代入された場合、他項目で換気中なので換気作業を割り込ませない
    for(var key in vent_sw){
        if(vent_sw[key] === 1){
            if(!(vent_sw[key] === type)){
                flg = false;
            }
        }
    }
    if(flg){
            if(swc === 1){
                exec('gpio -g write '+pin[type]+' 0',function(err,stdout,stderr){
                    if(err){ 
                        sendAlertMail(err,pin[type]+' OFF',line); 
                    } else {
                        sw[type]=0;
                        localclient.hset('deviceStatus',type,0);
                        exec('gpio -g write '+pin['ventilation']+' 1',function(err,stdout,stderr){
                            if(err){
                                sendAlertMail(err,pin['ventilation']+' ON',line); 
                            } else {
                                vent_sw[type] = 1;
                                localclient.hset('deviceStatus','ventilation',1);
                            }
                        });
                    }
                });
            } else if(swc === 0) {
                exec('gpio -g write '+pin['ventilation']+' 0',function(err,stdout,stderr){
                     if(err){ 
                         sendAlertMail(err,pin['ventilation']+' OFF',line); 
                     } else {
                         vent_sw[type] = 0;
                         localclient.hset('deviceStatus','ventilation',0);
                     } 
                });
            }
        }
};

function sendAlertMail(err,text,line){
    send_ses.send({lineid:line.lineid,
                             lineno:line.lineno,
                             text:err+': '+text,
                             subject:'Device: '+lineid+':'+lineno+' changeDevice'});
};