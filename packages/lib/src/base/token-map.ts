import UdtNode from './node';
import TokenContainer from './token-container';
import { parseAndAppendNode } from './parser';
import { TokenMapData } from './schema';

const digitSuffixRegex = /\d+$/;

function addOrIncrementCounter(name: string) {
  // Find trailing digits (if any)
  const digitSuffixMatches = name.match(digitSuffixRegex);

  if(digitSuffixMatches === null) {
    // No trailing digits, so add one
    return `${name} 1`;
  }
  else {
    // Increment number suffix
    const number = parseInt(digitSuffixMatches[0]);
    return `${name.substr(0, digitSuffixMatches.index)}${number + 1}`;
  }
}


export default class TokenMap extends TokenContainer<string> {
  #tokens: Map<string, UdtNode>;

  constructor({
    name,
    type,
    description,
    ...tokens
  }: TokenMapData) {
    super({name, type, description});

    this.#tokens = new Map();
    this._parseAndAppendChildren(tokens);
  }

  private _parseAndAppendChildren(childrenData: {[childProp: string]: any}) {
    for (const key in childrenData) {
      const childData = childrenData[key];
      parseAndAppendNode(childData, this, key);
    }
  }

  public has(key: string) {
    return this.#tokens.has(key);
  }

  public getChild(key: string): UdtNode | undefined {
    return this.#tokens.get(key);
  }

  public get length() {
    return this.#tokens.size;
  }

  public keys() {
    return this.#tokens.keys();
  }

  public [Symbol.iterator]() {
    return this.#tokens.values();
  }

  public keyFor(childNode: UdtNode): string | undefined {
    let foundKey: string | undefined = undefined;
    for(let key of this.#tokens.keys()) {
      if (this.getChild(key) === childNode) {
        foundKey = key;
        break;
      }
    }
    return foundKey;
  }

  protected _isValidKeyForSetting(key: string): boolean {
    // Any string is a valid key
    return true;
  }

  protected _isFile(): this is never {
    return false;
  }

  public generateAvailableKey(): string {
    return this._generateNextAvailableKey();
  }

  private _generateNextAvailableKey(desiredKey?: string): string {
    let newKey = desiredKey === undefined ? 'child-' : desiredKey;
    while (this.#tokens.has(newKey)) {
      // try adding/incrementing counter to key
      // until we get one that's not in use.
      newKey = addOrIncrementCounter(newKey);
    }
    return newKey;
  }

  protected _doAppendOrSetChild(childNode: UdtNode, key?: string) {
    if (key === undefined) {
      // Append mode
      const newKey = this._generateNextAvailableKey(childNode.name);
      this.#tokens.set(newKey, childNode);
      return newKey;
    }
    else {
      // Set mode
      this.#tokens.set(key, childNode);
      return key;
    }
  }

  protected _doRemoveChild(key: string): UdtNode | undefined {
    const nodeToDelete = this.#tokens.get(key);
    this.#tokens.delete(key);
    return nodeToDelete;
  }

}
