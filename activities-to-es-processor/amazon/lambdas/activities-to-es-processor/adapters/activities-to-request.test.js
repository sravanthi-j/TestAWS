const expect = require('expect');
const Adapter = require('./activities-to-request').ActivitiesToRequestAdapter;
const ActivityEvent = require('./events/ActivityEvent');
const crypto = require('crypto');

function buildAdapter(getDate) {
  const awsKey = 'fakeKey';
  const awsKeyId = 'fakeKeyId';
  const awsToken = 'fakeToken';
  const endpoint = 'fake1.fakeRegion.fakeService.amazonaws.com';
  const elasticSearchIndex = 'fakeIndex';
  return new Adapter(awsKey, awsToken, awsKeyId, endpoint, elasticSearchIndex, getDate);
}
 

test('buildRequest changes array of Activities into an elastic search request message', () => {
  const getDate = () => new Date('2019-12-17T03:24:00Z');

  const events = [
    new ActivityEvent('123', new Date('2019-12-18T03:24:00Z'), 'Message 1'),
    new ActivityEvent('123', new Date('2019-12-19T03:24:00Z'), 'Message 2'),
  ];
  const adapter = buildAdapter(getDate);
  const result = adapter.buildRequest(getDate().toISOString().replace(/[:\-]|\.\d{3}/g, ''), events);

  expect(result).toMatchSnapshot();
});
 
test('buildAuthorizationHeader hashes and signs the request information for the authorization header', () => {
  const getDate = () => new Date('2019-12-17T03:24:00Z');
  const datetime = getDate().toISOString().replace(/[:\-]|\.\d{3}/g, '');

  const headers = {
    'Content-Type': 'application/json',
    'Host': 'fakeEndpoint',
    'Content-Length': 123,
    'X-Amz-Security-Token': 'fakeToken',
  };

  const adapter = buildAdapter(getDate);
  const result = adapter.buildAuthorizationHeader(datetime, 'POST', '/bulk', 'test body', headers);

  expect(result).toMatchSnapshot();
});

test('process builds the request and adds the authorization header', () => {
  const getDate = () => new Date('2019-12-17T03:24:00Z');

  const events = [
    new ActivityEvent('123', new Date('2019-12-18T03:24:00Z'), 'Message 1'),
    new ActivityEvent('123', new Date('2019-12-19T03:24:00Z'), 'Message 2'),
  ];
  const adapter = buildAdapter(getDate);
  const result = adapter.process(events);

  expect(result).toMatchSnapshot();
});