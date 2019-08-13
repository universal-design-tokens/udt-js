const { UdtFile } = require('@udt/lib');
const { exportTokensToScssVariableStatements } = require('./scss-helper');

// Parse an existing UDT file
UdtFile.load('../lib/test/data/colors.udt').then((udtFile) => {
  console.log('/* === SASS vars (resolved values) === */\n');
  console.log(exportTokensToScssVariableStatements(udtFile));

}).catch((error) => {
  console.error(`Unable to load UDT file, due to: ${error}`);
});
