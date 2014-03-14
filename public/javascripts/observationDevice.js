$(function(){
var url = document.URL;
var myurl = url.split('/')[2];

   $('#datetimepicker1').datetimepicker({
	addSliderAccess: true,
	sliderAccessArgs: { touchonly: false },
	changeMonth: false,
	changeYear: false,
                  dateFormat:'yy/mm/dd'
        });
        
   $('#datetimepicker2').datetimepicker({
	addSliderAccess: true,
	sliderAccessArgs: { touchonly: false },
	changeMonth: false,
	changeYear: false,
                  dateFormat:'yy/mm/dd'
        });
        
   $('#RelaySelector').on('change',function(){ 
             if($('#RelaySelector option:selected').val() !== '0'){
                 var rep = ajaxLoading('http://'+myurl+'/api/getTimeSchedule','post','json',{relayNum:$('#RelaySelector option:selected').val()});
                 console.log(rep);
                 if(rep){
                     $('#topRangeSpinner').val(rep.top_range);
                     $('#bottomRangeSpinner').val(rep.bottom_range);
                     $("#ventilationSpinner").val(rep.vent_value);
                     $('input[name="TopRange"]').eq(rep.top_range_over).prop('checked',true);
                     $('input[name="BottomRange"]').eq(rep.bottom_range_over).prop('checked',true);
                     $('input[name="ventRadio"]').eq(rep.vent_flg).prop('checked',true);
                     $('#datetimepicker1').val(computeDuration(rep.start_date));
                     $('#datetimepicker2').val(computeDuration(rep.end_date));
                 }
            }
   });
   
   $('#setBtn').click(function(){
       if($('#RelaySelector option:selected').val() !== '0'){
                var postData = {
                    relayNum:$('#RelaySelector option:selected').val(),
                    start_date:Math.round((new Date($('#datetimepicker1').val())).getTime()/1000),
                    end_date:Math.round((new Date($('#datetimepicker2').val())).getTime()/1000),
                    top_range:$('#topRangeSpinner').val(),
                    top_range_over:$('input[name="TopRange"]:checked').val(),
                    bottom_range:$('#bottomRangeSpinner').val(),
                    bottom_range_over:$('input[name="BottomRange"]:checked').val(),
                    vent_value:$("#ventilationSpinner").val(),
                    vent_flg:$('input[name="ventRadio"]:checked').val()
                };
                var rep = ajaxLoading('http://'+myurl+'/api/changeTimeSchedule','post','json',postData);
                if(rep === 'failed'){
                    window.alert('更新失敗');
                }
        }
   });
   
   $( "#ventilationSpinner" ).spinner();
   $('#topRangeSpinner').spinner();
   $('#bottomRangeSpinner').spinner();
});

//非同期通信でサーバからデータを受信する
function ajaxLoading(url,type,dataType,data){
    var res;
        $.ajax({
             url: url,
             type: type,
             dataType:dataType,
             data:data,  
             async:false,
             timeout: 20000,
               //送信前
             beforeSend:function(xhr,settings) {},
               //応答後
             complete: function(xhr,textStatus) {},
               //通信成功時の処理
             success:function(result,textStatus,xhr) {
                         res = result;
                   },
               //失敗時の処理
             error:function(xhr, textStatus, error) {
                    res = false;
               }
           });
           return res;
}  

//0埋め
function toDoubleDigits(num) {
  num += "";
  if (num.length === 1) {
    num = "0" + num;
  }
 return num;     
};

//ミリ秒を時分秒へ変換
function computeDurationTime(ms){
    //var data = new Date(ms-32400000);
    var data = new Date(ms*1000);
    var hh = toDoubleDigits(data.getHours());
    var mm = toDoubleDigits(data.getMinutes());
    //var ss = toDoubleDigits(data.getSeconds());
  
    //return hh+':'+mm+':'+ss;
    return hh+':'+mm;
}

function nowD(){
    var data = new Date();
    var Y = data.getFullYear();
    var M = data.getMonth()+1;
    var D = data.getDate();
    return String(Y)+String(toDoubleDigits(M))+String(toDoubleDigits(D));
};

//ミリ秒を日時へ変換
function computeDuration(ms){
    //var data = new Date(ms-32400000);
    var data = new Date(ms*1000);
    var Y = data.getFullYear();
    var M = toDoubleDigits(data.getMonth()+1);
    var D = toDoubleDigits(data.getDate());
    var hh = toDoubleDigits(data.getHours());
    var mm = toDoubleDigits(data.getMinutes());
    var ss = toDoubleDigits(data.getSeconds());
  
    return Y+'/'+M+'/'+D+' '+hh+':'+mm+':'+ss;
}

//与えられた x が数値か、もしくは文字列での数字かどうかを調べる。数値または数字なら true.
function isNumber(x){ 
    if( typeof(x) != 'number' && typeof(x) != 'string' )
        return false;
    else 
        return (x == parseFloat(x) && isFinite(x));
}

function getUnixTime(num){
    var t = new Date(num);
    var u = Math.round(t.getTime()/1000);
    return u;
}

function chk(num){
    if(num === 0){
        return false;
    } else {
        return true;
    }
}