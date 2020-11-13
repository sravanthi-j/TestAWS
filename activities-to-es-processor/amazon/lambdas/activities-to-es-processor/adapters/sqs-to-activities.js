const InvalidMessageEvent = require('./events/InvalidMessageEvent');
const PingEvent = require('./events/PingEvent');
const keysToCamelCase = require('./json-to-camel-case');
const ActivityEvent = require('./events/ActivityEvent');

class Adapter {
  isValidEvent(event) {
    return event && event.Records && event.Records.length > 0
  }

  extractDate(message) {

    if(message.timestamp instanceof Date)
      return message.timestamp;
    if(message.timestamp)
      return new Date(message.timestamp);
    if(message.attributes && message.attributes.sentTimestamp)
       return new Date(message.attributes.sentTimestamp)

    return Date.now();
  }

  toEvent(message) {
    if(message.type === 'ping') {
      return new PingEvent(message.timestamp);
    }

    return new ActivityEvent(message.id, this.extractDate(message), message)
  }

  process(event) {
    if(!this.isValidEvent(event)) 
      return [new InvalidMessageEvent()];

    const events = event.Records
      .map(r => keysToCamelCase(r.body))
      .map(b => keysToCamelCase(b.message))
      .map(this.toEvent, this);

    return events;
  }
}

module.exports.SqsToActivitiesAdapter = Adapter;
