// wraper for index.js ... just for runing this locally without serverless offline and etc
// will be replaced by tests
// TODO: write test that will do this ? or not //

const lambda = require('./index')
const event = {
    "version": "0",
    "id": "9408cba6-a54d-be8b-42a6-d700423737db",
    "detail-type": "Scheduled Event",
    "source": "test event",
    "account": "904425940166",
    "time": "2020-10-08T15:26:08Z",
    "region": "eu-west-1",
    "resources": [
        "arn:aws:events:eu-west-1:904425940166:rule/lambda-timer-servicenow-api-poller"
    ],
    "detail": {}
}


lambda.handler(event, {})