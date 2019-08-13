import NodeWithChildren, { ChildKey } from './node-with-children';

export default interface NodeWithParent {
  getParent(): NodeWithParent & NodeWithChildren<NodeWithParent, ChildKey> | undefined;
}
