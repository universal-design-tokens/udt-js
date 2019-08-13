import UdtNode, { ChildKey } from './node';
import TokenArray from './token-array';
import { UdtParseError } from './errors';
import ColorToken from '../tokens/color-token';
import TokenMap from './token-map';
import TokenContainer from './token-container';


function generateTempName(parent: TokenContainer, parentsKey?: ChildKey): string {
  return parentsKey === undefined ? parent.generateAvailableKey().toString() : parentsKey.toString();
}

/**
 * Identifies what kind of UdtNode the given JSON data represents
 * and creates an instance of the corresponding class, which is
 * appended as a child to the given parent node.
 *
 * If the given data does not appear to be any valid UdtNode, a
 * `UdtParseError` will be thrown.
 *
 * @param jsonData
 * @param name
 */
export function parseAndAppendNode<PK extends ChildKey>(jsonData: any, parent: TokenContainer<PK>, parentsKey?: PK): UdtNode {
  let node: UdtNode;
  let tmpName: string | undefined;

  if (Array.isArray(jsonData)) {
    // Looks like a TokenArray...
    tmpName = generateTempName(parent, parentsKey);
    node = new TokenArray({name: tmpName, tokens: jsonData});
  }
  else if (typeof jsonData === 'object') {
    // If data does not include an own name, we need to add a temporary
    // one to construct the node. Once it has been added to the parent,
    // we can remove it again.
    if (jsonData.name === undefined) {
      tmpName = generateTempName(parent, parentsKey);
      jsonData.name = tmpName;
    }

    // Token, TokenMap or a TokenArray with metadata...
    if (jsonData.value !== undefined) {
      // Looks like a token

      // Identify what kind of token
      // tmp:
      node = new ColorToken(jsonData);
    }
    else if (jsonData.tokens !== undefined && Array.isArray(jsonData.tokens)) {
      // TokenArray with metadata...
      node = new TokenArray(jsonData);
    }
    else {
      // TokenMap
      node = new TokenMap(jsonData);
    }
  }
  else {
    // If we fall through to here, we encountered invalid UDT
    throw new UdtParseError(`JSON data is not a valid UDT node: ${jsonData}`);
  }

  if (parentsKey === undefined) {
    parent.appendChild(node);
  }
  else {
    parent.setChild(parentsKey, node);
  }

  if (tmpName !== undefined) {
    // We created a temporary name.
    // Remove it now that the node has been added to
    // its parent.
    node.clearOwnName();
  }

  return node;
}
