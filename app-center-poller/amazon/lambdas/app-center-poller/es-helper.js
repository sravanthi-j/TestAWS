const AWS = require('aws-sdk');
const { Client } = require('@elastic/elasticsearch');
const createAwsElasticsearchConnector = require('aws-elasticsearch-connector');
const fs = require('fs');


const ENV = process.env;
const config = JSON.parse(fs.readFileSync('config.json'));
const runLocal = ENV['runLocal'] || false;
const esEndpointUrl = `https://${ENV['esEndpointUrl'] || config.esEndpointUrl}`;

var client;
if (runLocal) {

    client = new Client({
        node: {
            url: new URL('http://172.17.0.3:9200')
        }
    })
} else {
    console.log(AWS.config);
    client = new Client({
        ...createAwsElasticsearchConnector(AWS.config),
        node: esEndpointUrl
    });
}




exports.getErrorCount = async () => {
    const count = await client.count({
        index: 'dm-error-list'
    });

    return count;
}

exports.getLatestError = async () => {
    // get top 1 document from index order by timestamp desc
    const searchResp = await client.search({
        index: 'dm-error-list',
        body: {
            query: {
                "match_all": {}
            },
            size: "1",
            sort: [
                {
                    "timestamp": {
                        "order": "desc"
                    }
                }
            ]
        }
    });

    return searchResp;
}

exports.bulkIndexErrors = async (errors, platform) => {
    const bulkBody = buildBulkErrorIndexBody(errors, "dm-error-list", platform);
    const bulkResp = await client.bulk({
        refresh: true,
        body: bulkBody
    });

    return bulkResp;
}

function buildBulkErrorIndexBody(appCenterErrors, index, platform) {
    var body = [];
    appCenterErrors.forEach(e => {
        body.push({ index: { _index: index, _id: e.errorId } });
        e.platform = platform;
        body.push(e);
    });

    return body;
}

exports.deleteIndex = async (index) => {
    client.indices.delete({ index: index });
}

exports.indexExists = async (index) => {
    return client.indices.exists({ index: index });
}