import MockNode from './mock-node';
import NodeWithChildren from '../node-with-children';
import UdtNode from '../node';

export default class MockParentNode extends MockNode implements NodeWithChildren<UdtNode, string> {
  #childNode?: UdtNode;
  #childNodeKey?: string;

  public getKeyForMockFn = jest.fn();
  public appendOrSetChildMockFn = jest.fn();
  public removeChildMockFn = jest.fn();

  public nextAppendOrSetChildError?: Error;
  public nextRemoveChildError?: Error;

  static APPENDED_CHILD_KEY = 'auto-generated-key';


  appendOrSetChild(child: UdtNode, key?: string): string {
    this.appendOrSetChildMockFn(child, key);
    if (this.nextAppendOrSetChildError !== undefined) {
      const errorToThrow = this.nextAppendOrSetChildError;
      this.nextAppendOrSetChildError = undefined;
      throw errorToThrow;
    }

    UdtNode._assignParent(child, this);
    this.#childNode = child;
    this.#childNodeKey = key || MockParentNode.APPENDED_CHILD_KEY;
    return this.#childNodeKey;
  }

  public getChild() {
    return this.#childNode;
  }

  public removeChild(key: string): UdtNode {
    this.removeChildMockFn(key);
    if (this.nextRemoveChildError !== undefined) {
      const errorToThrow = this.nextRemoveChildError;
      this.nextRemoveChildError = undefined;
      throw errorToThrow;
    }

    const oldChild = this.#childNode!;
    UdtNode._clearParent(oldChild);
    this.#childNode = undefined;
    this.#childNodeKey = undefined;
    return oldChild;
  }

  public keyFor(childNode: UdtNode): string | undefined {
    this.getKeyForMockFn(childNode);
    return this.#childNodeKey;
  }

  public hasTokenWithId() {
    return false;
  }

  public getTokenById(id: string): UdtNode | undefined {
    return undefined;
  }
}
