
const EsPort = require("./elasticsearch-port").ElasticsearchPort;
const EventEmitter = require('events');
const expect = require('expect');

class ResponseEmitter extends EventEmitter {

    constructor(message, statusCode)
    {
        super();
        this.statusCode = statusCode;
        this.message = message;
    }

    emitMessage(){
        this.emit('data', this.message);
        this.emit('end');
    }
    end() {
 
    }
     
}


class MockHttps
{   
    constructor(emitter)
    {
        this.emitter = emitter;
    }

    request(requestParam, callback){
 
        callback(this.emitter);
        this.emitter.emitMessage();
        this.emitter.removeAllListeners();
    }

}
 


describe('Peforms request', () => {

 test('With one fail and one success', async () => {

    var esPort = new EsPort(
        new MockHttps(
            new ResponseEmitter(JSON.stringify({
                items: [
                    {index: {status: 500}},
                    {index: {status: 200}}
                ]
            }), 200
        ))); 
        var response = await esPort.post({});
        expect(response.attemptedItems).toBe(2);
        expect(response.failedItems).toBe(1);
        expect(response.successfulItems).toBe(1);    
  });
  test('Promise rejects with error', () => {

      var esPort = new EsPort(
        new MockHttps(
            new ResponseEmitter(JSON.stringify({
                items: [
                    {index: {status: 500}}
                 ]
            }), 500
        ))); 
        return expect(esPort.post({})).rejects.toMatchSnapshot();
    
  });
  

});


