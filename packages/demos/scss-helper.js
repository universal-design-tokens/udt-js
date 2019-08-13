const { default: Token } = require('@udt/lib/lib/base/token');
const kebabCase =  require('lodash.kebabcase');

function toScssVariableName(token, prefix = '') {
  return `$${prefix ? `${prefix}-` : ''}${token.getPath().map(kebabCase).join('-')}`;
}


/**
 *
 * @param {Token} token
 * @param {string} prefix
 * @param {boolean} dereferenceValues
 */
function toScssVariableStatement(token, prefix = '', dereferenceValue = true) {
  let value;
  if (!dereferenceValue && token.isReferencedValue('value')) {
    value = toScssVariableName(token.getReferencedToken('value'), prefix);
  }
  else {
    value = token.value;
  }
  return `${toScssVariableName(token, prefix)}: ${value};`;
}


module.exports = {
  /**
   *
   * @param {UdtFile} udtFile
   * @param {string} prefix
   * @param {boolean} dereferenceValues
   */
  exportTokensToScssVariableStatements(udtFile, prefix = '', dereferenceValues = true) {
    let output = '';
    for (const token of udtFile.traverseTokens()) {
      if (token.description) {
        output += `// ${token.description}\n`;
      }
      output += `${toScssVariableStatement(token, prefix, dereferenceValues)}\n\n`;
    }
    return output;
  },
};
