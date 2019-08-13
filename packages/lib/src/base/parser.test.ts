import { parseAndAppendNode } from './parser';
import TokenArray from './token-array';

import MockContainer from './test/mock-container';
import UdtNode from './node';

describe('parser utils', () => {
  const parentsKey = 'parents-key';
  let parent: MockContainer;

  beforeEach(() => {
    parent = new MockContainer({name: 'parent'});
  });

  test('parsing an array value produces a TokenArray', () => {
    const tokenArray: UdtNode = parseAndAppendNode([], parent, parentsKey);
    expect(tokenArray).toBeInstanceOf(TokenArray);
    expect(tokenArray.getParent()).toBe(parent);
    expect(parent.doAppendOrSetChildMockFn).toHaveBeenCalledWith(tokenArray, parentsKey);
  });

  test('parsing an object with a tokens property produces a TokenArray', () => {
    const tokenArray: UdtNode = parseAndAppendNode({
      tokens: [],
    }, parent, parentsKey);
    expect(tokenArray).toBeInstanceOf(TokenArray);
    expect(tokenArray.getParent()).toBe(parent);
    expect(parent.doAppendOrSetChildMockFn).toHaveBeenCalledWith(tokenArray, parentsKey);
  });
});
