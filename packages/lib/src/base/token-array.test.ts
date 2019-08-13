import TokenArray from './token-array';
import UdtNode from './node';
import { UdtParseError } from './errors';
import TokenType from './token-type';
import MockNode from './test/mock-node';


describe('Empty TokenArray', () => {
  let testArray: TokenArray;

  beforeEach(() => {
    testArray = new TokenArray({ name: 'test array', tokens: [] });
  });

  test('is empty', () => {
    expect(testArray.length).toBe(0);
  });

  test('getChild() returns undefined for unknown key', () => {
    expect(testArray.getChild(99)).toBeUndefined();
  });

  test('keyFor() returns undefined for unknown child node', () => {
    expect(testArray.keyFor(new MockNode({name: 'child'}))).toBeUndefined();
  });

  test('setting a new child node increases the count by one', () => {
    const testKey = 0;
    const testChild = new MockNode({name: 'child node'});
    testArray.setChild(testKey, testChild);
    expect(testArray.length).toBe(1);
  });

  test('is not a file', () => {
    expect((testArray as any)._isFile()).toBe(false);
  });

  test('setting a new child with an invalid key throws a RangeError', () => {
    const testChild = new MockNode({name: 'child node'});
    expect(() => {
      testArray.setChild(-1, testChild);
    }).toThrow(RangeError);
  });

  test('a new child node can be set using an existing key', () => {
    const testChild = new MockNode({name: 'child node'});
    const testKey = testArray.appendChild(testChild);

    const testChild2 = new MockNode({name: 'child node 2'});
    testArray.setChild(testKey, testChild2);

    expect(testArray.length).toBe(1);
    expect(testChild2.getParent()).toBe(testArray);
    expect(testChild.hasParent()).toBe(false);
  });
});


describe('TokenArray with one child node', () => {
  const testKey = 0;
  let testChild: UdtNode;
  let testArray: TokenArray;

  beforeEach(() => {
    testChild = new MockNode({name: 'child node'});
    testArray = new TokenArray({ name: 'test array', tokens: [] });
    testArray.setChild(testKey, testChild);
  });

  test('child node can be retrieved', () => {
    expect(testArray.getChild(testKey)).toBe(testChild);
  });

  test('child node\'s key can be found', () => {
    expect(testArray.keyFor(testChild)).toBe(testKey);
  });

  test('token map is child node\'s parent', () => {
    expect(testChild.getParent()).toBe(testArray);
  });

  test('removing child by key works', () => {
    testArray.removeChild(testKey);
    expect(testArray.length).toBe(0);
  });

  test('removed child has no parent', () => {
    testArray.removeChild(testKey);
    expect(testChild.hasParent()).toBe(false);
  });

  test('removing unknown child does nothing', () =>{
    testArray.removeChild(99);
    expect(testArray.length).toBe(1);
  });

  test('keyFor() returns undefined for unknown child node', () => {
    expect(testArray.keyFor(new MockNode({name: 'child'}))).toBeUndefined();
  });
});


describe('TokenArray with several child nodes', () => {
  const testKeys = [
    0,
    1,
    2,
    3,
  ];
  let testChildren: UdtNode[];
  let testArray: TokenArray;

  beforeEach(() => {
    testArray = new TokenArray({ name: 'test array', tokens: [] });
    testChildren = [];
    testKeys.forEach((name) => {
      const testChild = new MockNode({name: `${name}-node`});
      testArray.setChild(name, testChild);
      testChildren.push(testChild);
    });
  });

  test('length getter matches number of children added', () => {
    expect(testArray.length).toBe(testChildren.length);
  });

  test('iterating over keys() works', () => {
    let count = 0;
    for(let key of testArray.keys()) {
      expect(testKeys).toContain(key);
      count++;
    }
    expect(count).toBe(testKeys.length);
  });

  test('iterating over TokenArray works', () => {
    let count = 0;
    for(let child of testArray) {
      expect(testChildren).toContain(child);
      count++;
    }
    expect(count).toBe(testChildren.length);
  });

  test('iterating over keys() works', () => {
    let count = 0;
    for(let key of testArray.keys()) {
      expect(testKeys).toContain(key);
      count++;
    }
    expect(count).toBe(testArray.length);
  });
});


describe('Constructing TokenArray from data', () => {
  const testName = 'test array';
  let testArray: TokenArray;

  test("Object with tokens array containing valid children data works", () => {
    const testArrayData = [[], [], []]; // 3 nested TokenArrays!

    testArray = new TokenArray({
      name: testName,
      tokens: testArrayData
    });

    expect(testArray.length).toBe(testArrayData.length);
  });

  test("Type is extracted correctly", () => {
    const testType = TokenType.Color;
    testArray = new TokenArray({
      name: testName,
      tokens: [],
      type: testType,
    });

    expect(testArray.type).toBe(testType);
  });

  test("Object without tokens array throws UdtParseError", () => {
    expect(() => {
      new TokenArray({
        name: testName
      } as any);
    }).toThrowError(UdtParseError);
  });

  test("Object with non-array tokens property throws UdtParseError", () => {
    expect(() => {
      new TokenArray({
        name: testName,
        tokens: false
      } as any);
    }).toThrowError(UdtParseError);
  });

  test("Non-object or array throws UdtParseError", () => {
    expect(() => {
      new TokenArray(42 as any);
    }).toThrowError(UdtParseError);
  });
});
