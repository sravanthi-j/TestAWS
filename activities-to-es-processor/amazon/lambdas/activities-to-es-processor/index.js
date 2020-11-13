const SqsToActivitiesAdapter = require("./adapters/sqs-to-activities").SqsToActivitiesAdapter;
const ActivitiesToRequestAdapter = require("./adapters/activities-to-request").ActivitiesToRequestAdapter;
const InvalidMessageEvent = require('./adapters/events/InvalidMessageEvent');
const ActivityEvent = require('./adapters/events/ActivityEvent');
const EsPort = require("./ports/elasticsearch-port").ElasticsearchPort;

const awsKey = process.env.AWS_SECRET_ACCESS_KEY;
const awsKeyId = process.env.AWS_ACCESS_KEY_ID;
const awsSessionToken = process.env.AWS_SESSION_TOKEN;
const esEndpoint = process.env.es_endpoint;
const esIndex = process.env.ES_INDEX || "activities";

/**
 * Reads gateway activity from SQS and posts to elasticsearch
 * 
 * @param event One or more records of api gateway activity
 * @param context unused. Could send info about results back but do not.
 */
async function main(event, context) {
    const qAdapter = new SqsToActivitiesAdapter();
    const events = qAdapter.process(event);

    if(events.find(item => item instanceof(InvalidMessageEvent))) {
        console.log(`Malformed message: ${JSON.stringify(event)}`);
    }
 
    // Dropped pings. They are just getting logged.

    const activities = events.filter(item => item instanceof(ActivityEvent));

    if(!activities)
        return;

    const requestAdapter =  new ActivitiesToRequestAdapter(awsKey, 
        awsSessionToken, awsKeyId, esEndpoint, esIndex);

    const request = requestAdapter.process(activities);

    const port = new EsPort();

    const response = await port.post(request);
    
    console.log(`Processed ${response.successfulItems}/${response.attemptedItems} events successfully`);

  }

  exports.handler = main;