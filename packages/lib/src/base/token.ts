import UdtNode from './node';
import Property from './property';
import { idToReference, escapeStringValue } from './reference-utils';
import { UdtModelIntegrityError, UdtParseError } from './errors';
import { TokenData } from './schema';

const idRegex = /^\w[-_\w\d]*$/;

/**
 * A callback function that checks if a value is of a valid
 * instance of certain type.
 *
 * @param val   The value to be checked.
 * @return      True if the value is valid, false otherwise.
 */
export type CheckerFn<V> = (val: any) => val is V;


/**
 * Checks if the input is a valid token ID.
 *
 * @param id  The id to check.
 */
function isValidId(id: any): id is string {
  return (id === undefined) || (typeof id === 'string') && idRegex.test(id);
}

/**
 * Checks if the input is a valid description value.
 *
 * Any string value is allowed. Additionally, undefined is a valid value
 * (setting a token's description to undefined clears that token's
 * description).
 *
 * @param description The description to check.
 */
function isValidDescription(description: any): description is string | undefined {
  return description === undefined || typeof description === 'string';
}

/**
 * Base class for all Token types.
 *
 * This class implements the properties that are common to all
 * token types (`id`, `name` & `description`).
 *
 * It also implements the logic for managing properties that can
 * reference other token's values. Token types extending this class
 * must use `__setupTokenProp()` to add their own properties.
 *
 * Finally, a `toJSON()` implementation is provided that will serialize
 * any derived token type to a JSON object that can be added to a
 * UDT file.
 */
export default abstract class Token<V = any, VT extends Token<any,any> = any> extends UdtNode {
  private _id: string | undefined;
  #value: Property<(VT | this), V>;
  #description: Property<Token, (string | undefined)>;

  /**
   * The token's ID.
   *
   * Token IDs must be unique within a UDT file.
   *
   * When (re-)setting a token's ID, checks will be performed
   * to ensure that it is a valid token ID. In the event that
   * it is not, a `TypeError` will be thrown.
   */
  public get id(): string | undefined {
    return this._id;
  }

  public set id(newId: string | undefined) {
    if (newId === this._id) {
      return;
    }
    if (!isValidId(newId)) {
      throw new TypeError(`"${newId}" is not a valid Token ID.`);
    }
    const topParent = this.getTopParent();
    if (newId !== undefined && topParent !== undefined && topParent.hasTokenWithId(newId)) {
      throw new UdtModelIntegrityError(`Cannot set ${newId} as the Token ID, as another token already has that ID.`);
    }
    this._id = newId;
  }

  /**
   * Helper for property setters that want to accept suitable Tokens as a shortcut
   * for their reference.
   *
   * @param prop
   * @param newVal
   */
  protected static _setPropValue<PT extends Token,PV>(prop: Property<PT,PV>, newVal: PT | PV | string, checkReference = true) {
    if (newVal instanceof Token) {
      if (newVal.id === undefined) {
        throw new TypeError('Cannot reference a token that does not have an ID');
      }
      prop.setValueOrRef(idToReference(newVal.id), checkReference);
    }
    else {
      prop.setValueOrRef(newVal, checkReference);
    }
  }

  /**
   * The optional description text for this token.
   *
   * This token's description may also reference another token's
   * description. To create such a reference, simply assign the other
   * token object to this `description` property.
   *
   * E.g.: `thisToken.description = otherToken;`
   *
   * Note that _reading_ this property will always return the actual
   * description _value_. In the above example, the referenced token's
   * description will be returned.
   *
   * An existing description can be cleared by setting the value
   * of this property to `undefined`.
   *
   * When (re-)setting a token's description, checks will be performed
   * to ensure that it is a string value, another `Token` instance or
   * `undefined`. In the event that it is neither, a `TypeError` will
   * be thrown.
   */
  public get description(): string | Token | undefined {
    return this.#description.getValue();
  }

