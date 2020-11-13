const index = require('./es-forwarding');
const expect = require('expect');

describe('tryParseJson', () => {
  test('With valid Json, returns true and json', () => {
    const [isValid, payload] = index.tryParseJson('{"test": 1}');

    expect(isValid).toBeTruthy();
    expect(payload).toEqual({test: 1});
  });

  test('With invalid Json, returns false and error', () => {
    const [isValid, payload] = index.tryParseJson('Bad Json}');

    expect(isValid).toBeFalsy();
  });
});

describe('extractJson', () => {
  test('With valid Json, returns json', () => {
    const payload = index.extractJson('{"test": 1}');
    expect(payload).toEqual({test: 1});
  });

  test('With null Json, returns empty object', () => {
    const payload = index.extractJson(null);
    expect(payload).toEqual({});
  });

  test('With invalid Json, returns empty object', () => {
    const payload = index.extractJson('Bad Json}');
    expect(payload).toEqual({});
  });

  test('With malformed Json, returns empty object', () => {
    const payload = index.extractJson('{Test}}');
    expect(payload).toEqual({});
  });
  
  test('With non-string, returns empty object', () => {
    const payload = index.extractJson(true);
    expect(payload).toEqual({});
  });
});
 
describe('buildSource', () => {
  test('With null extractedFields, returns json from message', () => {
    const payload = index.buildSource('{"test": 1}', null);
    expect(payload).toEqual({test: 1});
  });

  describe('With extractedFields', () => {
    test('Ignores extractedFields with falsy values', () => {
      const payload = index.buildSource('{"test": 1}', { "foo":0, "bar":null, "baz":undefined });
      expect(payload).toEqual({});
    });

    test('Changes number strings to numbers', () => {
      const payload = index.buildSource('{"test": 1}', { "foo":"100" });
      expect(payload).toEqual({foo: 100});
    });

    test('For JSON strings, keeps value and adds object to $Key', () => {
      const payload = index.buildSource('{"test": 1}', { "foo":'{"test": 117}' });
      expect(payload).toEqual({foo:'{"test": 117}', $foo:{ test:117} });
    });

    test('For invalid JSON strings, keeps value', () => {
      const payload = index.buildSource('{"test": 1}', { "foo":'{"test": 117}}' });
      expect(payload).toEqual({foo:'{"test": 117}}'});
    });

    test('For non-integer, non-json, keeps value', () => {
      const payload = index.buildSource('{"test": 1}', { "foo":true });
      expect(payload).toEqual({foo:true});
    });
  });
});

test('Explore snapshot comparison', () => {
  const payload = {
    logEvents: [{
      message: '{"test": 1}',
      id:100,
      timestamp:200,
    },{
      message: '{"test": 1}',
      extractedFields: {
        foo:true,
        bar:false,
        baz:'215',
        boz:'{"testBoz": 1}'
      },
      id:1000,
      timestamp:1000,
    }],
    owner:'Alice',
    logGroup:'BobGroup',
    logStream:'CarolStream'
  };
  const result = index.transform(payload);
  expect(result).toMatchSnapshot();
});

test('buildRequest snapshot comparison', () => {
  const body = 'This is my placeholder body'
  const endpoint = 'part1.region.service.amazonaws\.com';
  const getDate = () => new Date('2019-12-17T03:24:00Z');

  const result = index.buildRequest(endpoint, body, getDate);
  expect(result).toMatchSnapshot();
});
