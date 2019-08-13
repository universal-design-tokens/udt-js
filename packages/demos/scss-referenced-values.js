const { UdtFile } = require('@udt/lib');
const { exportTokensToScssVariableStatements } = require('./scss-helper');

// Parse an existing UDT file
UdtFile.load('../lib/test/data/colors.udt').then((udtFile) => {
  console.log('/* === SASS vars (references preserved) === */\n');
  console.log(exportTokensToScssVariableStatements(udtFile, undefined, false));

}).catch((error) => {
  console.error(`Unable to load UDT file, due to: ${error}`);
});
