import UdtNode from './node';
import TokenType from './token-type';
import { UdtParseError, UdtModelIntegrityError } from './errors';
import MockNode from './test/mock-node';
import MockParentNode from './test/mock-parent-node';

const testName = 'test node';

describe('Node constructor', () => {
  test('with valid name works', () => {
    const testNode = new MockNode({ name: testName });
    expect(testNode.name).toBe(testName);
  });

  test('with empty data throws UdtParseError', () => {
    expect(() => {
      new MockNode({});
    }).toThrowError(UdtParseError);
  });

  test('with invalid data properties throws UdtParseError', () => {
    expect(() => {
      new MockNode({
        name: testName,
        invalid: 42
      } as any);
    }).toThrowError(UdtParseError);
  });

  test('with array throws UdtParseError', () => {
    expect(() => {
      new MockNode([] as any);
    }).toThrowError(UdtParseError);
  });

  test('with non-object throws UdtParseError', () => {
    expect(() => {
      new MockNode(42 as any);
    }).toThrowError(UdtParseError);
  });
});

describe('Node with name, no type and no parent', () => {
  let testNode: UdtNode;

  beforeEach(() => {
    testNode = new MockNode({ name: testName });
  });

  test('type getter returns undefined', () => {
    expect(testNode.type).toBeUndefined();
  });

  test('reading type calls _getOwnType()', () => {
    testNode.type;
    expect((testNode as MockNode).getOwnTypeMockFn).toBeCalled();
  });

  test('type setter fails', () => {
    const newType = TokenType.Color;
    expect(() => {(testNode as any).type = newType;}).toThrow(TypeError);
  });

  test('type getter returns node\'s own type, if one exists', () => {
    const testType = TokenType.Color;
    (testNode as MockNode).setOwnType(testType);
    expect(testNode.type).toBe(testType);
  });

  test('getTopParent() returns undefined', () => {
    expect(testNode.getTopParent()).toBeUndefined();
  });

  test('getRoot() returns self', () => {
    expect(testNode.getRoot()).toBe(testNode);
  });

  test('hasParent() returns false', () => {
    expect(testNode.hasParent()).toBe(false);
  });

  test('getPath() returns array containing only node\'s name', () => {
    expect(testNode.getPath()).toEqual([testName]);
  });

  test('hasOwnName() return true', () => {
    expect(testNode.hasOwnName()).toBe(true);
  });

  test('name getter works', () => {
    expect(testNode.name).toBe(testName);
  });

  test('name setter works', () => {
    const otherName = 'foobar';
    testNode.name = otherName;
    expect(testNode.name).toBe(otherName);
  });

  test('name setter throws TypeError when setting empty string', () => {
    expect(() => {testNode.name = '';}).toThrow(TypeError);
  });

  test('name setter throws TypeError when setting non-string value', () => {
    expect(() => {(testNode as any).name = 666;}).toThrow(TypeError);
  });

  test('clearOwnName() throws UdtModelIntegrityError on node with no parent', () => {
    expect(() => {testNode.clearOwnName();}).toThrow(UdtModelIntegrityError);
  });
});

describe('Setting / clearing parent for sub-classes', () => {
  const parentName = 'parent';
  let testNode: UdtNode;
  let parentNode: MockParentNode;

  beforeEach(() => {
    parentNode = new MockParentNode({name: parentName});
    testNode = new MockNode({name: testName});
  });

  test('_assignParent() works', () => {
    MockNode.assignParent(testNode, parentNode);
    expect(testNode.getParent()).toBe(parentNode);
  });

  test('_clearParent() works', () => {
    MockNode.assignParent(testNode, parentNode);
    MockNode.clearParent(testNode);
    expect(testNode.hasParent()).toBe(false);
  });
});

describe('Node with a single parent', () => {
  const parentName = 'parent';
  const parentsNameForTestNode = `${testName}-of-parent`;
  let testNode: UdtNode;
  let parentNode: MockParentNode;

  beforeEach(() => {
    parentNode = new MockParentNode({name: parentName});
    testNode = new MockNode({name: testName});
    parentNode.appendOrSetChild(testNode, parentsNameForTestNode);
  });

  test('getTopParent() returns parent', () => {
    expect(testNode.getTopParent()).toBe(parentNode);
  });

  test('getRoot() returns parent', () => {
    expect(testNode.getRoot()).toBe(parentNode);
  });

  test('hasParent() returns true', () => {
    expect(testNode.hasParent()).toBe(true);
  });

  test('getParent() returns parent', () => {
    expect(testNode.getParent()).toBe(parentNode);
  });

  test('getPath() returns array containing parents\' and node\'s names', () => {
    expect(testNode.getPath()).toEqual([parentName, testName]);
  });

  test('child node\'s own name can be cleared', () => {
    testNode.clearOwnName();
    expect(testNode.hasOwnName()).toBe(false);
  });

  test('child without own name, returns name given by parent', () => {
    testNode.clearOwnName();
    expect(testNode.name).toBe(parentsNameForTestNode);
  });

  test('when child returns name given by parent, parent\'s getKeyFor() is called', () => {
    testNode.clearOwnName();
    testNode.name;
    expect(parentNode.getKeyForMockFn).toHaveBeenCalledWith(testNode);
  });

  test('child with no own type inherits type from parent', () => {
    const parentType = TokenType.Number;
    parentNode.setOwnType(parentType);
    expect(testNode.type).toBe(parentType);
  });

  test('child\'s type take precedence over parent\'s type', () => {
    const childType = TokenType.Number;
    parentNode.setOwnType(TokenType.Color);
    (testNode as MockNode).setOwnType(childType);
    expect(testNode.type).toBe(childType);
  });

  test('name getter throws UdtModelIntegrityError if name and parent are unset', () => {
    testNode.clearOwnName();
    // Never do this in real life!
    MockNode.clearParent(testNode);

    expect(() => {
      testNode.name;
    }).toThrow(UdtModelIntegrityError);
  });
});
