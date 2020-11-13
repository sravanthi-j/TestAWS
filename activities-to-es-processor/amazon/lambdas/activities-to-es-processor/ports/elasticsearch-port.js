const https = require('https');
  
/**
 * Represents a port that calls ES with a given request object
 */
class ElasticsearchPort
{
    /**
     * @param httpClient optional http client object
     */
    constructor(httpClient){

        this.https = httpClient || https;
    }

    /**
     * Accepts a request and performs the call to Elasticsearch
     * 
     * @param requestParams The request
     */
     post(requestParams) {
        return new Promise((resolve, reject)=> {
            const request = this.https.request(requestParams, response => {
                let responseBody = '';
                response.on('data', chunk => responseBody += chunk);
                response.on('end', () => {
                    const info = JSON.parse(responseBody);
        
                    if (response.statusCode >= 200 && response.statusCode < 299) {
                        const failedItems = info.items.filter(x => x.index.status >= 300);
        
                        const success = {
                            attemptedItems: info.items.length,
                            successfulItems: info.items.length - failedItems.length,
                            failedItems: failedItems.length
                        };
                        resolve(success);
    
                    } else {
                        const error = new Error(`Received ${response.statusCode} error message from the server`);
                        error.statusCode = response.statusCode;
                        error.responseBody = responseBody;
                        reject(new Error(error));
                    }
                 });
            }).on('error', e => {
                reject(e);
            });
            request.end(requestParams.body);
        });
    }
}

module.exports.ElasticsearchPort = ElasticsearchPort;