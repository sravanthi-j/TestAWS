const expect = require('expect');
const Adapter = require('./sqs-to-activities').SqsToActivitiesAdapter;
const InvalidMesssageEvent = require('./events/InvalidMessageEvent');
const PingEvent = require('./events/PingEvent');
const ActivityEvent = require('./events/ActivityEvent');

function getActivityMessage(id, timestamp, additionalFields) {
  const baseMessage = {
    id: id,
    Timestamp: timestamp
  };

  const message = { ...additionalFields, ...baseMessage };

  const body = {
    Message: JSON.stringify(message),
    Arr: [{AProperty:2},4]
  };

  return { body: JSON.stringify(body) };
}


test('When event is invalid, process returns InvalidMessage', () => {
  const event = {};
  const adapter = new Adapter();
  const result = adapter.process(event);

  expect(result).toHaveLength(1);
  expect(result[0]).toBeInstanceOf(InvalidMesssageEvent);
});

describe('When event contains a ping message, process returns PingEvent', () => {
  function getPingMessage(pingTime) {
    const message = {
      Type: 'ping',
      Timestamp: pingTime
    };
    const body = {
      Message: JSON.stringify(message),
    };

    return { body: JSON.stringify(body) };
  }

  test('With only ping message', () => {
    const pingTime = new Date();
    const event = {
      Records: [getPingMessage(pingTime)]
    };
    const result = new Adapter().process(event);

    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(PingEvent);
    expect(result[0].timestamp).toEqual(pingTime);
  });

  test('With ping message and other messages', () => {
    const emptyMessage = JSON.stringify({});
    const pingTime = new Date();
    const event = {
      Records: [getActivityMessage('1', pingTime), getPingMessage(pingTime), getActivityMessage('3', pingTime)]
    };
    const result = new Adapter().process(event);

    expect(result).toHaveLength(3);
    const pingEvents = result.filter(r => r instanceof PingEvent);
    expect(pingEvents).toHaveLength(1);
    expect(pingEvents[0].timestamp).toEqual(pingTime);
  });

});

describe('When event contains a ping message, process returns PingEvent', () => {
  test('With one activity message', () => {
    const messageTime = new Date();
    const expectedId = 'myId'
    const event = {
      Records: [getActivityMessage(expectedId, messageTime)]
    };
    const result = new Adapter().process(event);

    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(ActivityEvent);
  });

  test('With multiple activity message', () => {
    const messageTime = new Date();
    const expectedIds = [0, 1].map(idBase => `Id{idBase}`);
    const records = expectedIds.map(id => getActivityMessage(id, messageTime));
    const event = {
      Records: records
    };
    const result = new Adapter().process(event);

    expect(result).toHaveLength(expectedIds.length);
    const actualIds = result.map(r => r.id);
    expect(actualIds).toEqual(expectedIds);
  });
 
});
