var request = require('request');
var conf = require('../config');

var sendMailSes = exports;

sendMailSes.send = function(params){
    request.post(conf.mailapi,
           { form: {lineid:params.lineid,lineno:params.lineno,text:params.text,subject:params.subject} },
            function(err,res,body){
                    if(!err && res.statusCode == 200){
                        console.log('status 200 res -> '+res);
                        console.log('status 200 body -> '+body);
                    } else {
                        console.log('request err res -> '+res);
                        console.log('request err body -> '+body);
                    }
            }
    );    
};