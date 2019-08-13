import Token from '../base/token';
import TokenType from '../base/token-type';
import { ColorTokenData } from '../base/schema';
import { ChildKey, ParentNode } from '../base/node';

const rbgHexRegex = /^#([a-fA-F\d]{6})$/;

/**
 * A color token.
 *
 * Color tokens represent a single, named color.
 */
export default class ColorToken extends Token<string, ColorToken> {
  constructor(data: ColorTokenData) {
    super(data);
  }

  /**
   * Checks if the input is a valid color string value.
   *
   * @param value The value to check.
   */
  protected _isValidValue(value: any): value is string {
    return (typeof value === 'string') && rbgHexRegex.test(value);
  }

  /**
   * Checks if the input is an instance of the
   * `ColorToken` class, or one of its sub-classes.
   *
   * @param token  The token to check.
   */
  protected _isValidToken(token: any): token is ColorToken {
    return token instanceof ColorToken;
  }

  protected _getOwnType(): TokenType {
    return TokenType.Color;
  }
}
