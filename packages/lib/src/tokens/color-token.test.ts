import ColorToken from './color-token';
import TokenType from '../base/token-type';

import MockToken from '../base/test/mock-token';
import MockContainer from '../base/test/mock-container';

const colorName = 'red';
const colorValue = '#ff0000';

const otherColorName = 'green';
const otherColorValue = '#00ff00';

describe('Core color functionality', () => {
  let colorToken: ColorToken;
  let otherColorToken: ColorToken;

  beforeEach(() => {
    colorToken = new ColorToken({ name: colorName, value: colorValue });
    otherColorToken = new ColorToken({ name: otherColorName, value: otherColorValue });
  });

  test('color initialises name correctly', () => {
    expect(colorToken.name).toBe(colorName);
  });

  test('color initialises color value correctly', () => {
    expect(colorToken.value).toBe(colorValue);
  });

  test('color value can reference another Color token', () => {
    const parent = new MockContainer({name: 'parent'});
    parent.appendChild(colorToken);
    parent.appendChild(otherColorToken);
    colorToken.id = 'foo';
    otherColorToken.value = colorToken;
    expect(otherColorToken.value).toBe(colorValue);
  });

  test('setting other token type as color value throws a TypeError', () => {
    const token = new MockToken({ name: 'foo', value: 'ignored' });
    expect(() => {
      otherColorToken.value = token as any as ColorToken;
    }).toThrow(TypeError);
  });

  test('initialising without color value throws a TypeError', () => {
    expect(() => {
      // eslint-disable-next-line no-new
      new ColorToken({ name: colorName } as any);
    }).toThrow(TypeError);
  });

  test('initialising with an invalid colour value throws a TypeError', () => {
    expect(() => {
      // eslint-disable-next-line no-new
      new ColorToken({ name: colorName, value: 'not a colour' });
    }).toThrow(TypeError);
  });

  test('value of type property is TokenType.Color', () => {
    expect(colorToken.type).toBe(TokenType.Color);
  });
});
