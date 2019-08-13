import Token from '../token';
import TokenType from '../token-type';
import { TokenData } from '../schema';

/**
 * Mock Token type shared by several test scripts.
 */
export default class MockToken extends Token {
  #type: TokenType;

  constructor(
    data: TokenData,
    type: TokenType = TokenType.Color
  ) {
    super(data);
    this.#type = type;
  }

  protected _isValidValue(value: any): value is any {
    return true;
  }

  protected _isValidToken(token: any): token is Token {
    return token instanceof Token;
  }

  protected _getOwnType() {
    return this.#type;
  }
}
