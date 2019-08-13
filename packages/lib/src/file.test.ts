import UdtFile from './file';
import TokenType from './base/token-type';
import { UdtModelIntegrityError } from './base/errors';

const testFilename = 'tokens.udt';

const okTestData = {
  tokens: [
    {
      name: 'Color-1',
      id: 'color1',
      value: '#123456',
      type: TokenType.Color,
    },
    {
      name: 'Color-2',
      id: 'color2',
      value: '#654321',
      type: TokenType.Color,
    },
  ],
};


describe('Constructing', () => {
  test('Can be constructed', () => {
    const file = new UdtFile(testFilename);
    expect(file).toBeInstanceOf(UdtFile);
  });

  test('Can be constructed from valid data', () => {
    const file = new UdtFile(testFilename, okTestData);
    expect(file).toBeInstanceOf(UdtFile);
  });
});

describe('Core File functionality', () => {
  let testFile: UdtFile;

  beforeEach(() => {
    testFile = new UdtFile(testFilename, okTestData);
  });

  test('name property contains filename', () => {
    expect(testFile.name).toBe(testFilename);
  });

  test('file cannot be added as child of another', () => {
    const file = new UdtFile('parent.udt');
    expect(() => {file.appendChild(testFile)}).toThrow(UdtModelIntegrityError);
  });
});
