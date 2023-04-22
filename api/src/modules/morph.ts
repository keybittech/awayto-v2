// import { FunctionDeclaration, JsxElement, SourceFile, SyntaxKind } from "ts-morph";

// type ChangeType =
//   | "modifyReactComponent"
//   | "addImport"
//   | "removeImport"
//   | "addHook"
//   | "removeHook"
//   | "modifyHook"
//   | "addVariable"
//   | "modifyJsx"
//   | "modifyJsxAttribute"
//   | "addJsxElement"
//   | "wrapJsxElement";

// interface Change {
//   type: ChangeType;
//   payload: any;
// }

// type ChangeSet = Change[];

// function applyChangeSet(changeSet: ChangeSet, node: SourceFile | FunctionDeclaration) {
//   changeSet.forEach((change) => {
//     const { type, payload } = change;
//     console.log({ type, payload })
//     switch (type.toLowerCase()) {
//       case "modifyreactcomponent":
//         const componentDeclaration = findReactComponent(node as SourceFile, payload.componentName);
//         payload.changes.forEach((componentChange: Change) => applyChangeSet([componentChange], componentDeclaration as FunctionDeclaration));
//         break;
//       case "addimport":
//         addOrUpdateImport(node as SourceFile, payload.importName, payload.importSource);
//         break;
//       case "removeimport":
//         removeImport(node as SourceFile, payload.importName, payload.importSource);
//         break;
//       case "addhook":
//         addHookToComponent(payload.hookDeclaration, node as FunctionDeclaration);
//         break;
//       case "removehook":
//         removeHookFromComponent(payload.hookName, node as FunctionDeclaration);
//         break;
//       case "modifyhook":
//         modifyHookInitializer(node as FunctionDeclaration, payload.hookName, payload.newInitializer);
//         break;
//       case "addvariable":
//         addVariableToComponent(payload.variableDeclaration, node as FunctionDeclaration);
//         break;
//       case "modifyjsx":
//         payload.changes.forEach((jsxChange: Change) => applyChangeSet([jsxChange], node));
//         break;
//       case "modifyjsxattribute":
//         modifyJsxAttribute(node as SourceFile, payload.elementName, payload.attributeName, payload.newValue);
//         break;
//       case "addjsxelement":
//         addJsxElement(node as SourceFile, payload.parentElementName, payload.newElement, payload.position, payload.siblingElementName);
//         break;
//       case "wrapjsxelement":
//         wrapJsxElement(node as SourceFile, payload.elementName, payload.wrapper, payload.closingWrapper);
//         break;
//       default:
//         console.error(`Unknown change type: ${type}`);
//     }
//   });
// }

// // Utilities
// function findReactComponent(sourceFile: SourceFile, componentName: string) {
//   return sourceFile.getFunctionOrThrow(componentName);
// }

// // Import handling
// function addOrUpdateImport(sourceFile: SourceFile, importName: string, importSource: string) {
//   const existingImport = sourceFile.getImportDeclaration(importSource);
//   if (existingImport) {
//     const namedImports = existingImport.getNamedImports();
//     if (!namedImports.some((namedImport) => namedImport.getName() === importName)) {
//       existingImport.addNamedImport(importName);
//     }
//   } else {
//     sourceFile.addImportDeclaration({
//       namedImports: [importName],
//       moduleSpecifier: importSource,
//     });
//   }
// }

// function removeImport(sourceFile: SourceFile, importName: string, importSource: string) {
//   const existingImport = sourceFile.getImportDeclarations().find(declaration => declaration.getModuleSpecifierValue() === importSource);
//   if (existingImport) {
//     const namedImports = existingImport.getNamedImports();
//     const importToRemove = namedImports.find((namedImport) => namedImport.getName() === importName);

//     if (importToRemove) {
//       importToRemove.remove();

//       // If no named imports are left, remove the entire import declaration
//       if (existingImport.getNamedImports().length === 0) {
//         existingImport.remove();
//       }
//     }
//   }
// }

// // Hook handling
// function addHookToComponent(hookDeclaration: string, componentDeclaration: FunctionDeclaration) {
//   const functionBody = componentDeclaration.getBodyText();
//   const newFunctionBody = `${hookDeclaration}\n${functionBody}`;
//   componentDeclaration.setBodyText(newFunctionBody);
// }

// function removeHookFromComponent(hookName: string, componentDeclaration: FunctionDeclaration) {
//   const statements = componentDeclaration.getStatements();
//   const hookStatement = statements.find(statement => {
//     const text = statement.getText();
//     return text.trim().startsWith(hookName) || text.trim().includes(`.${hookName}`);
//   });

//   if (hookStatement) {
//     hookStatement.remove();
//   }
// }

