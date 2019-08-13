import TokenMap from './token-map';
import UdtNode from './node';
import MockNode from './test/mock-node';
import TokenType from './token-type';
import { UdtParseError } from './errors';
import MockToken from './test/mock-token';

const digitSuffixRegex = /\d+$/;

function getNumericSuffix(name: string): number {
  const digitSuffixMatches = name.match(digitSuffixRegex);
  if (digitSuffixMatches !== null) {
    return parseInt(digitSuffixMatches[0]);
  }
  return -1;
}

describe('Empty TokenMap', () => {
  let testMap: TokenMap;

  beforeEach(() => {
    testMap = new TokenMap({name: 'test map'});
  });

  test('is empty', () => {
    expect(testMap.length).toBe(0);
  });

  test('has() returns false for unknown key', () => {
    expect(testMap.has('unknown')).toBe(false);
  });

  test('getChild() returns undefined for unknown key', () => {
    expect(testMap.getChild('unknown')).toBeUndefined();
  });

  test('keyFor() returns undefined for unknown child node', () => {
    expect(testMap.keyFor(new MockNode({name: 'child'}))).toBeUndefined();
  });

  test('setting a new child node increases the count by one', () => {
    const testKey = 'child';
    const testChild = new MockNode({name: 'child node'});
    testMap.setChild(testKey, testChild);
    expect(testMap.length).toBe(1);
  });

  test('is not a file', () => {
    expect((testMap as any)._isFile()).toBe(false);
  });

  test('generateAvailableKey() creates valid keys', () => {
    const generatedKey = testMap.generateAvailableKey();
    const testChild = new MockNode({name: 'child node'});

    expect(() => {
      testMap.setChild(generatedKey, testChild);
    }).not.toThrow();
  });
});


describe('TokenMap with one child node', () => {
  const testKey = 'child';
  let testChild: UdtNode;
  let testMap: TokenMap;

  beforeEach(() => {
    testChild = new MockNode({name: 'child node'});
    testMap = new TokenMap({name: 'test map'});
    testMap.setChild(testKey, testChild);
  });

  test('child node can be retrieved', () => {
    expect(testMap.getChild(testKey)).toBe(testChild);
  });

  test('has() returns true for known key', () => {
    expect(testMap.has(testKey)).toBe(true);
  });

  test('child node\'s key can be found', () => {
    expect(testMap.keyFor(testChild)).toBe(testKey);
  });

  test('token map is child node\'s parent', () => {
    expect(testChild.getParent()).toBe(testMap);
  });

  test('removing child by key works', () => {
    testMap.removeChild(testKey);
    expect(testMap.length).toBe(0);
  });

  test('removed child has no parent', () => {
    testMap.removeChild(testKey);
    expect(testChild.hasParent()).toBe(false);
  });

  test('removing unknown child does nothing', () =>{
    testMap.removeChild('unknown');
    expect(testMap.length).toBe(1);
  });

  test('keyFor() returns undefined for unknown child node', () => {
    expect(testMap.keyFor(new MockNode({name: 'child'}))).toBeUndefined();
  });

  test('appending child whose name matches existing key, generates new key by appending digit', () => {
    const dupeName = 'child';

    const firstChild = new MockNode({name: 'first child'});
    testMap.setChild(dupeName, firstChild);

    const secondChild = new MockNode({name: dupeName});
    const secondChildKey = testMap.appendChild(secondChild);

    expect(secondChildKey).not.toBe(secondChild.name);
    expect(getNumericSuffix(secondChildKey as any)).not.toBe(-1);
  });
});


describe('Token Map with several child nodes', () => {
  const testKeys = [
    'child-0',
    'child-1',
    'child-2',
    'child-3',
  ];
  let testChildren: UdtNode[];
  let testMap: TokenMap;

  beforeEach(() => {
    testMap = new TokenMap({name: 'test map'});
    testChildren = [];
    testKeys.forEach((name) => {
      const testChild = new MockNode({name: `${name}-node`});
      testMap.setChild(name, testChild);
      testChildren.push(testChild);
    });
  });

  test('length getter matches number of children added', () => {
    expect(testMap.length).toBe(testChildren.length);
  });

  test('iterating over keys() works', () => {
    let count = 0;
    for(let key of testMap.keys()) {
      expect(testKeys).toContain(key);
      count++;
    }
    expect(count).toBe(testKeys.length);
  });

  test('iterating over TokenMap works', () => {
    let count = 0;
    for(let child of testMap) {
      expect(testChildren).toContain(child);
      count++;
    }
    expect(count).toBe(testChildren.length);
  });

  test('iterating over keys() works', () => {
    let count = 0;
    for(let key of testMap.keys()) {
      expect(testKeys).toContain(key);
      count++;
    }
    expect(count).toBe(testMap.length);
  });

  test('appending a child whose name matches an existing key, auto-generates a new key by incrementing the numeric suffix', () => {
    const dupeName = testKeys[0];
    const newChild = new MockToken({name: dupeName, value: 'dummy value'});
    const childKey = testMap.appendChild(newChild);

    expect(childKey).not.toBeUndefined();

    expect(getNumericSuffix(childKey as any)).toBeDefined();
    expect(childKey).not.toBe(dupeName);
    expect(getNumericSuffix(childKey as any)).toBeGreaterThan(getNumericSuffix(dupeName));
  });
});


describe('Constructing TokenMap from data', () => {
  const testNameProp = { name: 'test-map' };
  let testMap: TokenMap;

  test("Object with no tokens works", () => {
    testMap = new TokenMap(testNameProp);

    expect(testMap.length).toBe(0);
  });

  test("Object containing valid children data works", () => {
    const testData = {foo: {}, bar: {}, baz: {}}; // 3 nested TokenMaps!

    testMap = new TokenMap({...testNameProp, ...testData});

    expect(testMap.length).toBe(Object.keys(testData).length);
  });

  test("Name is extracted correctly", () => {
    testMap = new TokenMap(testNameProp);

    expect(testMap.name).toBe(testNameProp.name);
    expect(testMap.hasOwnName()).toBe(true);
  });

  test("Type is extracted correctly", () => {
    const testType = TokenType.Color;
    testMap = new TokenMap({
      ...testNameProp,
      type: testType,
    });

    expect(testMap.type).toBe(testType);
  });

  test("Array throws UdtParseError", () => {
    expect(() => {
      new TokenMap([] as any);
    }).toThrowError(UdtParseError);
  });

  test("Non-object throws UdtParseError", () => {
    expect(() => {
      new TokenMap(42 as any);
    }).toThrowError(UdtParseError);
  });
});
