const crypto = require('crypto');

class EsCrypto {
  constructor(awsKey, date, region, service) {
    this.kDate = this.hmac('AWS4' + awsKey, date.toString());
    this.kRegion = this.hmac(this.kDate, region);
    this.kService = this.hmac(this.kRegion, service);
    this.signing = this.hmac(this.kService, 'aws4_request');
  }

  buildSignature(rawSignature) {
    return this.hmac(this.signing, rawSignature, 'hex')
  }

  hmac(key, str, encoding) {
    return crypto
        .createHmac('sha256', key)
        .update(str, 'utf8')
        .digest(encoding);
  }

  hash(str, encoding) {
    return crypto
        .createHash('sha256')
        .update(str, 'utf8')
        .digest(encoding);
  }
}

function buildCrypto(awsKey, date, region, service) {
  return new EsCrypto(awsKey, date, region, service);
}

module.exports = buildCrypto;