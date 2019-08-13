import {
  REFERENCE_PREFIX,
  ESCAPE_CHAR,
  idToReference,
  referenceToId,
  escapeStringValue,
  unescapeStringValue,
  isReference,
} from './reference-utils';

describe('idToReference()', () => {
  const testId = 'foobar';

  test('prepends correct prefix', () => {
    const testRef = idToReference(testId);
    expect(testRef.substring(0, REFERENCE_PREFIX.length)).toBe(REFERENCE_PREFIX);
  });

  test('does not alter ID portion', () => {
    const testRef = idToReference(testId);
    expect(testRef.substring(REFERENCE_PREFIX.length)).toBe(testId);
  });
});

describe('referenceToId()', () => {
  test('extracts ID name from reference', () => {
    expect(referenceToId('@barfoo')).toBe('barfoo');
  });
});

describe('escapeStringValue()', () => {
  const plainString = 'foobar';
  const startsWithPrefix = `${REFERENCE_PREFIX}${plainString}`;
  const startsWithEscapeChar = `${ESCAPE_CHAR}${plainString}`;

  test('does not alter plain string values', () => {
    expect(escapeStringValue(plainString)).toBe(plainString);
  });

  test('does not alter empty strings', () => {
    expect(escapeStringValue('')).toBe('');
  });

  test('escapes strings that begin with the reference prefix character(s)', () => {
    const escapedString = escapeStringValue(startsWithPrefix);
    expect(escapedString.substring(0, ESCAPE_CHAR.length)).toBe(ESCAPE_CHAR);
  });

  test('escapes strings that begin with the escape character(s)', () => {
    const escapedString = escapeStringValue(startsWithEscapeChar);
    expect(escapedString.substring(0, ESCAPE_CHAR.length)).toBe(ESCAPE_CHAR);
  });

  test('escaped strings are unchanged after the initial escape character', () => {
    const escapedString1 = escapeStringValue(startsWithPrefix);
    const escapedString2 = escapeStringValue(startsWithEscapeChar);
    expect(escapedString1.substring(ESCAPE_CHAR.length)).toBe(startsWithPrefix);
    expect(escapedString2.substring(ESCAPE_CHAR.length)).toBe(startsWithEscapeChar);
  });
});

describe('unescapeStringValue()', () => {
  const plainString = 'foobar';
  const startsWithPrefix = `${REFERENCE_PREFIX}${plainString}`;
  const startsWithEscapeChar = `${ESCAPE_CHAR}${plainString}`;

  const testValues = [
    plainString,
    startsWithPrefix,
    startsWithEscapeChar,
    `${REFERENCE_PREFIX}${startsWithPrefix}`, // double ref-prefix
    `${REFERENCE_PREFIX}${startsWithEscapeChar}`, // ref-prefix + esc
    `${ESCAPE_CHAR}${startsWithPrefix}`, // esc + ref-prefix
    `${ESCAPE_CHAR}${startsWithEscapeChar}`, // double esc
    '',
  ];

  test('does not alter plain string values', () => {
    expect(unescapeStringValue(plainString)).toBe(plainString);
  });

  test('does not alter strings starting with the escape character(s) only', () => {
    expect(unescapeStringValue(startsWithEscapeChar)).toBe(startsWithEscapeChar);
  });

  test('does not alter strings starting with the reference prefix character(s) only', () => {
    expect(unescapeStringValue(startsWithPrefix)).toBe(startsWithPrefix);
  });


  test('does not alter empty strings', () => {
    expect(unescapeStringValue('')).toBe('');
  });

  test('unescaping escaped strings always returns the original string', () => {
    testValues.forEach((stringValue) => {
      expect(unescapeStringValue(escapeStringValue(stringValue))).toBe(stringValue);
    });
  });
});

describe('isReference()', () => {
  const id = 'foobar';
  const reference = idToReference(id);

  /*
    "Potential references" because this function does NOT check
    if the ID portion after the reference prefix...
    - ...is valid ID syntax (the Token class does this)
    - ...can be dereferenced (the File class does this)
  */
  test('detects (potential) references', () => {
    expect(isReference(reference)).toBe(true);
  });

  test('detects non references', () => {
    expect(isReference(id)).toBe(false);
  });

  test('rejects non-string values', () => {
    expect(isReference(123)).toBe(false);
  });
});
