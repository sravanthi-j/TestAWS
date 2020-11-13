 

/*

    Environment Variables:
    es_endpoint
    es_region

*/ 
var zlib = require('zlib'); 

const esForwarding = require("./esforwarding/es-forwarding");
//const exceptionAlerting = require('./exceptions/exception-alerting');
const processEsForwarding = wrapWithErrorHandler(esForwarding, esForwarding.processMessage);

function wrapWithErrorHandler(thisObj, f)
{
    return ((awsLogsData, context) => f.call(thisObj, awsLogsData, function(error, failedItems) {

        if (error) {
            console.log('Error: ' + JSON.stringify(error, null, 2));

            if (failedItems && failedItems.length > 0) {
                console.log("Failed Items: " + JSON.stringify(failedItems, null, 2));
            }

            context.fail(JSON.stringify(error));
        } else {
            context.succeed('Success');
        }
    }));
} 
exports._wrap = wrapWithErrorHandler;


exports.invokeHandlers = function(awsLogsData, context)
{
    // alerting moved to ElasticSearch
    //console.log("Running exceptione alerting");
    //exceptionAlerting.processMessage(awsLogsData);
    console.log("Running esforwarding");
    processEsForwarding(awsLogsData, context);
};
 
exports.handler = function (input, context) {
    // decode input from base64
    var zippedInput =  Buffer.from(input.awslogs.data, 'base64');
    
    // decompress the input
    zlib.gunzip(zippedInput, function (error, buffer) {
        if (error) { context.fail(error); return; }

        // parse the input from JSON
        var awsLogsData = JSON.parse(buffer.toString('utf8'));

        // skip control messages
        if(awsLogsData.messageType === 'CONTROL_MESSAGE') {
            
            context.succeed('Control message handled successfully');
            return;
        }

        exports.invokeHandlers(awsLogsData, context);
    });
};
 