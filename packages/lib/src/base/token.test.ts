import Token from './token';
import { ESCAPE_CHAR, escapeStringValue } from './reference-utils';
import { UdtParseError, UdtModelIntegrityError } from './errors';

import MockToken from './test/mock-token';
import MockParentNode from './test/mock-parent-node';
import MockContainer from './test/mock-container';

const tokenId = 'testId';
const tokenName = 'test token #1';
const testValue = 42;

describe('Core Token properties', () => {
  let token: Token;

  beforeEach(() => {
    token = new MockToken({ name: tokenName, value: testValue });
  });

  test('token\'s ID can be set', () => {
    token.id = tokenId;
    expect(token.id).toBe(tokenId);
  });

  test('token\'s ID can be cleared', () => {
    token.id = tokenId;
    token.id = undefined;
    expect(token.id).toBeUndefined();
  });

  test('resetting token\'s ID works', () => {
    // This test is to check a code branch that
    // skips validation when the new ID is the
    // same as the existing one.
    token.id = tokenId;
    token.id = tokenId;
    expect(token.id).toBe(tokenId);
  });

  test('creating token without a name throws a UdtParseError', () => {
    expect(() => new MockToken({} as any)).toThrow(UdtParseError);
  });

  test('creating token with no args throws a TypeError', () => {
    expect(() => new MockToken(undefined as any)).toThrow(TypeError);
  });

  test('setting a non-string ID throws a TypeError', () => {
    expect(() => {
      token.id = 42 as any;
    }).toThrow(TypeError);
  });

  test('setting an empty string ID throws a TypeError', () => {
    expect(() => {
      token.id = '';
    }).toThrow(TypeError);
  });

  test('setting an invalid ID throws a TypeError', () => {
    const invalidIds = [
      'id with spaces',
      // '1-id-starting-with-number',
      'id*with.invalid=chars',
      1337,
      false,
      null,
    ];

    invalidIds.forEach((invalidId) => {
      expect(() => {
        token.id  = invalidId as any;
      }).toThrow(TypeError);
    });
  });

  test('setting a duplicate ID throws a UdtModelIntegrityError error', () => {
    const container = new MockContainer({name: 'test container'});
    const otherToken = new MockToken({name: 'other', value: 123});

    container.appendChild(token);
    container.appendChild(otherToken);

    token.id = tokenId;
    expect(() => {
      otherToken.id = tokenId;
    }).toThrow(UdtModelIntegrityError);
  });

  test('getting the referenced token for an unknown property throws a RangeError', () => {
    expect(() => {
      token.getReferencedToken('unknown');
    }).toThrow(RangeError);
  });
});


describe('Token description', () => {
  const tokenDescription = 'test description';
  const token2name = 'the second test token';
  const token2value = 666;

  let token: Token;
  let token2: Token;

  beforeEach(() => {
    token = new MockToken({ name: tokenName, value: testValue, id: tokenId });
    token2 = new MockToken({ name: token2name, value: token2value });
  });

  test('token\'s description is accessible', () => {
    token.description = tokenDescription;
    expect(token.description).toBe(tokenDescription);
  });

  test('token\'s description is not a referenced value', () => {
    token.description = tokenDescription;
    expect(token.isReferencedValue('description')).toBe(false);
  });

  test('token\'s description\'s referenced token is undefined', () => {
    token.description = tokenDescription;
    expect(token.getReferencedToken('description')).toBeUndefined();
  });

  test('token\'s description can be cleared by setting it to undefined', () => {
    token.description = undefined;
    expect(token.description).toBeUndefined();
  });

  test('setting a non-string description throws a TypeError', () => {
    expect(() => {
      token.description = 42 as any;
    }).toThrow(TypeError);
  });

  test('setting another token as a reference when there is no parewnt throws a UdtModelIntegrityError', () => {
    token.description = tokenDescription;

    expect(() => {
      token2.description = token;
    }).toThrow(UdtModelIntegrityError);
  });

  test('setting another token as the description references that token\'s description', () => {
    const container = new MockContainer({name: 'test container'});
    container.appendChild(token);
    container.appendChild(token2);

    token.description = tokenDescription;
    token2.description = token;
    expect(token2.description).toBe(tokenDescription);
  });

  test('referenced value is identified as such', () => {
    const container = new MockContainer({name: 'test container'});
    container.appendChild(token);
    container.appendChild(token2);

    token.description = tokenDescription;
    token2.description = token;
    expect(token2.isReferencedValue('description')).toBe(true);
  });

  test('getting referenced value\'s token', () => {
    const container = new MockContainer({name: 'test container'});
    container.appendChild(token);
    container.appendChild(token2);

    token.description = tokenDescription;
    token2.description = token;
    expect(token2.getReferencedToken('description')).toBe(token);
  });

  test('getting referenced token when non has been set returns undefined', () => {
    token.description = tokenDescription;
    expect(token.getReferencedToken('description')).toBeUndefined();
  });

  test('setting self as referenced token throws an Error', () => {
    expect(() => {
      token.description = token;
    }).toThrow(Error);
  });

  test('setting cyclical token references throws an Error', () => {
    const container = new MockContainer({name: 'test container'});
    container.appendChild(token);
    container.appendChild(token2);

    token.description = tokenDescription;
    token2.description = token;
    expect(() => {
      token.description = token2;
    }).toThrow(Error);
  });
});


