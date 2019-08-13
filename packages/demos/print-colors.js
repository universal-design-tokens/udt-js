const { UdtFile, ColorToken, TokenType } = require('@udt/lib');

/**
 * Logs all color tokens in the given file to the console.
 *
 * @param {string} title
 * @param {UdtFile} udtFile
 */
function logColorTokens(title, udtFile) {
  console.group(title);
  for (const color of udtFile.findTokens({type: TokenType.Color})) {
    console.log(`Color "${color.name}" is${color.isReferencedValue('value') ? ' a reference to' : ''}: ${color.value}`);
  }
  console.groupEnd();
}

// Parse an existing UDT file
UdtFile.load('../lib/test/data/colors.udt').then((udtFile) => {
  // Print out its color tokens
  logColorTokens('Initial colors', udtFile);

  // Programatically make a new color token
  const magenta = new ColorToken({
    id: 'magenta',
    name: 'Magnificent Magenta',
    value: '#ffff00',
  });

  // Add it to our file object
  udtFile.appendChild(magenta);

  // Print updated UDT file data
  logColorTokens('New color added', udtFile);

  // Make a new color token that references magenta
  // for its value (so, an alias or "decision" token)
  const magentaAlias = new ColorToken({
    id: 'maglias',
    name: 'Magenta Alias',
    value: magenta,
  });

  // Add it to our file object
  udtFile.appendChild(magentaAlias);

  // Print updated UDT file data
  logColorTokens('Alias added', udtFile);
}).catch((error) => {
  console.error(`Unable to load UDT file, due to: ${error}`);
});
