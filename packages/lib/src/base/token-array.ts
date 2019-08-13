import TokenContainer from './token-container';
import UdtNode from './node';
import { parseAndAppendNode } from './parser';
import { UdtParseError } from './errors';
import { TokenArrayObjectData } from './schema';

export default class TokenArray extends TokenContainer<number> {
  #tokens: UdtNode[];

  constructor({
    tokens,
    ...rest
  }: TokenArrayObjectData) {
    super(rest);

    this.#tokens = [];

    if(tokens === undefined || ! Array.isArray(tokens)) {
      throw new UdtParseError(`Invalid token array data. Object's tokens property was absent or not an array.`);
    }

    this._parseAndAppendChildren(tokens);
  }

  private _parseAndAppendChildren(childrenData: any[]) {
    for (let i=0; i < childrenData.length; ++i) {
      const childData = childrenData[i];
      parseAndAppendNode(childData, this);
    }
  }

  public get length() {
    return this.#tokens.length;
  }

  public getChild(key: number): UdtNode | undefined {
    return this.#tokens[key];
  }

  public keyFor(childNode: UdtNode): number | undefined {
    const foundIndex = this.#tokens.indexOf(childNode);
    if (foundIndex === -1) {
      return undefined;
    }
    return foundIndex;
  }

  public generateAvailableKey(): number {
    return this.length;
  }

  protected _isValidKeyForSetting(key: number): boolean {
    if (key >= 0 && key <= this.length) {
      return true;
    }
    return false;
  }

  protected _isFile(): this is never {
    return false;
  }

  protected _doAppendOrSetChild(childNode: UdtNode, key?: number) {
    if (key === undefined || key === this.length) {
      // Append mode
      this.#tokens.push(childNode);
      return this.#tokens.length - 1;
    }
    // Set mode
    this.#tokens[key] = childNode;
    return key;
  }

  protected _doRemoveChild(key: number): UdtNode {
    const nodeToDelete = this.#tokens[key];
    this.#tokens.splice(key, 1);
    return nodeToDelete;
  }

  public keys() {
    return this.#tokens.keys();
  }

  public [Symbol.iterator]() {
    return this.#tokens.values();
  }
}