describe('JSON serialisation', () => {
  const tokenDescription = 'test description';
  const token2id = 'token2';
  const token2name = 'the second test token';
  const token2value = 666;

  let token: Token;
  let token2: Token;

  beforeEach(() => {
    token = new MockToken({ name: tokenName, value: testValue });
    token2 = new MockToken({ name: token2name, value: token2value, id: token2id });
  });

  test('name is output by toJSON()', () => {
    const jsonObj = token.toJSON();
    expect(jsonObj.name).toBe(tokenName);
  });

  test('name is ommitted by toJSON(), if no own name is set', () => {
    // Need to give token a parent in order to remove its name
    const parent = new MockParentNode({name: 'test parent'});
    parent.appendOrSetChild(token, 'parent-name-for-token');
    token.clearOwnName();

    const jsonObj = token.toJSON();
    expect(jsonObj).not.toHaveProperty('name');
  });

  test('description is output by toJSON()', () => {
    token.description = tokenDescription;
    const jsonObj = token.toJSON();
    expect(jsonObj.description).toBe(tokenDescription);
  });

  test('description starting with escape char is correctly escaped by toJSON()', () => {
    const testDescription = `${ESCAPE_CHAR}${tokenDescription}`;
    token.description = testDescription;
    const jsonObj = token.toJSON();
    expect(jsonObj.description).toBe(escapeStringValue(testDescription));
  });

  test('description is ommitted by toJSON() if it was not set', () => {
    const jsonObj = token.toJSON();
    expect(jsonObj).not.toHaveProperty('description');
  });

  test('token reference is output toJSON() if description references another token', () => {
    const parent = new MockContainer({name: 'parent'});
    parent.appendChild(token);
    parent.appendChild(token2);
    const token2Description = 'another description';
    token2.description = token2Description;
    token.description = token2;
    const jsonObj = token.toJSON();
    expect(jsonObj.description).toBe(token2.toReference());
  });
});


describe('Constructing from data', () => {
  const goodObj = {
    id: 'testId',
    name: 'testName',
    value: 111,
    description: 'testDescription',
  };

  const badObj = {
    name: 'validName',
    value: 'validValue',
    foo: 42,
  };

  const badNoNameObj = {
    value: 'validValue',
    foo: 42,
  };

  test('constructing valid data works', () => {
    const t = new MockToken(goodObj);
    expect(t.id).toBe(goodObj.id);
    expect(t.name).toBe(goodObj.name);
    expect(t.description).toBe(goodObj.description);
  });

  test('data with invalid property throws UdtParseError', () => {
    expect(() => {
      new MockToken(badObj); // eslint-disable-line no-new
    }).toThrow(UdtParseError);
  });

  test('data with no name throws UdtParseError', () => {
    expect(() => {
      new MockToken(badNoNameObj as any); // eslint-disable-line no-new
    }).toThrow(UdtParseError);
  });

  test('array data throws UdtParseError', () => {
    expect(() => {
      new MockToken([] as any); // eslint-disable-line no-new
    }).toThrow(UdtParseError);
  });

  test('string data throws UdtParseError', () => {
    expect(() => {
      new MockToken('test' as any); // eslint-disable-line no-new
    }).toThrow(UdtParseError);
  });
});
