import TokenContainer from './token-container';
import TokenType from './token-type';
import { UdtModelIntegrityError } from './errors';
import MockContainer from './test/mock-container';
import MockNode from './test/mock-node';
import MockToken from './test/mock-token';

describe('Core TokenContainer functionality', () => {
  let testContainer: TokenContainer<string>;
  const testType = TokenType.Number;

  beforeEach(() => {
    testContainer = new MockContainer();
  });

  test('can have a type set', () => {
    testContainer.type = testType;
    expect(testContainer.type).toBe(testType);
  });

  test('can have undefined type set', () => {
    testContainer.type = undefined;
    expect(testContainer.type).toBeUndefined();
  });

  test('Setting a child calls _doAppendOrSetChild()', () => {
    const testKey = 'foo';
    const testChild = new MockNode({name: 'son of a...'});
    testContainer.setChild(testKey, testChild);
    expect((testContainer as MockContainer).doAppendOrSetChildMockFn).toHaveBeenCalledWith(testChild, testKey);
  });

  test('Appending a child calls _doAppendOrSetChild() and returns the new key', () => {
    const testChild = new MockNode({name: 'son of a...'});
    const newKey = testContainer.appendChild(testChild);
    expect((testContainer as MockContainer).doAppendOrSetChildMockFn).toHaveBeenCalledWith(testChild, undefined);
    expect(newKey).not.toBeUndefined();
  });

  test('Appending a child increases the length', () => {
    const initialLength = testContainer.length;

    const testChild = new MockNode({name: 'son of a...'});
    testContainer.appendChild(testChild);

    expect(testContainer.length).toBe(initialLength + 1);
  });

  test('Appending two nodes with the same name throws a UdtModelIntegrityError', () => {
    const testName = 'dupe';
    const childNode = new MockNode({name: testName});
    testContainer.appendChild(childNode);
    const childNode2 = new MockNode({name: testName});

    expect(() => {
      testContainer.appendChild(childNode2);
    }).toThrowError(UdtModelIntegrityError);
  });

  test('Re-setting an existing child node throws a RangeError', () => {
    const testChild = new MockNode({name: 'son of a...'});
    testContainer.appendChild(testChild);

    expect(() => {
      testContainer.setChild('new-key', testChild);
    }).toThrow(RangeError);
  });

  test('Setting a child node using an invalid key throws a RangeError', () => {
    const testChild = new MockNode({name: 'son of a...'});

    expect(() => {
      testContainer.setChild(MockContainer.INVALID_KEY, testChild);
    }).toThrow(RangeError);
  });

  test('Removing a child calls _doRemoveChild()', () => {
    const testKey = 'foo';
    const testChild = new MockNode({name: 'son of a...'});
    testContainer.setChild(testKey, testChild);
    testContainer.removeChild(testKey);
    expect((testContainer as MockContainer).doRemoveChildMockFn).toHaveBeenCalledWith(testKey);
  });

  test('Removing a non-existent child also calls _doRemoveChild()', () => {
    testContainer.removeChild('unknown');
    expect((testContainer as MockContainer).doRemoveChildMockFn).toHaveBeenCalled();
  });

  test('Appending a file throws a UdtModelIntegrityError', () => {
    const testFile = new MockContainer({name: 'mock file'}, true);
    expect(() => {
      testContainer.appendChild(testFile);
    }).toThrowError(UdtModelIntegrityError);
  });

  test('Setting a file throws a UdtModelIntegrityError', () => {
    const testFile = new MockContainer({name: 'mock file'}, true);
    expect(() => {
      testContainer.setChild('file', testFile);
    }).toThrowError(UdtModelIntegrityError);
  });

  test('Appending a token with a duplicate ID throws a UdtModelIntegrityError', () => {
    const token1 = new MockToken({name: 'token 1', value: 123, id: 'token-id'});
    const token2 = new MockToken({name: 'token 2', value: 123, id: 'token-id'});
    testContainer.appendChild(token1);
    expect(() => {
      testContainer.appendChild(token2);
    }).toThrowError(UdtModelIntegrityError);
  });

  test('Setting a token with a duplicate ID throws a UdtModelIntegrityError', () => {
    const token1 = new MockToken({name: 'token 1', value: 123, id: 'token-id'});
    const token2 = new MockToken({name: 'token 2', value: 123, id: 'token-id'});
    testContainer.appendChild(token1);
    expect(() => {
      testContainer.setChild('foo', token2);
    }).toThrowError(UdtModelIntegrityError);
  });

  test('Appending a container with a token that has a duplicate ID throws a UdtModelIntegrityError', () => {
    const token1 = new MockToken({name: 'token 1', value: 123, id: 'token-id'});
    testContainer.appendChild(token1);

    const otherContainer = new MockContainer({name: 'other'});
    const token2 = new MockToken({name: 'token 2', value: 123, id: 'token-id'});
    otherContainer.appendChild(token2);

    expect(() => {
      testContainer.appendChild(otherContainer);
    }).toThrowError(UdtModelIntegrityError);
  });

  test('Appending a node that had a different parent, removes it from that parent', () => {
    const originalParent = new MockContainer({name: 'original parent'});
    const child = new MockNode({name: 'child'});
    originalParent.appendChild(child);

    const newParent = new MockContainer({name: 'new parent'});
    newParent.appendChild(child);

    expect(originalParent.doRemoveChildMockFn).toHaveBeenCalled();
    expect(child.getParent()).toBe(newParent);
  });

  test('A node with no own name, still has no own name after being transferred between parents', () => {
    const originalParent = new MockContainer({name: 'original parent'});
    const child = new MockNode({name: 'temp'});
    originalParent.appendChild(child);
    child.clearOwnName();

    const newParent = new MockContainer({name: 'new parent'});
    newParent.appendChild(child);

    expect(child.hasOwnName()).toBe(false);
  });

  test('Attempting to append a node whose parent doesn\'t know about it throws a UdtModelIntegrityError', () => {
    const originalParent = new MockContainer({name: 'original parent'});
    const child = new MockNode({name: 'child'});
    // Incorrectly assign parent to child, without the
    // parent knowing about it.
    MockNode.assignParent(child, originalParent);

    const newParent = new MockContainer({name: 'new parent'});

    expect(() => {
      newParent.appendChild(child);
    }).toThrow(UdtModelIntegrityError);
  });

  test('The key of a child node can be retrieved', () => {
    const child = new MockNode({name: 'test node'});
    const testKey = 'foo';

    testContainer.setChild(testKey, child);
    expect(testContainer.keyFor(child)).toBe(testKey);
  });

  test('Retrieving the key of a non-child returns undefined', () => {
    const child = new MockNode({name: 'test node'});

    expect(testContainer.keyFor(child)).toBeUndefined();
  });

  test('Searching for non-existent token yields no results', () => {
    expect([...testContainer.findTokens({ name: 'does-not-exist'})].length).toBe(0);
  });

  test('Searching with empty search parameters yields no results', () => {
    testContainer.appendChild(new MockToken({name: 'test token', value: 'dummyValue'}))
    expect([...testContainer.findTokens({})].length).toBe(0);
  });

  test('token can be found by name', () => {
    const tokenName = 'fancy token';
    const token = new MockToken({name: tokenName, value: 'dummyValue'});
    testContainer.appendChild(token);

    const searchResults = [...testContainer.findTokens({ name: tokenName })];
    expect(searchResults.length).toBe(1);
    expect(searchResults).toContain(token);
  });

  test('tokens can be found by type', () => {
    const testType = TokenType.Boolean;
    const token1 = new MockToken({name: 'token 1', value: 'dummyValue'}, testType);
    const token2 = new MockToken({name: 'token 2', value: 'dummyValue'}, TokenType.Number);
    const token3 = new MockToken({name: 'token 3', value: 'dummyValue'}, testType);
    testContainer.appendChild(token1);
    testContainer.appendChild(token2);
    testContainer.appendChild(token3);

    const searchResults = [...testContainer.findTokens({ type: testType })];
    expect(searchResults.length).toBe(2);
    expect(searchResults).toContain(token1);
    expect(searchResults).toContain(token3);
  });

  test('token can be found by name and type', () => {
    const testName = 'find me';
    const testType = TokenType.Boolean;
    const token1 = new MockToken({name: 'token 1', value: 'dummyValue'}, testType);
    const token2 = new MockToken({name: 'token 2', value: 'dummyValue'}, TokenType.Number);
    const token3 = new MockToken({name: testName, value: 'dummyValue'}, testType);
    testContainer.appendChild(token1);
    testContainer.appendChild(token2);
    testContainer.appendChild(token3);

    const searchResults = [...testContainer.findTokens({ type: testType, name: testName })];
    expect(searchResults.length).toBe(1);
    expect(searchResults).toContain(token3);
  });

  test('searching for non-existant token by ID returns undefined', () => {
    expect(testContainer.getTokenById('does-not-exist')).toBeUndefined();
  });

  test('token can be found by ID', () => {
    const testId = 'test-token';
    const testToken = new MockToken({id: testId, name: 'token 1', value: 'dummyValue'}, TokenType.String);
    testContainer.appendChild(testToken);

    expect(testContainer.getTokenById(testId)).toBe(testToken);
  });

  test('checking for non-existant token by ID works', () => {
    expect(testContainer.hasTokenWithId('does-not-exist')).toBe(false);
  });

  test('checking for existing token by ID works', () => {
    const testId = 'test-token';
    const testToken = new MockToken({id: testId, name: 'token 1', value: 'dummyValue'}, TokenType.String);
    testContainer.appendChild(testToken);

    expect(testContainer.hasTokenWithId(testId)).toBe(true);
  });

  test('getAllIds() yields nothing if no child tokens have IDs', () => {
    const results = [...testContainer.getAllIds()];
    expect(results.length).toBe(0);
  });

  test('getAllIds() yields all child tokens\' IDs', () => {
    const testId1 = 'test-token-1';
    const testId2 = 'test-token-2';
    testContainer.appendChild(new MockToken(
      {id: testId1, name: 'token 1', value: 'dummyValue'},
      TokenType.String
    ));
    testContainer.appendChild(new MockToken(
      {id: testId2, name: 'token 2', value: 'dummyValue'},
      TokenType.String
    ));

    const results = [...testContainer.getAllIds()];
    expect(results.length).toBe(2);
    expect(results).toContain(testId1);
    expect(results).toContain(testId2);
  });

  test('keys can be iterated over', () => {
    const keys = [];
    keys.push(testContainer.appendChild(new MockNode({name: 'child1'})));

    const keyIterator = testContainer.keys();

    expect(keyIterator.next().value).toBe(keys[0]);
  });
});

