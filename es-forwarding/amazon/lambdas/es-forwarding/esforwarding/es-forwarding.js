// v1.1.2
// FROM: https://gist.githubusercontent.com/iMilnb/27726a5004c0d4dc3dba3de01c65c575/raw/f247d6007eafa7b1ed2490a38fba95cf53f06025/cwl2es.js
// this lambda is the one automatically created by AWS
// when creating a CWL to ES stream using the AWS Console.
// I just added the `endpoint` variable handling.
//

/*

    Environment Variables:
    es_endpoint
    es_region

*/
var https = require('https');
var crypto = require('crypto');
 
const ENV = process.env;

var endpoint = ENV.es_endpoint;

/**
 * Processes the unzipped log message payload
 * @param {*} awsLogsData The aws log data (unzipped, json parsed)
 * @param {*} callback The callback function (error, failedItems)
 */
exports.processMessage = function(awsLogsData, callback) {

    var elasticsearchBulkData = this.transform(awsLogsData);
    console.log(elasticsearchBulkData);

    // post documents to the Amazon Elasticsearch Service
    post(elasticsearchBulkData, function (error, success, statusCode, failedItems) {
        if (error) {
            callback(error, failedItems);
        } else {
            callback();
        }
    });
} 


exports.transform = payload => {
    let bulkRequestBody = '';
    const indexName = getIndexName(payload.logGroup);

    const actionFromPayload = {
        "_index": indexName,
        "_type": payload.logGroup
    }

    const sourceFromPayload = {
        "@owner": payload.owner,
        "@log_group": payload.logGroup,
        "@log_stream": payload.logStream
    }

    payload.logEvents.forEach(logEvent => {
        const sourceFromDetails = this.buildSource(logEvent.message, logEvent.extractedFields);
        const sourceFromEvent = {
            "@id": logEvent.id,
            "@timestamp": new Date(1 * logEvent.timestamp).toISOString(),
            "@message": logEvent.message
        };
        const fullSource = {...sourceFromDetails, ...sourceFromEvent, ...sourceFromPayload};

        const actionFromEvent = {
                "_id": logEvent.id
        }
        const action = {
            index: {...actionFromPayload, ...actionFromEvent}
        };

        bulkRequestBody += [
            JSON.stringify(action),
            JSON.stringify(fullSource),
        ].join('\n') + '\n';
    });

    console.log(bulkRequestBody);

    return bulkRequestBody;
}

function getIndexName(logGroup) {
    // index name format: cwl-YYYY.MM.DD
    return logGroup
        .replace(/\W+|_+/g, '-')
        .replace(/^-/, '')
        .toLowerCase();    
}

exports.buildSource = (message, extractedFields) => {
    if (!extractedFields)
        return this.extractJson(message);

    var source = {};

    for (var key in extractedFields) {
        if (!extractedFields.hasOwnProperty(key) || !extractedFields[key]) {
            continue;
        }

        var value = extractedFields[key];

        if (isNumeric(value)) {
            source[key] = 1 * value;
            continue;
        }

        const json = this.extractJson(value, null);
        if (json !== null) {
            source['$' + key] = json;
        }

        source[key] = value;
    }
    return source;
}

exports.extractJson = function(message, defaultValue = {}) {
    if(!message || typeof(message) !== 'string') return defaultValue;
    const jsonStart = message.indexOf('{');
    if (jsonStart < 0) return defaultValue;
    const jsonSubString = message.substring(jsonStart);

    const [isValid, payload] = this.tryParseJson(jsonSubString);
    return isValid ? payload : defaultValue;
}

exports.tryParseJson = message => {
    try {
        const json = JSON.parse(message);
        return [true, json];
    }
    catch (e) {
        return [false, e];
    }
};

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function post(body, callback) {
    const requestParams = exports.buildRequest(endpoint, body);

    const request = https.request(requestParams, response => {
        let responseBody = '';
        response.on('data', chunk => responseBody += chunk);
        response.on('end', () => {
            const info = JSON.parse(responseBody);
            let failedItems;
            let success;

            if (response.statusCode >= 200 && response.statusCode < 299) {
                failedItems = info.items.filter(x => x.index.status >= 300);

                success = {
                    "attemptedItems": info.items.length,
                    "successfulItems": info.items.length - failedItems.length,
                    "failedItems": failedItems.length
                };
            }

            const error = response.statusCode !== 200 || info.errors === true ? {
                "statusCode": response.statusCode,
                "responseBody": responseBody
            } : null;

            callback(error, success, response.statusCode, failedItems);
        });
    }).on('error', e => callback(e));
    request.end(requestParams.body);
}

exports.buildRequest= function(endpoint, body, getDate = () => new Date()) {
    const endpointParts = endpoint.match(/^([^\.]+)\.?([^\.]*)\.?([^\.]*)\.amazonaws\.com$/);
    const region = endpointParts[2];
    const service = endpointParts[3];
    const datetime = getDate().toISOString().replace(/[:\-]|\.\d{3}/g, '');
    const date = datetime.substr(0, 8);
    const kDate = hmac('AWS4' + process.env.AWS_SECRET_ACCESS_KEY, date);
    const kRegion = hmac(kDate, region);
    const kService = hmac(kRegion, service);
    const kSigning = hmac(kService, 'aws4_request');

    const request = {
        host: endpoint,
        method: 'POST',
        path: '/_bulk',
        body: body,
        headers: {
            'Content-Type': 'application/json',
            'Host': endpoint,
            'Content-Length': Buffer.byteLength(body),
            'X-Amz-Security-Token': process.env.AWS_SESSION_TOKEN,
            'X-Amz-Date': datetime
        }
    };

    const canonicalHeaders = Object.keys(request.headers)
        .sort((a, b) => a.toLowerCase() < b.toLowerCase() ? -1 : 1)
        .map(k => k.toLowerCase() + ':' + request.headers[k])
        .join('\n');

    const signedHeaders = Object.keys(request.headers)
        .map(k => k.toLowerCase())
        .sort()
        .join(';');

    const canonicalString = [
        request.method,
        request.path, '',
        canonicalHeaders, '',
        signedHeaders,
        hash(request.body, 'hex'),
    ].join('\n');

    const credentialString = [date, region, service, 'aws4_request'].join('/');

    const stringToSign = [
        'AWS4-HMAC-SHA256',
        datetime,
        credentialString,
        hash(canonicalString, 'hex')
    ].join('\n');

    request.headers.Authorization = [
        'AWS4-HMAC-SHA256 Credential=' + process.env.AWS_ACCESS_KEY_ID + '/' + credentialString,
        'SignedHeaders=' + signedHeaders,
        'Signature=' + hmac(kSigning, stringToSign, 'hex')
    ].join(', ');

    return request;
}

function hmac(key, str, encoding) {
    return crypto
        .createHmac('sha256', key)
        .update(str, 'utf8')
        .digest(encoding);
}

function hash(str, encoding) {
    return crypto
        .createHash('sha256')
        .update(str, 'utf8')
        .digest(encoding);
}