export type ChildKey = string | number;

export default interface NodeWithChildren<T, K extends ChildKey> {
  /**
   * Performs the steps required to remove a child node
   * of this one.
   *
   * The actual removing (e.g. deleting to set or similar) is
   * deferred to `_doRemoveChild()`, which should be implemented
   * by sub-classes.
   *
   * If this node is not the parent of the given node,
   * then nothing happens.
   *
   * @param childNode
   */
  removeChild(key: K): T | undefined;

  /**
   * Retrieves this node's key for its given child.
   *
   * Parent nodes must maintain their own, internal keys for each of
   * their children. This name may differ from the child token's own
   * name (if it has one).
   *
   * If the given node is not a child of this node, a `UdtModelIntegrityError`
   * should be thrown.
   *
   * Token node types should simply thrown a `UdtNotSupportedError`
   * to indicate that they do not support having child nodes.
   *
   * @param childNode   The child node whose name should be returned.
   */
  keyFor(child: T): K | undefined;

  hasTokenWithId(id: string): boolean;

  getTokenById(id: string): T | undefined;
}
