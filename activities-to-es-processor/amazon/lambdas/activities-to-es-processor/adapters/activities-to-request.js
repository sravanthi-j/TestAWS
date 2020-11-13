const ActivityEvent = require('./events/ActivityEvent');
const ElasticSearchCrypto = require('./elasticsearch-crypto');

class Adapter {
  constructor(awsKey, awsToken, awsKeyId, endpoint, elasticSearchIndex, getDate = () => new Date()) {
    this.awsKey = awsKey;
    this.awsKeyId = awsKeyId;
    this.awsToken = awsToken;
    this.endpoint = endpoint;
    const endpointParts = endpoint.match(/^([^\.]+)\.?([^\.]*)\.?([^\.]*)\.amazonaws\.com$/);
    this.region = endpointParts[2];
    this.service = endpointParts[3];
    this.elasticSearchIndex = elasticSearchIndex;
    this.getDate = () => this.formatDate(getDate());
  }

  formatDate(date) {
    return date.toISOString().replace(/[:\-]|\.\d{3}/g, '');
  }

  buildRequest(datetime, activities) {
    const body = activities.map(a => a.toElasticSearchFormat(this.elasticSearchIndex)).join('');

    const request = {
        host: this.endpoint,
        method: 'POST',
        path: '/_bulk',
        body: body,
        headers: {
            'Content-Type': 'application/json',
            'Host': this.endpoint,
            'Content-Length': Buffer.byteLength(body),
            'X-Amz-Security-Token': this.awsToken,
            'X-Amz-Date': datetime
        }
    };

    return request;
  }

  buildAuthorizationHeader(datetime, method, path, body, headers) {
    const shortDate = datetime.substr(0, 8);
    const esCrypto = new ElasticSearchCrypto(this.awsKey, shortDate, this.region, this.service);
    const canonicalHeaders = Object.keys(headers)
        .sort((a, b) => a.toLowerCase() < b.toLowerCase() ? -1 : 1)
        .map(k => k.toLowerCase() + ':' + headers[k])
        .join('\n');

    const signedHeaders = Object.keys(headers)
        .map(k => k.toLowerCase())
        .sort()
        .join(';');

    const canonicalString = [
        method,
        path, '',
        canonicalHeaders, '',
        signedHeaders,
        esCrypto.hash(body, 'hex'),
    ].join('\n');

    const credentialString = [shortDate, this.region, this.service, 'aws4_request'].join('/');

    const stringToSign = [
        'AWS4-HMAC-SHA256',
        datetime,
        credentialString,
        esCrypto.hash(canonicalString, 'hex')
    ].join('\n');

    const result = [
        `AWS4-HMAC-SHA256 Credential=${this.awsKeyId}/${credentialString}`,
        `SignedHeaders=${signedHeaders}`,
        `Signature=${esCrypto.buildSignature(stringToSign)}`
    ].join(', ');

    return result;
  }

  process(activities) {
    const date = this.getDate();
    const request = this.buildRequest(date, activities);
    const authorizationHeader = this.buildAuthorizationHeader(date, request.method, request.path, request.body, request.headers);
    request.headers.Authorization = authorizationHeader;
    return request;
  }
}

 

module.exports.ActivitiesToRequestAdapter = Adapter;