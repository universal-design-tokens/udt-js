export const REFERENCE_PREFIX = '@';
export const ESCAPE_CHAR = '\\';

export function idToReference(id: string) {
  return `${REFERENCE_PREFIX}${id}`;
}

export function referenceToId(ref: string) {
  return ref.substr(1);
}

/*
  @foo -> \@foo
  \foo -> \\foo

  foo -> foo
*/
export function escapeStringValue<T>(value: T): T {
  if (typeof value === 'string' && (value[0] === REFERENCE_PREFIX || value[0] === ESCAPE_CHAR)) {
    return `${ESCAPE_CHAR}${value}` as any as T;
  }
  return value;
}

/*
  \@foo -> @foo
  \\foo -> \foo

  foo -> foo
*/
export function unescapeStringValue<T>(value: T): T {
  if (typeof value === 'string' && value[0] === ESCAPE_CHAR && (value[1] === REFERENCE_PREFIX || value[1] === ESCAPE_CHAR)) {
    return value.substring(1) as any as T;
  }
  return value;
}

export function isReference(val: any): val is string {
  return typeof val === 'string' && val[0] === REFERENCE_PREFIX;
}
