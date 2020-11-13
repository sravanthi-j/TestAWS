class ActivityEvent {
  constructor(id, timestamp, message) {
    this.id = id;
    this.timestamp = new Date(timestamp);
    this.message = message;
  }

  toElasticSearchFormat(index) {
    const action = {
      index: {
        "_index": index,
        "_id": this.id
      }
    };
    const source = {
      "@id": this.id,
      "@timestamp": this.timestamp.toISOString() ,
      "@message": this.message
    }
    return JSON.stringify(action) + '\n' + JSON.stringify(source) + '\n';
  }
}

module.exports = ActivityEvent;