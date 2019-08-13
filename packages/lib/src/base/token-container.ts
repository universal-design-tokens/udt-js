import NodeWithChildren, { ChildKey } from './node-with-children';
import UdtNode from './node';
import Token from './token';
import TokenType from './token-type';
import { UdtModelIntegrityError } from './errors';
import { TokenContainerData } from './schema';

/**
 * Common base-class for token map, token array and
 * UDT file.
 *
 * Implements functionality that is common to all, but
 * not used by tokens.
 */
export default abstract class TokenContainer<K extends ChildKey = ChildKey>
  extends UdtNode
  implements NodeWithChildren<UdtNode, K>, Iterable<UdtNode>
{
  #ownType: TokenType | undefined;

  constructor({
    type,
    description,
    ...rest
  }: TokenContainerData) {
    super(rest);
    this.type = type;
  }

  public get type(): TokenType | undefined {
    // Defining a setter in this class seems to
    // prevent the inherited getter from being
    // called, so we need to define our own getter
    // and call the parent class's one explicitly.
    return super.type;
  }

  public set type(newType: TokenType | undefined) {
    this.#ownType = newType;
  }

  public *traverseTokens(recursive = true): Generator<Token> {
    for (const childNode of this) {
      if (recursive && childNode instanceof TokenContainer) {
        yield* childNode.traverseTokens();
      }
      else if (childNode instanceof Token) {
        yield childNode;
      }
    }
  }

  public *findTokens(searchDetails: {
    name?: string;
    type?: TokenType;
  }, recursive = true): Generator<Token> {
    const { name, type } = searchDetails;

    for (const token of this.traverseTokens(recursive)){
      if (
        Object.keys(searchDetails).length > 0 &&
        (name === undefined || token.name === name) &&
        (type === undefined || token.type === type)
      ) {
        // Found matching token
        yield token;
      }
    }
  };

  static *getAllIdsFrom(node: UdtNode): Generator<string> {
    if (node instanceof Token) {
      if (node.id !== undefined) {
        yield node.id;
      }
    }
    else if (node instanceof TokenContainer) {
      yield* node.getAllIds();
    }
  }

  /**
   * Returns IDs (if any) of all child tokens, or this node it is
   * a token.
   */
  public *getAllIds(): Generator<string> {
    for (const child of this) {
      yield* TokenContainer.getAllIdsFrom(child);
    }
  }

  public getTokenById(id: string): Token | undefined {
    for (const token of this.traverseTokens()) {
      if (token.id === id) {
        return token;
      }
    }
  }

  public hasTokenWithId(id: string): boolean {
    return this.getTokenById(id) !== undefined;
  }

  public abstract keyFor(childNode: UdtNode): K | undefined;

  public abstract getChild(key: K): UdtNode | undefined;

  public abstract get length(): number;

  /**
   * Performs the steps required to set a node as a child
   * of this one.
   *
   * If a key is given, the child will be set using that key.
   * If another child already exists with the same key, it will
   * be removed first.
   *
   * If no key is given, the new child will be appended and a
   * suitable key will be auto-generated.
   *
   * The actual adding (e.g. adding to a map or similar) or
   * appending is deferred to `_doAppendOrSetChild()`, which
   * should be implemented by sub-classes.
   *
   * If the node already has another parent, it will be
   * removed from that parent first and then added as a
   * child of this node.
   *
   * If this node is already the parent of the given node,
   * then nothing happens.
   *
   * @param childNode   The node to add or append as a child of
   *                    this one.
   * @param key         The key used to identify child node.
   */
  protected _appendOrSetChild(child: UdtNode, key?: K): K {
    if (child instanceof TokenContainer && child._isFile()) {
      throw new UdtModelIntegrityError(`A UDT file cannot be a child of another UDT node.`);
    }

    const previousParent = child.getParent();
    if (previousParent === this) {
      throw new RangeError(`Node "${child.name}" is already a child of "${this.name}.`);
    }

    if (key !== undefined && !this._isValidKeyForSetting(key)) {
      throw new RangeError(`The key "${key}" is not in range / valid for setting a child on this container.`);
    }

    const childHadOwnName = child.hasOwnName();

    // Check that adding this child won't cause duplicate names within this
    // container
    if (this.hasName(child.name)) {
      throw new UdtModelIntegrityError(`Cannot add "${child.name}" as a child of "${this.name}", as its name is a duplicate of another node in this container`);
    }

    // Ensure that adding this child won't cause duplicate IDs
    if (this._hasDuplicateIds(child)) {
      throw new UdtModelIntegrityError(`Cannot add "${child.name}" as a child of "${this.name}", as it contains IDs already present in this container`);
    }

    if (previousParent !== undefined) {
      // Child has an existing parent (which could even be
      // this node). Need to remove it from that first.
      const previousKey = previousParent.keyFor(child);
      if (previousKey === undefined) {
        throw new UdtModelIntegrityError(`"${child.name}"'s parent, "${previousParent.name}, does not know about it.`);
      }
      previousParent.removeChild(previousKey);
    }

    // Are we replacing an existing child?
    let oldChild: UdtNode | undefined;
    if (key !== undefined && (oldChild = this.getChild(key)) !== undefined) {
      UdtNode._clearParent(oldChild);
    }

    // Do the actual setting/appending to ourselves
    const ourKey = this._doAppendOrSetChild(child, key);

    // Set ourselves as child's parent
    UdtNode._assignParent(child, this);


    // If we removed child from a previous parent, it may
    // have had an own name set. If so, clear it again now
    // that it has us as a new parent.
    if (!childHadOwnName) {
      child.clearOwnName();
    }

    return ourKey;
  }


  public removeChild(key: K): UdtNode | undefined {
    const removedChild = this._doRemoveChild(key);
    if (removedChild !== undefined) {
      UdtNode._clearParent(removedChild);
    }
    return removedChild;
  }


  /**
   * Removes the node as a child of this one.
   *
   * Parent node types should use this method to remove the given
   * node from their children using whatever internal mechanism
   * (array, Set, etc.) they want.
   *
   * @param key
   */
  protected abstract _doRemoveChild(key: K): UdtNode | undefined;

  protected abstract _doAppendOrSetChild(child: UdtNode, key?: K): K;


  public setChild(key: K, child: UdtNode): void {
    this._appendOrSetChild(child, key);
  }

  public appendChild(child: UdtNode): K {
    return this._appendOrSetChild(child);
  }

  protected abstract _isFile(): boolean;

  /**
   * Checks if it is safe to append or set the given child.
   *
   *
   * Container nodes cannot have multiple tokens or containers that
   * share the same name (although they can have one of each), so this
   * method should detect scenarios like that.
   *
   * @param child
   */
  private _hasDuplicateIds(child: UdtNode): boolean {
    // Check that adding this child will not lead to duplicate IDs
    // within this file
    const root = this.getRoot();

    for (const childId of TokenContainer.getAllIdsFrom(child)) {
      if (root.hasTokenWithId(childId)) {
        return true;
      }
    }

    return false;
  }

  public hasName(name: string): boolean {
    for (const existingName of this.names()) {
      if (existingName === name) {
        return true;
      }
    }
    return false;
  }

  protected _getOwnType(): TokenType | undefined {
    return this.#ownType;
  }


  public abstract generateAvailableKey(): K;

  /**
   * Checks if the given key can be used to set a
   * new child node.
   *
   * @param key
   */
  protected abstract _isValidKeyForSetting(key: K): boolean;

  /**
   * Iterates over the keys this container has for its child nodes.
   */
  public abstract keys(): Iterator<K>;

  /**
   * Iterates over the names of this container's child nodes.
   */
  public *names(): Generator<string> {
    for (const child of this) {
      yield child.name;
    }
  }

  public abstract [Symbol.iterator](): Iterator<UdtNode>;
}
