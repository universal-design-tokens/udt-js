import NodeWithChildren, { ChildKey } from './node-with-children';
import NodeWithParent from './node-with-parent';
import TokenType from './token-type';
import { UdtNodeConstructionData } from './schema';
import { UdtParseError, UdtModelIntegrityError } from './errors';

/**
 * Checks if the input is a string that value and therefore a valid name.
 *
 * @param name The name to check.
 */
function isValidName(name: any): name is string {
  return (typeof name === 'string') && (name.length > 0);
}

export { ChildKey };

export type ParentNode<K extends ChildKey = ChildKey> = UdtNode & NodeWithChildren<UdtNode, K>;

/**
 * Base-class for all nodes in the UDT data model.
 *
 * Implements the common properties shared by tokens
 * sets, arrays and files.
 */
export default abstract class UdtNode implements NodeWithParent {
  /**
   * This node's parent, if any.
   */
  #parent?: ParentNode;

  /**
   * This node's own name, if any.
   */
  #ownName?: string;


  constructor(data: UdtNodeConstructionData) {
    if(Array.isArray(data) || typeof data !== 'object') {
      throw new UdtParseError(`Object expected, but received ${typeof data}`);
    }

    const {
      name,
      ...rest
    } = data;

    if (name === undefined) {
      throw new UdtParseError('Cannot construct a node without a name.');
    }

    if (Object.keys(rest).length > 0) {
      throw new UdtParseError(`Cannot construct node with invalid properties (${Object.keys(rest).join(', ')}).`);
    }

    this.name = name;
  }

  /**
   * Returns the (possibly inferred) type of this node.
   *
   * If a node does not have an explicitly set type of
   * its own (i.e. a `type` property in the UDT file),
   * then it inherits the default type from its parent.
   */
  public get type(): TokenType | undefined {
    const ownType = this._getOwnType();
    if (ownType === undefined) {
      if (this.#parent !== undefined) {
        return this.#parent.type;
      }
      return undefined;
    }
    return ownType;
  }

  /**
   * Returns the type explicitly set on this node, if any.
   */
  protected abstract _getOwnType(): TokenType | undefined;

  /**
   * Returns the (possibly inferred) name of this node.
   *
   * If the node does not have an explicitly set own name, then
   * it queries its parent for one. A node must therefore have
   * a parent if its has no own name set.
   *
   * If for some reason this is not the case, a `UdtModelIntegrityError`
   * will be thrown.
   */
  get name(): string {
    if (this.#ownName !== undefined) {
      return this.#ownName;
    }
    else if (this.#parent !== undefined) {
      // #parentNode MUST have a
      // key for this child, so this is safe
      return this.#parent.keyFor(this)!.toString();
    }
    throw new UdtModelIntegrityError('Node has neither name nor parent');
  }

  /**
   * Sets this node's own name.
   *
   * If you try to set an empty string or non-string value, a
   * `TypeError` will be thrown.
   */
  set name(name: string) {
    if (!isValidName(name)) {
      throw new TypeError(`"${name}" is not a valid node name.`);
    }
    this.#ownName = name;
  }

  /**
   * Checks if this node has its own name.
   */
  public hasOwnName(): boolean {
    return this.#ownName !== undefined;
  }

  /**
   * Clear this node's own name.
   *
   * If you try to clear a name on a node with no parent, a
   * `UdtModelIntegrityError` will be thrown.
   */
  public clearOwnName() {
    if (this.#parent === undefined) {
      throw new UdtModelIntegrityError('Cannot clear own name of node that has no parent');
    }
    this.#ownName = undefined;
  }

  /**
   * Retrieves this node's parent, if any.
   */
  public getParent(): ParentNode | undefined {
    return this.#parent;
  }

  /**
   * Retrieves this node's uppermost parent, if any.
   */
  public getTopParent(): ParentNode | undefined {
    let parent = this.getParent();
    if (parent === undefined) {
      return undefined;
    }
    else {
      let previousParent: ParentNode = parent;
      while (parent !== undefined) {
        previousParent = parent;
        parent = parent.getParent();
      }
      return previousParent;
    }

  }

  /**
   * Retrieves this node's uppermost parent or itself,
   * if there is no parent.
   *
   * If this node has no parents it is its own root
   * and will be returned.
   */
  public getRoot(): this | ParentNode {
    const topParent = this.getTopParent();
    if (topParent === undefined) {
      return this;
    }
    return topParent;
  }

  /**
   * Checks if this node has a parent.
   */
  public hasParent(): boolean {
    return this.#parent !== undefined;
  }

  /**
   * Returns an array of node names from the root
   * down to this node.
   */
  public getPath(): string[] {
    const parentNode = this.getParent();
    const name = this.name;

    if (parentNode === undefined) {
      return [name];
    }
    else {
      const parentPath = parentNode.getPath();
      parentPath.push(name);
      return parentPath;
    }
  }

  // =========================================

  protected static _assignParent(child: UdtNode, parent: ParentNode) {
    child.#parent = parent;
  }

  protected static _clearParent(child: UdtNode) {
    child.#parent = undefined;
  }

}
