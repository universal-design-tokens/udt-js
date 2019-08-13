import UdtNode, { ParentNode } from '../node';
import { UdtNodeConstructionData } from '../schema';
import TokenType from '../token-type';

export default class MockNode extends UdtNode {
  #ownType?: TokenType;

  public getOwnTypeMockFn = jest.fn();

  constructor(
    data: UdtNodeConstructionData,
    type?: TokenType
  ) {
    super(data);
    this.#ownType = type;
  }

  public setOwnType(ownType: TokenType) {
    this.#ownType = ownType;
  }

  protected _getOwnType() {
    return this.getOwnTypeMockFn.mockReturnValueOnce(this.#ownType)();
  }

  //
  public static assignParent(child: UdtNode, parent: ParentNode) {
    UdtNode._assignParent(child, parent);
  }

  public static clearParent(child: UdtNode) {
    UdtNode._clearParent(child);
  }
}


