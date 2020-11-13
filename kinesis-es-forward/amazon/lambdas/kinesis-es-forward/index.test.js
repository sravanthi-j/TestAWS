const index = require('./index');
const expect = require('expect');
const zlib = require("zlib");


test('Unzips and decode base64 the buffer and handles message', () => {
    
    var counters = {invokeHandlers: 0};

    index.invokeHandlers = (b, context)=>{
        expect(b).toMatchSnapshot("noncontrol");
        
        ++ counters.invokeHandlers; context.succeed();
    };

    var content = {
      data: "H4sIAAAAAAAAAK2RwY7TMBCGX8XKuUEex3bs3Cq2LUiURW33tKpWaeqm1iZOZDuFsuq7M9mChAAhIXqIYs//z8w345ekNSGUtdmce5MUyd10M31aztbr6WKWTJLuszMew4wLJaXSkAmO4aarF74belT2Q7o3p/RgvQmx66/iOnpTtqjalBoJguZwgJ3UO9CHp+8NA1rDsAuVt320nZvbJhofkuLx15opVsTLKI/HqzGFpWYLebdazt/xRbJ97Ts7GRfHEi+J3WP7TORSKJ5plWmRUw6KZsAlF0xpxnGYjCsOUnAJXAuggjPIgFFEixY5Y9nijCBplmuhUaB08mNhWP6+ioTlBGghREGB2D4FmjLgKcMflSScQzTtviBvcR/R7ElobGXIQzCerF+P3YH4rotvksvk/5jh5szrWPqReY25+D6YIjmMwMOIfxtqdnPqlWm70z9tWjGlsJ2SAkALIXPQjGIoB2SVLFcqU0JSwXIuKADL/sQscaS/Movfmcu2/Nq5NIQ2xQwXC8IoSqPpp7T3H+f35PFD5+rV4Jx19admqK0Ly9Jhlt+SzdF4Q0r8XEca9BF/NZL+6iTV4D3Wb86kNjGOivliqmF83JSEZ9v3YywejfXkaMomHqujqZ6Ty/byDfnFzUQgBAAA",
      approximateArrivalTimestamp: 1603796109.372
  };
  var payload = new Buffer(content.data, 'base64');
  zlib.unzipSync((payload), function(err, result){
        var logrecord = JSON.parse(result.logEvents);
        console.log(err)
        expect(err).toBeFalsy();
     
        index.handler({eslogs: {data: logrecord}}, {succeed: function(){
            
            expect(counters.invokeHandlers).toBe(1);
            callback();
            
        }});  

    });

});