enum TokenType {
  // "primitive" types from JSON (excl. null)
  String = 'string',
  Number = 'number',
  Object = 'object',
  Array = 'array',
  Boolean = 'boolean',

  // design-related types
  Color = 'color',
};

export default TokenType;