describe('static getAllIdsFrom() function', () => {
  test('yields IDs from tokens', () => {
    const testId = 'foobar';
    const testToken = new MockToken({
      id: testId,
      name: 'Hello',
      value: 'dummy value'
    });

    const results = [...TokenContainer.getAllIdsFrom(testToken)];
    expect(results.length).toBe(1);
    expect(results).toContain(testId);
  });

  test('yields IDs from tokens nested in containers', () => {
    const testContainer = new MockContainer({name: 'test container'});

    const testId1 = 'foobar';
    const testToken1 = new MockToken({
      id: testId1,
      name: 'Hello',
      value: 'dummy value'
    });
    testContainer.appendChild(testToken1);

    const testId2 = 'barfoo';
    const testToken2 = new MockToken({
      id: testId2,
      name: 'Goodbye',
      value: 'dummy value'
    });
    testContainer.appendChild(testToken2);

    const results = [...TokenContainer.getAllIdsFrom(testContainer)];
    expect(results.length).toBe(2);
    expect(results).toContain(testId1);
    expect(results).toContain(testId2);
  });
});

describe('Recursive searches of TokenContainer', () => {
  const testId = 'test-id';
  const testId2 = 'test-id-2';
  const testId3 = 'test-id-3';
  let testMap: TokenContainer;
  let colorTokens: MockToken[];
  let allTokens: MockToken[];
  const deepTokenName = 'deep';
  let deepContainer: TokenContainer;
  let deepToken: MockToken;

  beforeEach(() => {
    testMap = new MockContainer({name: 'top'});
    colorTokens = [];

    // Add some color tokens to the top-level map
    const t1 = new MockToken({name: 'red', value: 'dummyValue', id: testId2}, TokenType.Color);
    testMap.appendChild(t1);
    colorTokens.push(t1);

    const t2 = new MockToken({name: 'blue', value: 'dummyValue'}, TokenType.Color);
    testMap.appendChild(t2);
    colorTokens.push(t2);

    // Add a nested container (using a name as a token)
    const nestedContainer = new MockContainer({name: 'more-reds'});
    testMap.appendChild(nestedContainer);

    // Add more color tokens, but this time to nested container
    const t3 = new MockToken({name: 'tint-50', value: 'dummyValue'}, TokenType.Color);
    nestedContainer.appendChild(t3);
    colorTokens.push(t3);

    const t4 = new MockToken({name: 'shade-50', value: 'dummyValue', id: testId3}, TokenType.Color);
    nestedContainer.appendChild(t4);
    colorTokens.push(t4);

    deepContainer = new MockContainer({name: 'nested'});
    nestedContainer.appendChild(deepContainer);

    deepToken = new MockToken({name: deepTokenName, value: 'dummyValue', id: testId}, TokenType.String);
    deepContainer.appendChild(deepToken);

    allTokens = [...colorTokens, deepToken];
  });

  test('tokens can be traversed non-recursively', () => {
    const immediateChildTokens = Array.from(testMap.traverseTokens(false));
    expect(immediateChildTokens.length).toBe(2);
  });

  test('tokens can be traversed recursively', () => {
    const allChildTokens = Array.from(testMap.traverseTokens());
    expect(allChildTokens.length).toBe(allTokens.length);
  });

  test('tokens of same type can be found recursively', () => {
    const searchResults = [...testMap.findTokens({type: TokenType.Color}, true)];
    expect(searchResults.length).toBe(colorTokens.length);
  });

  test('without the recursive option, only the top level container is searched', () => {
    const searchResults = [...testMap.findTokens({type: TokenType.Color}, false)];
    expect(searchResults.length).toBe(2);
  });

  test('tokens can be found recursively by name', () => {
    const searchResults = [...testMap.findTokens({name: deepTokenName}, true)];
    expect(searchResults.length).toBe(1);
    expect(searchResults[0]).toBe(deepToken);
  });

  test('recursively searching for non-existant token by ID returns undefined', () => {
    expect(testMap.getTokenById('does-not-exist')).toBeUndefined();
  });


  test('token can be found by ID recursively', () => {
    expect(testMap.getTokenById(testId)).toBe(deepToken);
  });

  test('recursively checking for non-existant token by ID works', () => {
    expect(testMap.hasTokenWithId('does-not-exist')).toBe(false);
  });

  test('recursively checking for existing token by ID works', () => {
    expect(testMap.hasTokenWithId(testId)).toBe(true);
  });

  test('getAllIds() yields all child tokens\' IDs', () => {
    const results = [...testMap.getAllIds()];
    expect(results.length).toBe(3);
    expect(results).toContain(testId);
    expect(results).toContain(testId2);
    expect(results).toContain(testId3);
  });

  test('appending a token with a duplicate ID throws a UdtModelIntegrityError', () => {
    const testToken = new MockToken({name: 'token', value: 123, id: testId2});
    expect(() => {
      deepContainer.appendChild(testToken);
    }).toThrowError(UdtModelIntegrityError);
  });
});
