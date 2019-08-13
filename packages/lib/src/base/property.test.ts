import Property, { PropGetter } from './property';
import * as refUtils from './reference-utils';
import { UdtModelIntegrityError } from './errors';



class MockObjectRegistry {
  #objects: {[id: string]: MockObject} = {};

  getObject = jest.fn((id: string) => this.#objects[id] );

  add(id: string, obj: MockObject) {
    this.#objects[id] = obj;
  }
}

class MockObject {
  registry: MockObjectRegistry;
  prop: Property<MockObject, number>;
  valueCheckFn = jest.fn((val: number) => typeof val === 'number');

  constructor(registry: MockObjectRegistry, propGetter: PropGetter<MockObject, number>) {
    this.registry = registry;
    this.prop = new Property(
      this,
      this.valueCheckFn,
      this.registry.getObject,
      propGetter,
    );
  };
}

describe('Property', () => {
  const testVal = 42;
  const testVal2 = 666;
  const testId = 'other';

  let mockGetPropFn: jest.Mock;
  let mockRegistry: MockObjectRegistry;
  let mockObj: MockObject;
  let prop: Property<MockObject, number>;

  beforeEach(() => {
    mockRegistry = new MockObjectRegistry();
    mockGetPropFn = jest.fn((propOwner: MockObject) => propOwner.prop);
    mockObj = new MockObject(mockRegistry, mockGetPropFn);
    prop = mockObj.prop;
  });

  test('is not a reference by default', () => {
    expect(prop.isReference()).toBe(false);
  });

  test('getValue() returns undefined initially', () => {
    expect(prop.getValue()).toBeUndefined();
  });

  test('getReferencedObj() throws UdtModelIntegrity until either value or prop has been set', () => {
    expect(() => {
      prop.getReferencedObj();
    }).toThrow(UdtModelIntegrityError);
  });

  test('a set value can be retrieved', () => {
    prop.setValueOrRef(testVal);
    expect(prop.getValue()).toBe(testVal);
  });

  test('is not a reference after a value has been set', () => {
    prop.setValueOrRef(testVal);
    expect(prop.isReference()).toBe(false);
  });

  test('getReferencedObj() throws UdtModelIntegrity after a value has bee set', () => {
    prop.setValueOrRef(testVal);
    expect(() => {
      prop.getReferencedObj();
    }).toThrow(UdtModelIntegrityError);
  });

  test('calls the value checker function when setting a value', () => {
    prop.setValueOrRef(testVal);
    expect(mockObj.valueCheckFn).toHaveBeenCalledWith(testVal);
  });

  test('setting an invalid value throws a TypeError', () => {
    expect(() => {
      prop.setValueOrRef(false as any);
    }).toThrow(TypeError);
  });

  test('a referenced value can be retrieved', () => {
    const otherObj = new MockObject(mockRegistry, mockGetPropFn);
    otherObj.prop.setValueOrRef(testVal2);
    mockRegistry.add(testId, otherObj);

    prop.setValueOrRef(refUtils.idToReference(testId));
    expect(prop.getValue()).toBe(testVal2);
  });

  test('a referenced object can be retrieved', () => {
    const otherObj = new MockObject(mockRegistry, mockGetPropFn);
    otherObj.prop.setValueOrRef(testVal2);
    mockRegistry.add(testId, otherObj);

    prop.setValueOrRef(refUtils.idToReference(testId));
    expect(prop.getReferencedObj()).toBe(otherObj);
  });

  test('identifies as a reference correctly', () => {
    const otherObj = new MockObject(mockRegistry, mockGetPropFn);
    otherObj.prop.setValueOrRef(testVal2);
    mockRegistry.add(testId, otherObj);

    prop.setValueOrRef(refUtils.idToReference(testId));
    expect(prop.isReference()).toBe(true);
  });

  test('setting a reference calls the dereference function', () => {
    const otherObj = new MockObject(mockRegistry, mockGetPropFn);
    otherObj.prop.setValueOrRef(testVal2);
    mockRegistry.add(testId, otherObj);

    prop.setValueOrRef(refUtils.idToReference(testId));
    expect(mockRegistry.getObject).toHaveBeenCalledWith(testId);
  });

  test('setting a reference calls the prop getter function', () => {
    const otherObj = new MockObject(mockRegistry, mockGetPropFn);
    otherObj.prop.setValueOrRef(testVal2);
    mockRegistry.add(testId, otherObj);

    prop.setValueOrRef(refUtils.idToReference(testId));
    expect(mockGetPropFn).toHaveBeenCalledWith(otherObj);
  });

  test('retrieving a referenced value calls the dereference function', () => {
    const otherObj = new MockObject(mockRegistry, mockGetPropFn);
    otherObj.prop.setValueOrRef(testVal2);
    mockRegistry.add(testId, otherObj);

    prop.setValueOrRef(refUtils.idToReference(testId));
    // Clear mock since setValueOrRef() called it already
    mockRegistry.getObject.mockClear();

    prop.getValue();
    expect(mockRegistry.getObject).toHaveBeenCalledWith(testId);
  });

  test('retrieving a referenced value calls the prop getter function', () => {
    const otherObj = new MockObject(mockRegistry, mockGetPropFn);
    otherObj.prop.setValueOrRef(testVal2);
    mockRegistry.add(testId, otherObj);

    prop.setValueOrRef(refUtils.idToReference(testId));
    // Clear mock since setValueOrRef() called it already
    mockGetPropFn.mockClear();

    prop.getValue();
    expect(mockGetPropFn).toHaveBeenCalledWith(otherObj);
  });

  test('Setting an unknown ID throws a UdtModelIntegrityError', () => {
    expect(() => {
      prop.setValueOrRef('@unknown');
    }).toThrow(UdtModelIntegrityError);
  });

  test('Setting a reference to owning object throws UdtModelIntegrityError', () => {
    mockRegistry.add(testId, mockObj);

    expect(() => {
      prop.setValueOrRef(refUtils.idToReference(testId));
    }).toThrow(UdtModelIntegrityError);
  });

  test('retrieving an indirectly referenced value works', () => {
    const nextId = 'next';
    const nextObj = new MockObject(mockRegistry, mockGetPropFn);
    mockRegistry.add(nextId, nextObj);

    const lastId = 'last';
    const lastObj = new MockObject(mockRegistry, mockGetPropFn);
    mockRegistry.add(lastId, lastObj);

    lastObj.prop.setValueOrRef(testVal);
    nextObj.prop.setValueOrRef(refUtils.idToReference(lastId))
    prop.setValueOrRef(refUtils.idToReference(nextId));

    expect(prop.getValue()).toBe(testVal);
  });

  test('indirect circular references are detected', () => {
    mockRegistry.add(testId, mockObj);

    const nextId = 'next';
    const nextObj = new MockObject(mockRegistry, mockGetPropFn);
    mockRegistry.add(nextId, nextObj);

    const lastId = 'last';
    const lastObj = new MockObject(mockRegistry, mockGetPropFn);
    mockRegistry.add(lastId, lastObj);

    lastObj.prop.setValueOrRef(testVal);
    nextObj.prop.setValueOrRef(refUtils.idToReference(lastId))
    prop.setValueOrRef(refUtils.idToReference(nextId));

    expect(() => {
      lastObj.prop.setValueOrRef(refUtils.idToReference(testId));
    }).toThrow(UdtModelIntegrityError);
  });

});
