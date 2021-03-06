import TokenSet from './token-set';
import Token from './token';
import { idToReference } from './reference-utils';
import { UdtParseError } from './errors';

function acceptAnyToken(token: any): token is Token {
  return token instanceof Token;
}

function tokenFromData(data: any) {
  return new Token(data);
}

describe('Core TokenSet functionality', () => {
  let tokenSet: TokenSet<Token>;

  beforeEach(() => {
    tokenSet = new TokenSet(acceptAnyToken, tokenFromData);
  });

  test('TokenSet is initially empty', () => {
    expect(tokenSet.size).toBe(0);
  });

  test('Adding something other than a token throws a TypeError', () => {
    expect(() => {
      tokenSet.add((42 as any) as Token);
    }).toThrow(TypeError);
  });

  test('Adding a token increments the size', () => {
    const initialSize = tokenSet.size;
    tokenSet.add(new Token({ id: 'test' }));
    expect(tokenSet.size).toBe(initialSize + 1);
  });

  test('Adding the same token multiple times only increments the size once', () => {
    const initialSize = tokenSet.size;
    const token = new Token({ id: 'test-2' });
    tokenSet.add(token);
    tokenSet.add(token);
    expect(tokenSet.size).toBe(initialSize + 1);
  });

  test('add() returns the token set', () => {
    const returnVal = tokenSet.add(new Token({ id: 'test-3' }));
    expect(returnVal).toBe(tokenSet);
  });

  test('Presence of a token in the set can be checked', () => {
    const token = new Token({ id: 'foo' });
    expect(tokenSet.has(token)).toBe(false);
    tokenSet.add(token);
    expect(tokenSet.has(token)).toBe(true);
  });

  test('Tokens can be deleted', () => {
    const token = new Token({ id: 'bar' });
    tokenSet.add(token);
    tokenSet.delete(token);
    expect(tokenSet.has(token)).toBe(false);
  });

  test('Deleting a token in the set returns true', () => {
    const token = new Token({ id: 'barfoo' });
    tokenSet.add(token);
    const returnVal = tokenSet.delete(token);
    expect(returnVal).toBe(true);
  });

  test('Deleting a token not in the set returns false', () => {
    const returnVal = tokenSet.delete(new Token({ id: 'barfoo' }));
    expect(returnVal).toBe(false);
  });

  test('Token set can be cleared', () => {
    tokenSet.add(new Token({ id: 'test-1' }));
    tokenSet.add(new Token({ id: 'test-2' }));
    tokenSet.clear();
    expect(tokenSet.size).toBe(0);
  });

  test('Tokens can be found by ref', () => {
    const tokenId = 'search-token';
    const token = new Token({ id: tokenId });
    tokenSet.add(token);
    expect(tokenSet.findTokenByRef(idToReference(tokenId))).toBe(token);
  });

  test('Searching for a token ref that does not exist returns null', () => {
    tokenSet.clear();
    tokenSet.add(new Token({ id: 'foobar' }));
    expect(tokenSet.findTokenByRef(idToReference('does-not-exist'))).toBeNull();
  });

  test('values() returns an iterable', () => {
    tokenSet.clear();

    const testTokens = [
      new Token({ id: 't1' }),
      new Token({ id: 't2' }),
      new Token({ id: 't3' }),
    ];

    for (const token of testTokens) {
      tokenSet.add(token);
    }

    const values = tokenSet.values();

    // Tokens should come out in the same
    // order that they were inserted.
    let i = 0;
    for (const token of values) {
      expect(token).toBe(testTokens[i]);
      i += 1;
    }

    expect(i).toBe(testTokens.length);
  });

  test('token set is iterable', () => {
    tokenSet.clear();

    const testTokens = [
      new Token({ id: 't1' }),
      new Token({ id: 't2' }),
      new Token({ id: 't3' }),
    ];

    for (const token of testTokens) {
      tokenSet.add(token);
    }

    // Now try iterating over the set.
    // Tokens should come out in the same
    // order that they were inserted.
    let i = 0;
    for (const token of tokenSet) {
      expect(token).toBe(testTokens[i]);
      i += 1;
    }

    expect(i).toBe(testTokens.length);
  });

  test('toJSON() on an empty token set returns an empty array', () => {
    tokenSet.clear();

    const jsonData = tokenSet.toJSON();
    expect(Array.isArray(jsonData)).toBe(true);
    expect(jsonData).toHaveLength(0);
  });

  test('toJSON() returns an array of tokens', () => {
    tokenSet.clear();

    const testTokens = [
      new Token({ id: 't1' }),
      new Token({ id: 't2' }),
      new Token({ id: 't3' }),
    ];

    for (const token of testTokens) {
      tokenSet.add(token);
    }

    const jsonData = tokenSet.toJSON();
    expect(Array.isArray(jsonData)).toBe(true);
    expect(jsonData).toHaveLength(testTokens.length);

    for (let i = 0; i < jsonData.length; i += 1) {
      expect(jsonData[i]).toBe(testTokens[i]);
    }
  });
});

describe('TokenSet with custom type checking', () => {
  class TestToken extends Token {}
  class OtherToken extends Token {}

  let tokenSet: TokenSet<TestToken>;

  function isTestToken(token: any): token is TestToken {
    return token instanceof TestToken;
  }

  function parseTestToken(data: any): TestToken {
    return new TestToken(data);
  }

  beforeEach(() => {
    tokenSet = new TokenSet(isTestToken, parseTestToken);
  });

  test('Adding a valid token works', () => {
    const token = new TestToken({ id: 'test' });
    tokenSet.add(token);
    expect(tokenSet.has(token)).toBe(true);
  });

  test('Adding an invalid token throws a TypeError', () => {
    expect(() => {
      tokenSet.add(new OtherToken({ id: 'fail' }));
    }).toThrow(TypeError);
  });
});

describe('Parsing token sets', () => {
  const goodSetData = [
    {
      id: 'token1',
    },
    {
      id: 'token2',
      description: 'foo bar',
    },
  ];

  const tokenParseMockFn = jest.fn();
  tokenParseMockFn.mockReturnValue(new Token({ id: 'foo' }));

  test('Parsing valid data works', () => {
    const tokenSet = new TokenSet(acceptAnyToken, tokenFromData, goodSetData);
    expect(tokenSet.size).toBe(goodSetData.length);
  });

  test('Parsing a non-array throws a UdtParseError', () => {
    expect(() => {
      new TokenSet(acceptAnyToken, tokenFromData, 'foo'); // eslint-disable-line no-new
    }).toThrow(UdtParseError);
  });

  test('Custom tokenFromDataFn get called when parsing', () => {
    new TokenSet(acceptAnyToken, tokenParseMockFn, goodSetData); // eslint-disable-line no-new
    expect(tokenParseMockFn.mock.calls.length).toBe(goodSetData.length);
  });
});
