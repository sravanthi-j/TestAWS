const expect = require('expect');
const ActivityEvent = require('./ActivityEvent');

test('When event is populated, can create ES message', () => {
  const id = "MyId";
  const timestamp = new Date('2019-12-17T03:24:00Z');
  const index = "MyIndex"; //TODO this probably comes from config

  const event = new ActivityEvent(id, timestamp, { id: id, timestamp: timestamp, foo: 1});
  const result = event.toElasticSearchFormat(index);

  expect(result).toMatchSnapshot();
});