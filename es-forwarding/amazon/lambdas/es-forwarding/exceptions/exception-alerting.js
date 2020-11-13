
const querystring = require('querystring');
const https = require('https');
const url = require('url');

/* Configuration  */

/**
 * This is the webhook to use
 */
const LOG_WEBHOOK = process.env["TEAMS_WEBHOOK"] || "https://outlook.office.com/webhook/5ba9b0f5-45f9-4e33-a32f-f6816ac440e3@f039b656-fc02-4e54-88ba-82626f29b5a1/IncomingWebhook/ff12d9b212e8471dbd5172b6e4f1cf3c/5cb7a7d0-a3d9-42ae-839e-3b738b86a00b";

/**
 * This is the environment (arch, dev, etc)
 */
const ENVIRONMENT = process.env["ENVIRONMENT"] || "local-test";

/**
 * This is the cloudwatch URL 
 */
const CLOUDWATCH_PREFIX = process.env["CLOUDWATCH_PREFIX"] || "https://eu-west-1.console.aws.amazon.com/cloudwatch/home?region=eu-west-1#";


/* Implementation  */


const NULL_MESSAGE_CARD = {
    _postMessage: ()=>{},
    "sections":[]
};

/**
 * One of these filters must match
 */
const INCLUSION_FILTERS = [
    /[Ee]xception/g
];

/**
 * If any of the regexes in this array match, the message will be excluded
 */
const EXCLUSION_FILTERS = [
    /Execution plan of/g,
    /SecurityTokenExpiredException/g,
    /End of stack trace/g,
    /End of inner/g
];


/**
 * Creates the activity template for a log message
 * @param {object} logMessage
 */
function toActivityTemplate(logMessage, logGroup, link)
{
 
        return  {
            "activityTitle": `${logGroup}:${logMessage.message}`,
            "activitySubtitle": `${ENVIRONMENT} [${logGroup}](${link})`,  
            "facts": Object.keys(logMessage).filter(f=>f!=="message")
                     .map(key=>{
                         return {
                         name:key,
                         value:logMessage[key]
                     };
                    }
                 ),           
            "markdown": true
        };


}

 

/**
 * Composes a message card for Teams
 * @param {Array} logMessages
 * @param {object} sections The sections to add
 * 
 */
function composeMessageCard(logName, sections)
{

    if(sections.length === 0)
        return NULL_MESSAGE_CARD;

    const messageCard = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        "themeColor": "0076D7",
        "title": `Exception in ${logName}`,
        "summary": `One or more exceptions were detected in the ${logName} service.`,
        "sections": distinctMessages(sections),
        _postMessage: ()=>{           
            pushMessageCard(messageCard);
        }
    };
    return messageCard;
}

/**
 * 
 * Returns the log name from the log group name
 * @param {string} logGroupName  The log group name
 */
function extractLogName(logGroupName)
{
    var splitName = logGroupName.split("/");

    return splitName.pop() || logGroupName;
}

/**
 * Processes the object containing log events and returns an array of messages for the webhook url
 * @param {Object} logObject  
 * @returns {Object} Message card
 */
function toMessageCard(logObject)
{
    if(!logObject)
        return NULL_MESSAGE_CARD;


    //filter the events.  We have some specific exclusions
    const sections = logObject.logEvents.filter(ev=>{
        
        return  INCLUSION_FILTERS.some(ry=>ev.message.match(ry)) &&
               !EXCLUSION_FILTERS.some(rx=>ev.message.match(rx));

    }).map(m=> toActivityTemplate(
        m, logObject.logGroup, createLogLink(logObject, m.timestamp)
    ));
    const messageCard = composeMessageCard(extractLogName(logObject.logGroup), sections);

    return messageCard;
}   

/**
 * Creates a link to AWS cloudwatch from the received log messages
 * @param {*} results The cloudwatch log object
 */
function createLogLink(results, timestamp)
{ 
    const options = { "logEventViewer:group": results.logGroup, 
        stream: results.logStream
        };

    /*
    Commenting out for now - this date format is wrong
    if(timestamp)
    {
        options.start = new Date(timestamp * 1000).toISOString();
    }
    */
    var toAppend = querystring.stringify(options, ';', '=' );
    toAppend = toAppend.replace("r%3Agr", "r:gr");    //correct : escaping issue
    return CLOUDWATCH_PREFIX + toAppend;
}

/**
 * Sends a message to the webhook
 * @param {Object} messageCard 
 */
function pushMessageCard(messageCard)
{
    const urlParsed = url.parse(LOG_WEBHOOK);

    const data = JSON.stringify(messageCard);

    const options = {
        hostname: urlParsed.hostname,
        port: urlParsed.port || 443,
        path: urlParsed.path,
        method: 'POST',

        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    }

    const req = https.request(options, (res) => {
   
        console.log(`Sent exception message.  StatusCode: ${res.statusCode}`);

        res.on('data', (d) => {
            process.stdout.write(d);
        });
    });

    req.on('error', (error) => {
       console.error(error);
    });

    req.write(data);
    req.end();
}

/**
 * Ensures the array of messages in the sections array is unique
 * @param {Array} sectionArray 
 */
function distinctMessages(sectionArray)
{
    var objSet = {};
    return sectionArray.filter((f)=>{
        
        if(objSet[f.activityTitle])
            return false;
        objSet[f.activityTitle] = 1;

        return true;
    });

}

/**
 * Processes the message from AWS
 * @param {Buffer} payload  The gunziped, json parsed payload from AWS  
 */
function processMessage(parsed) {
    const card = toMessageCard(parsed);
    card._postMessage();
}

/* Exports  */ 
exports.NULL_MESSAGE_CARD = NULL_MESSAGE_CARD;

exports.toMessageCard = toMessageCard;

exports.processMessage = processMessage;
 



