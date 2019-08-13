import { UdtModelIntegrityError } from "./errors";
import * as refUtils from './reference-utils';

/**
 * Retrieves the property-owning object identified
 * by the given ID.
 */
export type Dereferencer<T> = (id: string) => T | undefined;

/**
 * Retrieves the property of the given property-owning
 * object.
 */
export type PropGetter<T,V> = (propOwner: T) => Property<T,V>;

/**
 * Checks that a given value is of a certain type.
 */
export type ValueCheckerFn<V> = (val: any) => boolean;

/**
 * A Property that may either have a value or reference to a value on
 * another object.
 */
export default class Property<T,V> {
  readonly #owner: T;
  readonly #dereference: Dereferencer<T>;
  readonly #getProp: PropGetter<T,V>;
  readonly #checkValue: ValueCheckerFn<V>;

  #value: V | undefined;
  #referenceId: string | undefined;

  /**
   * Constructs a new property.
   *
   * @param owner       The object that owns this property
   *                    (used for detecting circular references)
   * @param checkValFn  Function to validate new values.
   * @param derefFn     Function to retrieve the object identified by
   *                    a given ID.
   * @param getPropFn   Function to retrieve the property object corresponding
   *                    to this one from a given object.
   */
  constructor(owner: T, checkValFn: ValueCheckerFn<V>, derefFn: Dereferencer<T>, getPropFn: PropGetter<T,V>) {
    this.#owner = owner;
    this.#dereference = derefFn;
    this.#getProp = getPropFn;
    this.#checkValue = checkValFn;
  }

  /**
   * Indicates whether this property references the value of another
   * object.
   *
   * @return  `true` if this property is a reference, `false` if it
   *          has its own value.
   */
  isReference(): boolean {
    return this.#referenceId !== undefined;
  }

  /**
   * Retrieves the object that is being directly referenced by this
   * property.
   *
   * @param originalRequestor   The object from which the chain of dereferencing
   *                            originates. Used to detect circular references.
   *
   * @return  The object being referenced by this property.
   *
   * @throws {UdtModelIntegrityError}   If this property is not referencing anything
   *                                    (i.e. has its own value), or if there were
   *                                    problems dereferencing the target object.
   */
  getReferencedObj(originalRequestor: T = this.#owner): T {
    if (this.#referenceId !== undefined) {
      return this._safelyDereference(this.#referenceId, originalRequestor);
    }
    else {
      throw new UdtModelIntegrityError('No reference ID has been set');
    }
  }

  /**
   * Retrieves the value of, or referenced by, this property.
   *
   * @param originalRequestor   The object from which the chain of dereferencing
   *                            originates. Used to detect circular references.
   *
   * @return  The value of, or referenced by, this property.
   */
  getValue(originalRequestor: T = this.#owner): V {
    if (this.#referenceId !== undefined) {
      const referencedProp = this.#getProp(this.getReferencedObj(originalRequestor));
      return referencedProp.getValue(originalRequestor);
    }
    else {
      return this.#value as V;
    }
  }

  /**
   * Sets the value or reference of this property.
   *
   * @param valueOrRef  The value or reference to set on this property.
   */
  setValueOrRef(valueOrRef: V|string, checkId = true): void {
    if (refUtils.isReference(valueOrRef)) {
      const id = refUtils.referenceToId(valueOrRef);

      if (checkId) {
        // Check that the ID actually references something:
        this._testId(id);
      }

      this.#referenceId = id;
      this.#value = undefined;
    }
    else {
      const unescapedValue = refUtils.unescapeStringValue(valueOrRef);
      if (this.#checkValue(unescapedValue)) {
        this.#value = unescapedValue;
        this.#referenceId = undefined;
      }
      else {
        throw new TypeError(`${valueOrRef} is not a valid value for this property.`);
      }
    }
  }

  /**
   * Retrieves the object referenced by the given ID and checks it
   * exists and is not a circular reference.
   *
   * If it does not exist or is a circular referece, an error is thrown.
   *
   * @param id                  The ID of the object to retrieve.
   * @param originalRequestor   The object to compare agains when checking
   *                            for circular references.
   *
   * @return  The retrieved object.
   *
   * @throws {UdtModelIntegrityError} If the ID does not reference any object
   *                                  or if it is a circular reference.
   */
  private _safelyDereference(id: string, originalRequestor: T): T {
    // console.log(`Property._safelyDereference(): this = `, this);
    // console.log(`Property._safelyDereference(): #dereference = `, this.#dereference);
    const referencedObject = this.#dereference(id);

    if (referencedObject === undefined) {
      throw new UdtModelIntegrityError(`Cannot find object referenced by ID: ${id}`);
    }
    if (referencedObject === originalRequestor) {
      throw new UdtModelIntegrityError('Circular reference detected');
    }
    return referencedObject;
  }

  private _testId(id: string): void {
    const referenceObject = this._safelyDereference(id, this.#owner);
    this.#getProp(referenceObject).getValue(this.#owner);
  }
}
