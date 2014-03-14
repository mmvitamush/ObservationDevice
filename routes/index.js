
/*
 * GET home page.
 */
var rediscli = require('redis').createClient(6379,'127.0.0.1');

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

exports.getTimeSchedule = function(req,res){
    var key = 'timeSchedule';
    var subkey = 'relay'+req.body.relayNum;
    rediscli.hget(key,subkey,function(err,rep){
            if(err){
                console.log(err);
                res.send(500);
                return;
            } else {
                res.json(200,JSON.parse(rep));
                return;
            } 
    });
    
};

exports.changeTimeSchedule = function(req,res){
    var key = 'timeSchedule';
    var subkey = 'relay'+req.body.relayNum;
    var params = {
        start_date:req.body.start_date,
        end_date:req.body.end_date,
        top_range:req.body.top_range,
        top_range_over:req.body.top_range_over,
        bottom_range:req.body.bottom_range,
        bottom_range_over:req.body.bottom_range_over,
        vent_value:req.body.vent_value,
        vent_flg:req.body.vent_flg
    };
    rediscli.hset(key,subkey,JSON.stringify(params),function(err,rep){
            if(err){
                console.log(err);
                res.json(200,{response:'failed'});
                return;
            } else {
                res.json(200,{response:'success'});
                return;
            }
    });
};