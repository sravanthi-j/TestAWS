const esHelper = require('./es-helper');
const fetch = require('node-fetch');
const fs = require('fs');

const ENV = process.env;
const config = JSON.parse(fs.readFileSync('config.json'));

config.runLocal  = ENV['runLocal'] || true;
config.ownerName  = ENV['ownerName'] || config.ownerName;
config.iosAppName = ENV['iosAppName'] || config.iosAppName;
config.iosToken  = ENV['iosToken'] || config.iosToken;
config.androidAppName  = ENV['androidAppName'] || config.androidAppName;
config.androidToken  = ENV['androidToken'] || config.androidToken;

const iosUrl = [config.baseUrl, '/', config.ownerName, '/', config.iosAppName, '/'].join('');
const iosHeaders = {
    'accept': 'application/json',
    'X-API-Token': config.iosToken
};

const androidUrl = [config.baseUrl, '/', config.ownerName, '/', config.androidAppName, '/'].join('');
const androidHeaders = {
    'accept': 'application/json',
    'X-API-Token': config.androidToken
};

exports.handler = async (event, context) => {

    console.log('Received event:', JSON.stringify(event, null, 2));

    try {
        // get the latest error from ES
        const indexExists = await esHelper.indexExists("dm-error-list");
        var latestError;
        if (indexExists.body) {
            latestError = await esHelper.getLatestError();
        }

        var filterDate;
        if (latestError) {
            var latest = latestError.body.hits.hits[0];
            filterDate = ["filter=timestamp%20gt%20", latest._source.timestamp, "%20and%20timestamp%20lt%20", new Date().toISOString(), "&order=desc&sort=timestamp"].join('');
        } else {
            var startdate = new Date();
            startdate.setDate(startdate.getDate() - 30);
            filterDate = ["filter=timestamp%20gt%20", startdate.toISOString(), "%20and%20timestamp%20lt%20", new Date().toISOString(), "&order=desc&sort=timestamp"].join('');
        }


        
        // get error data from App Center for android
        var url = [androidUrl, "errors/search?",filterDate.replace(/\:/g,'%3A')].join('')
        var options = {
            'method': 'GET',
            'url': url,
            'headers': androidHeaders,
        };
        const resp = await fetch(url, options)
        const resp_data = await resp.json()

        console.log(resp_data);
        console.log(resp_data.errors);
        console.log(resp_data.errors.length);
        
        
        console.log("AppCenter android error count: " + resp_data.errors.length);

        // bulk index app center android errors
        const bulkResp = await esHelper.bulkIndexErrors(resp_data.errors, "android");

        console.log("bulk android insert count: " + bulkResp.body.items.length);




        // get error data from App Center for ios
        var url = [iosUrl, "errors/search?",filterDate.replace(/\:/g,'%3A')].join('')
        var options = {
            'method': 'GET',
            'url': url,
            'headers': iosHeaders,
        };
        const respIos = await fetch(url, options)
        const respIos_data = await respIos.json()

        console.log("AppCenter ios error count: " + respIos_data.errors.length);

        // bulk index app center ios errors
        const bulkRespIos = await esHelper.bulkIndexErrors(respIos_data.errors, "ios");

        console.log("bulk ios insert count: " + bulkRespIos.body.items.length);
        

    } catch (e) {
        console.error(e)
    }

};