  public set description(newDescr: string | Token | undefined) {
    Token._setPropValue(this.#description, newDescr);
  }

  /**
   * This token's value.
   *
   * This may also reference another token's value. To create
   * such a reference, simply assign the other token object to
   * this `value` property.
   *
   * E.g.: `thisColorToken.value = otherColorToken;`
   *
   * Note that _reading_ this property will always return the actual
   * _value_. In the above example, the referenced token's value will
   * be returned.
   *
   * When (re-)setting a value, checks will be performed to ensure that
   * it is a value or compatible Token type. In the event that it is
   * neither, a `TypeError` will be thrown.
   */
  public get value(): V | VT | string {
    return this.#value.getValue();
  }

  public set value(newVal: V | VT | string) {
    Token._setPropValue(this.#value, newVal);
  }



  /**
   * Constructs a token object from a JSON object.
   *
   * The data passed in must be an object with at least an
   * `id` property whose value is a valid token ID string. It
   * may also contain `name` and `description` properties, with
   * valid token name and description string values, respectively.
   *
   * If the data is not an object or contains any other properties
   * a `UdtParseError` will be thrown.
   *
   * @param jsonObj   An object with the `id` and optionally,
   *                  `name` and/or `description` of this
   *                  token.
   */
  constructor(
    {
      value,
      id,
      description,
      type,
      ...nodeProps
    }: TokenData
  ) {
    super(nodeProps);

    if (type !== undefined && type !== this._getOwnType()) {
      throw new UdtParseError(`Cannot construct a ${this._getOwnType()} token from data with type = ${type}.`);
    }

    // Assign ID
    this.id = id;

    // Standard "description" property that is common to all Token
    // types.
    this.#description = new Property(
      this,
      isValidDescription,
      this._getTokenById.bind(this),
      (propOwner: Token) => propOwner.#description,
    );

    // set description without checking references, since
    // we do not currently have a parent
    Token._setPropValue(this.#description, description, false);

    // Standard "description" property that is common to all Token
    // types.
    this.#value = new Property(
      this,
      this._isValidValue.bind(this),
      this._getAndValidateTokenById.bind(this),
      (propOwner: (VT | this)) => propOwner.#value,
    );

    // set value without checking references, since
    // we do not currently have a parent
    Token._setPropValue(this.#value, value, false);
  }


  public checkReferences(): void {
    this.description;
    this.value;
  }


  /**
   * Checks if the input is an instance of the
   * `Token` class, or one of its sub-classes.
   *
   * @param token   The token to check.
   */
  static isToken(token: any): token is Token {
    return token instanceof Token;
  }

  private _getTokenById(id: string): Token | undefined {
    const topParent = this.getTopParent();
    if (topParent !== undefined) {
      const token = topParent.getTokenById(id);
      if (token instanceof Token) {
        return token;
      }
    }
    return undefined;
  }

  private _getAndValidateTokenById(id: string): VT | this | undefined {
    const token = this._getTokenById(id);
    if (this._isValidToken(token)) {
      return token;
    }
    throw new TypeError(`Token with ID ${id} does not exist or is not valid for this property.`);
  }

  protected abstract _isValidValue(value: any): value is V;

  protected abstract _isValidToken(token: any): token is VT | this;

  /**
   * Checks if the value of a certain token property is actually
   * a reference to another token's value.
   *
   * @param propName  The name of the token property to check.
   */
  isReferencedValue(propName: string) {
    if (propName === 'description') {
      return this.#description.isReference()
    }
    else if (propName === 'value') {
      return this.#value.isReference();
    }
    else {
      return false;
    }
  }

  /**
   * Retrieves the token being referenced by a certain token property.
   *
   * @param propName  The name of the token property, whose referenced
   *                  token should be retrieved.
   */
  getReferencedToken(propName: string): Token | undefined {
    try {
      if (propName === 'description') {
        return this.#description.getReferencedObj()
      }
      else if (propName === 'value') {
        return this.#value.getReferencedObj();
      }
      else {
        throw new RangeError(`"${propName}" is not a known referencable property of this token type.`);
      }
    }
    catch (error) {
      if (error instanceof UdtModelIntegrityError) {
        // property is not a reference
        return undefined;
      }
      else {
        throw error;
      }
    }
  }

  /**
   * Returns the "@..." reference for this token.
   */
  toReference() {
    // TODO: Improve this! (Maybe auto-generate ID at some point?)
    if (this.id !== undefined) {
      return idToReference(this.id);
    }
    else {
      throw Error(`Token "${this.name}" has no ID.`);
    }
  }

  /**
   * Returns a JSON object representation of this token.
   *
   * As long as sub-classes correctly use `_setupTokenProp()` when
   * adding their own properties, this method will work for them too.
   * Specialised token types should therefore not need to implement
   * their own `toJSON()` methods.
   */
  toJSON() {
    const output: any = {};

    // Add own name if there is one
    if (this.hasOwnName()) {
      output.name = this.name;
    }

    output.id = this.id;
    output.type = this.type;

    // props that may be references
    for(const propName of ['description', 'value']) {
      const referencedToken = this.getReferencedToken(propName);
      if (referencedToken !== undefined) {
        // This prop's value is a token reference
        output[propName] = referencedToken.toReference();
      } else {
        // This prop has a normal value
        let value = (this as any)[propName];
        if (value !== undefined) {
          if (typeof value === 'string') {
            value = escapeStringValue(value);
          }
          output[propName] = value;
        }
      }
    }

    return output;
  }

}