// function modifyHookInitializer(componentDeclaration: FunctionDeclaration, hookName: string, newInitializer: string) {
//   const hookDeclaration = componentDeclaration.getVariableDeclarationOrThrow(hookName);
//   hookDeclaration.setInitializer(newInitializer);
// }

// // Variable handling
// function addVariableToComponent(variableDeclaration: string, componentDeclaration: FunctionDeclaration) {
//   const functionBody = componentDeclaration.getBodyText();
//   const newFunctionBody = `${variableDeclaration}\n${functionBody}`;
//   componentDeclaration.setBodyText(newFunctionBody);
// }

// function getJsxElementByTagName(sourceFile: SourceFile, tagName: string): JsxElement | undefined {
//   const jsxElements = sourceFile.getDescendantsOfKind(SyntaxKind.JsxElement);
//   return jsxElements.find(element => element.getOpeningElement().getTagNameNode().getText() === tagName);
// }

// function getJsxElementByTagNameOrThrow(sourceFile: SourceFile, tagName: string): JsxElement {
//   const element = getJsxElementByTagName(sourceFile, tagName);
//   if (!element) {
//     throw new Error(`JSX element with tag name '${tagName}' not found`);
//   }
//   return element;
// }

// // JSX handling
// function modifyJsxAttribute(sourceFile: SourceFile, elementName: string, attributeName: string, newValue: string) {
//   const element = getJsxElementByTagNameOrThrow(sourceFile, elementName);
//   const openingElement = element.getOpeningElement();
//   const attribute = openingElement.getAttribute(attributeName);

//   if (attribute) {
//     const attributeValue = attribute.getFirstChildByKind(SyntaxKind.JsxExpression) || attribute.getFirstChildByKind(SyntaxKind.StringLiteral);
//     if (attributeValue) {
//       attributeValue.replaceWithText(`"${newValue}"`);
//     }
//   } else {
//     openingElement.addAttribute({
//       name: attributeName,
//       initializer: `"${newValue}"`,
//     });
//   }
// }

// function addJsxElement(sourceFile: SourceFile, parentElementName: string, newElement: string, position: 'before' | 'after', siblingElementName: string) {
//   const parentElement = getJsxElementByTagNameOrThrow(sourceFile, parentElementName);
//   const siblingElement = parentElement.getChildSyntaxList()?.getChildrenOfKind(SyntaxKind.JsxElement).find(child => child.getOpeningElement().getTagNameNode().getText() === siblingElementName);

//   if (siblingElement) {
//     if (position === 'before') {
//       siblingElement.getParentSyntaxList()?.insertChildText(0, newElement);
//     } else {
//       siblingElement.getParentSyntaxList()?.insertChildText(siblingElement.getChildCount(), newElement);
//     }
//   } else {
//     throw new Error(`Sibling element "${siblingElementName}" not found.`);
//   }
// }

// function wrapJsxElement(sourceFile: SourceFile, elementName: string, wrapper: string, closingWrapper: string) {
//   const element = getJsxElementByTagNameOrThrow(sourceFile, elementName);
//   const wrappedJsx = `${wrapper}${element.getText()}${closingWrapper}`;
//   element.replaceWithText(wrappedJsx);
// }

// const lineColumnToPosition = (sourceFile: SourceFile, line: number, column: number) => {
//   let position = 0;
//   const lines = sourceFile.getFullText().split('\n');

//   for (let i = 0; i < line - 1; i++) {
//     position += lines[i].length + 1; // +1 for the newline character
//   }
//   position += column;

//   return position;
// };

// export const processSuggestion = (sourceFile: SourceFile, suggestion: string) => {
//   const changes: Array<{
//     action: 'add' | 'remove' | 'replace';
//     code: string;
//     startLine: number;
//     startColumn: number;
//     endLine?: number;
//     endColumn?: number;
//   }> = JSON.parse(suggestion);

//   changes.forEach((change) => {
//     const { action, code, startLine, startColumn, endLine, endColumn } = change;

//     const startPosition = lineColumnToPosition(sourceFile, startLine, startColumn);

//     switch (action) {
//       case 'add':
//         sourceFile.insertText(startPosition, code);
//         break;
//       case 'remove':
//         if (endLine !== undefined && endColumn !== undefined) {
//           const endPosition = lineColumnToPosition(sourceFile, endLine, endColumn);
//           sourceFile.removeText(startPosition, endPosition);
//         }
//         break;
//       case 'replace':
//         if (endLine !== undefined && endColumn !== undefined) {
//           const endPosition = lineColumnToPosition(sourceFile, endLine, endColumn);
//           sourceFile.replaceText([startPosition, endPosition], code);
//         }
//         break;
//       default:
//         console.error('Invalid action:', action);
//     }
//   });
// };

export default {}