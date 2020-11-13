const index = require('./index');
const expect = require('expect');
const zlib = require("zlib");
const { processMessage } = require('./esforwarding/es-forwarding');

test('Wrapper has the right context', ()=> {

    var obj = {
        processMessage: function(something, callback) {

            expect(this.testProp).toBe(5);

        },
        testProp: 5
        
    }

    var wrapped = index._wrap(obj,obj.processMessage);
    wrapped({}, {
        succeed: ()=>{}
    });

});

test('Unzips the buffer and handles message', (callback) => {
    
    var counters = {invokeHandlers: 0};

    index.invokeHandlers = (b, context)=>{
        expect(b).toMatchSnapshot("noncontrol");
        
        ++ counters.invokeHandlers; context.succeed();
    };

    var content = {
        messageType: "", 
        awsLogs: []

    };

    zlib.gzip(JSON.stringify(content), function(err, result){
 
       
        expect(err).toBeFalsy();
     
        index.handler({awslogs: {data: result.toString('base64')}}, {succeed: function(){

  
            expect(counters.invokeHandlers).toBe(1);
            callback();
            
        }});  

    });

});

 

test('Unzips the buffer and handles control message', (callback) => {
    
    var counters = {invokeHandlers: 0};

    index.invokeHandlers = (b, context)=>{
         ++ counters.invokeHandlers;
        context.succeed();
    };
    var content = {
        messageType: "CONTROL_MESSAGE", 
        awsLogs: []

    };

    zlib.gzip(JSON.stringify(content), function(err, result){
        expect(err).toBeFalsy();

        index.handler({awslogs: {data: result.toString('base64')}}, {succeed: function(){



        
            expect(counters.invokeHandlers).toBe(0);
            callback();
    

        }});

    });

});

 