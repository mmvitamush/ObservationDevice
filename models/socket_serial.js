var async = require('async');
var Arduinode = require('arduinode').Arduinode;
var numOfConnections = 0;

exports.onConnection = function(socket) {
        console.log('onConnection');
           numOfConnections++;
           socket.on("notify-all",arduinode._status);
           
           socket.on("disconnect",function(){
               console.log('socket disconnect');
               numOfConnections--;
           });
           
           socket.on("digitalWrite",function(data){
               switch(data.mode){
                    case "INPUT":
                        arduinode.switchToInput(data.port);
                        break;
                    case "OUTPUT":
                        arduinode.switchToOutput(data.port);
                        break;
                }
           });
           // ポートの初期化が終わったらポートの値をwebsocketでpushする.
           // 但し、1つ以上の接続があるときのみ.
            arduinode.on("event", function(data){
                if(numOfConnections > 0){
                  io.sockets.emit("event", data);
                }
            });

            arduinode.on("close", function(){
              connectArduino();
            });
           
            arduinode.digitalWriteWithNotify = function(port, value){
                arduinode.digitalWrite(port, value, function(err, result){
                    if(err){
                      return console.log(err);
                    }
                    arduinode._status.digital[port].value = value;
                    io.sockets.emit("notify", {port:port, direction:"OUTPUT", value:value});
                    console.log(result);
                });
            }

            arduinode.switchToInput = function(port){
                async.series([
                    function(cb){ arduinode.pinMode(port, "INPUT", cb); },
                    function(cb){ arduinode.digitalStreamOn(port, 200, cb); }
                ],
                function(err, results){
                    if(err){
                      return console.log(err);
                    }
                    // valueはとりあえず0で
                    arduinode._status.digital[port] = {direction:"INPUT", value:0};
                    io.sockets.emit("notify", {port:port, direction:"INPUT", value:0});
                    console.log(results);
                });
            };

            arduinode.switchToOutput = function(port){
                async.series([
                    function(cb){ arduinode.digitalStreamOff(port, cb); },
                    function(cb){ arduinode.pinMode(port, "OUTPUT", cb); },
                    function(cb){ arduinode.digitalWrite(port, 0, cb); }
                ],
                function(err, results){
                    if(err){
                      return console.log(err);
                    }
                    arduinode._status.digital[port] = {direction:"OUTPUT", value:0};
                    io.sockets.emit("notify", {port:port, direction:"OUTPUT", value:0});
                    console.log(results);
                });
            };
};

var arduinode = null;
var portName = '/dev/tty.usbmodemfd121'; // Mac環境
//var portName = '/dev/ttyACM0'; // RaspberryPi環境
var connectArduino = function() {
        arduinode = new Arduinode(portName,function(err,result){
            if(err){
                setTimeout(connectArduino,1000);
                return console.log(err);
            }
            // Arduinoのポートを初期化する.
        async.series(init_arduino_tasks, function(err, results){
                if(err) throw err;
                console.log("*********** init arduino ***********");
                console.log(results);
                console.log("************************************");

                // 一つ以上の接続があったら、通知する.
                if(numOfConnections > 0){
                  io.sockets.emit("notify-all", arduinode._status);
                }
        });
            
            arduinode._status = {
                digital:[
                {direction:"INPUT", value:0},
                {direction:"INPUT", value:0},
                {direction:"INPUT", value:0},
                {direction:"INPUT", value:0},
                {direction:"INPUT", value:0},
                {direction:"INPUT", value:0},
                {direction:"INPUT", value:0},
                {direction:"INPUT", value:0},
                {direction:"INPUT", value:0},
                {direction:"INPUT", value:0},
                {direction:"INPUT", value:0},
                {direction:"INPUT", value:0},
                {direction:"INPUT", value:0}
                ]
            };
        });
    
        var init_arduino_tasks = [
          function(cb){ arduinode.pinMode(0, "INPUT", cb);},
          function(cb){ arduinode.pinMode(1, "INPUT", cb);},
          function(cb){ arduinode.pinMode(2, "INPUT", cb);},
          function(cb){ arduinode.pinMode(3, "INPUT", cb);},
          function(cb){ arduinode.pinMode(4, "INPUT", cb);},
          function(cb){ arduinode.pinMode(5, "INPUT", cb);},
          function(cb){ arduinode.pinMode(6, "INPUT", cb);},
          function(cb){ arduinode.pinMode(7, "INPUT", cb);},
          function(cb){ arduinode.pinMode(8, "INPUT", cb);},
          function(cb){ arduinode.pinMode(9, "INPUT", cb);},
          function(cb){ arduinode.pinMode(10, "INPUT", cb);},
          function(cb){ arduinode.pinMode(11, "INPUT", cb);},
          function(cb){ arduinode.pinMode(12, "INPUT", cb);},
          function(cb){ arduinode.pinMode(13, "INPUT", cb);},
          function(cb) { arduinode.digitalStreamOn(0, 200, cb); },
          function(cb) { arduinode.digitalStreamOn(1, 200, cb); },
          function(cb) { arduinode.digitalStreamOn(2, 200, cb); },
          function(cb) { arduinode.digitalStreamOn(3, 200, cb); },
          function(cb) { arduinode.digitalStreamOn(4, 200, cb); },
          function(cb) { arduinode.digitalStreamOn(5, 200, cb); },
          function(cb) { arduinode.digitalStreamOn(6, 200, cb); },
          function(cb) { arduinode.digitalStreamOn(7, 200, cb); },
          function(cb) { arduinode.digitalStreamOn(8, 200, cb); },
          function(cb) { arduinode.digitalStreamOn(9, 200, cb); },
          function(cb) { arduinode.digitalStreamOn(10, 200, cb); },
          function(cb) { arduinode.digitalStreamOn(11, 200, cb); },
          function(cb) { arduinode.digitalStreamOn(12, 200, cb); },
          function(cb) { arduinode.digitalStreamOn(13, 200, cb); },
          function(cb) { arduinode.analogStreamOn(0, 200, cb); },
          function(cb) { arduinode.analogStreamOn(1, 200, cb); },
          function(cb) { arduinode.analogStreamOn(2, 200, cb); },
          function(cb) { arduinode.analogStreamOn(3, 200, cb); },
          function(cb) { arduinode.analogStreamOn(4, 200, cb); },
          function(cb) { arduinode.analogStreamOn(5, 200, cb); }
        ];
};

connectArduino();
//Dateオブジェクトから日時を表す文字列を生成する
function _formatDate(date){
   var mm = date.getMonth();
   var dd = date.getDate();
   var HH = date.getHours();
   var MM = date.getMinutes();
   if (HH < 10) {
     HH = '0' + HH;
   }
   if (MM < 10) {
     MM = '0' + MM;
   }
   return mm + '/' + dd + ' ' + HH + ':' + MM;
}