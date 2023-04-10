import { FunctionDeclaration, Node, Project, SyntaxKind, JSDoc, SourceFile, TypeAliasDeclaration, PropertyDeclaration, VariableDeclaration, ParameterDeclaration, Identifier, TypeReferenceNode, PropertySignature } from 'ts-morph';
import * as fs from 'fs';

const COMPONENT_CONSTRUCTION_PROMPTS = './wiz/component_construction_example_prompts.jsonl';

const config = process.argv[2];

const purposes: Record<string, string> = {};
const componentConstructionPrompts: string[] = [];
const typeConstructionPrompts: string[] = [];
const project = new Project({
  tsConfigFilePath: './tsconfig.json',
});

const components = project.getSourceFiles().filter(f => f.getExtension() === '.tsx');
const allTypes = project.getSourceFiles().map(f => f.getTypeAliases()).flat().filter(t => {
  const siteType = t.getName();
  if (siteType.startsWith('I')) {
    purposes[siteType] = getPurpose(t);
    return true;
  }
});
const allTypeNames = allTypes.map(at => at.getName());

try {
  fs.unlinkSync('recent_log');
  fs.unlinkSync(COMPONENT_CONSTRUCTION_PROMPTS);
} catch (error) {}

function logToFile(message, path): boolean {
  fs.appendFileSync(path, message + '\n');
  return true;
}

function getTypeUsageDetails(node: TypeReferenceNode): string {
  const parent = node.getParent();


  switch (parent.getKind()) {
    case SyntaxKind.PropertySignature: {
      const propSignature = parent as PropertySignature;
      return `as the property ${propSignature.getName()}`;
    }
    case SyntaxKind.ArrayType: {
      const paramDecl = parent.getFirstAncestorByKind(SyntaxKind.PropertySignature)?.getName()
      const methodProp = node.getParent().getParentIfKind(SyntaxKind.Parameter)?.getName();

      if (methodProp) {
        return `as the array property ${methodProp} of the function ${paramDecl}`
      } else {
        return `as the array property ${paramDecl}`;
      }
    }
    case SyntaxKind.Parameter: {
      const paramDecl = parent as ParameterDeclaration;
      const functDecl = paramDecl.getFirstAncestorByKind(SyntaxKind.FunctionType);
      const methodDecl = paramDecl.getFirstAncestorByKind(SyntaxKind.MethodSignature);
      const functParamName = `${paramDecl.getName()} of the method ${functDecl?.getParentIfKind(SyntaxKind.PropertySignature)?.getName()}`;
      const methodDeclName = `${paramDecl.getName()} of the method ${methodDecl?.getName()}`;


      logToFile(JSON.stringify({ functParamName, methodDeclName }), 'recent_log')

      return `as the parameter ${functDecl ? functParamName : methodDeclName}`     
    }
    // Add more cases as needed
    default:
      return '';
  }
}

function fileHasShImport(sourceFile: SourceFile): boolean {
  const imports = sourceFile.getImportDeclarations();
  return imports.some(imp => imp.getModuleSpecifierValue() === 'awayto/hooks' && imp.getNamedImports().some(namedImport => namedImport.getName() === 'sh'));
}

function findShHookUsages(sourceFile: SourceFile): void {
  const shUsages = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)
    .filter(callExpr => {
      const shCallee = callExpr.getExpression().getFirstChildByKind(SyntaxKind.PropertyAccessExpression)?.getFirstChildByKind(SyntaxKind.Identifier)?.getText();

      logToFile(JSON.stringify({ sfN: sourceFile.getBaseNameWithoutExtension(), shCallee }), 'recent_log')
      return shCallee === 'sh';
    });

  shUsages.forEach(usage => {
    const variableDeclaration = usage.getFirstAncestorByKind(SyntaxKind.VariableDeclaration);
    if (variableDeclaration) {
      const variableName = variableDeclaration.getName();
      console.log(`Found variable: ${variableName} with hook usage: ${usage.getText()}`);
    }
  });
}

function getPurpose (ancestor: Node) {
  const a = ancestor as TypeAliasDeclaration;
  const hasPurpose = a.getJsDocs()[0]?.getTags().find(t => t.getTagName() === 'purpose');
  return hasPurpose ? `: ${hasPurpose.getCommentText()}` : '';
}

function getDirection(ancestor: any, currentType: string) {
  switch (ancestor.getKind()) {
    case SyntaxKind.PropertyDeclaration: {
      return `Create a property named ${ancestor.getName()} that uses ${currentType}.`;
    }
    case SyntaxKind.VariableDeclaration: {
      const initializer = ancestor.getInitializer();
      if (initializer && initializer.getKind() === SyntaxKind.ArrowFunction) {
        return `Create a constant function named ${ancestor.getName()} that takes ${initializer.getParameters().length} parameter(s) and returns ${currentType}.`;
      } else {
        const stateVar = ancestor.getName().startsWith('[');
        return `${stateVar ? 'Implement useState parts' : 'Create a constant variable'} named ${ancestor.getName()} that uses ${currentType}.`;
      }
    }
    case SyntaxKind.FunctionDeclaration: {
      const a = ancestor as FunctionDeclaration;
      const hasIProps = a.getParameters()[0].getType().getSymbol()?.getEscapedName().toLowerCase() === 'iprops';
      return `Create ${hasIProps ? 'react component' : 'function'} named ${a.getName()} implementing ${currentType} as a parameter or return type.`;
    }
    case SyntaxKind.MethodDeclaration: {
      return `Create method ${ancestor.getName()} implementing ${currentType} as a parameter, return type, or within its body.`;
    }
    case SyntaxKind.ClassDeclaration: {
      return `Create class ${ancestor.getName()} implementing ${currentType} as a property, method parameter or return type, or within its body.`;
    }
    case SyntaxKind.InterfaceDeclaration: {
      return `Create interface ${ancestor.getName()} implementing ${currentType} as a property type, method parameter or return type.`;
    }
    case SyntaxKind.TypeAliasDeclaration: {
      const usageDetails = ancestor?.getDescendantsOfKind(SyntaxKind.TypeReference)
        .filter(identifier => identifier.getTypeName().getText() === currentType)
        .map(identifier => getTypeUsageDetails(identifier))
        .filter(detail => detail)
        .join('; ') || '';
      if (!usageDetails) {
        return `Create type ${ancestor.getName()} which implements ${currentType}${usageDetails ? `: ${usageDetails}.` : '.'}`;
      }
    }
    case SyntaxKind.EnumDeclaration: {
      return `Create enum ${ancestor.getName()} that uses ${currentType} as a member value or type.`;
    }
    default: {
      console.log({ wiauhtiwuhiwue: ancestor.getName(), ajwifvw: ancestor.getKindName() })
      throw `${ancestor.getName()}`;
    }
  }
}

function getTopLevelAncestor(node: Node) {
  const ancestorKinds = [
    [
      SyntaxKind.PropertyDeclaration,
      SyntaxKind.VariableDeclaration,
      SyntaxKind.EnumMember,
      SyntaxKind.Parameter,
    ],
    [
      SyntaxKind.FunctionDeclaration,
      SyntaxKind.MethodDeclaration,
      SyntaxKind.ClassDeclaration,
      SyntaxKind.InterfaceDeclaration,
      SyntaxKind.TypeAliasDeclaration,
      SyntaxKind.EnumDeclaration,
    ]
  ];

  let topLevelAncestor: Node | undefined;

  for (const ancestorKindGroup of ancestorKinds) {
    topLevelAncestor = node.getFirstAncestor((ancestor) =>
      ancestorKindGroup.includes(ancestor?.getKind())
    );

    if (topLevelAncestor) {
      break;
    }
  }

  return topLevelAncestor;
}

function fileHasTypeUsages(sourceFile, allTypes) {
  for (const type of allTypes) {
    const typeName = type.getName();
    const usages = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)
      .filter(identifier => identifier.getText() === typeName);

    if (usages.length > 0) {
      return true;
    }
  }
  return false;
}

export function findTypeAliasUsages(): void {


  for (const sourceFile of components) {
    const filePath = sourceFile.getFilePath().split('modules/')[1].split('/')[1];
    if (fileHasTypeUsages(sourceFile, allTypes)) {
      const usedTypes: string[] = [];
      const directions: string[] = [];
      const fileIdentifiers = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier);

      for (const currType of allTypes) {
        const typeName = currType.getName();
        const relatedIdentifiers = fileIdentifiers.filter(i => i.getText() === typeName);
        const topLevelAncestors = relatedIdentifiers.map(i => getTopLevelAncestor(i));

        if (topLevelAncestors.length) usedTypes.push(typeName);

        for (const ancestor of topLevelAncestors) {
          if (ancestor && ![SyntaxKind.SourceFile, SyntaxKind.Parameter].includes(ancestor.getKind())) {
            const direction = getDirection(ancestor, typeName);

            if (directions.indexOf(direction) === -1) {
              directions.push(direction)
            }
          }
        }

      }

      directions.unshift(`Create a react component ${filePath} implementing application types ${usedTypes.join(', ')}.`)

      const prompt = directions.join(' ') + ' ' + `As a reminder, the application types related to this task and their purposes: ${usedTypes.join('') }.`      

      componentConstructionPrompts.push(JSON.stringify({
        prompt,
        completion: sourceFile.getText()
      }))
    }

    if (fileHasShImport(sourceFile)) {
      findShHookUsages(sourceFile);
    }
  }

  fs.writeFileSync('wiz/component_construction_example_prompts.jsonl', componentConstructionPrompts.join('\n'));

  
  for (const typeAlias of allTypes) {
    const typeName = typeAlias.getName();

    const subIds = typeAlias.getDescendantsOfKind(SyntaxKind.Identifier).map(i => i.getText()).filter(i => i !== typeName && allTypeNames.includes(i)).join(', ');

    const attributes = typeAlias.getDescendantsOfKind(SyntaxKind.PropertySignature).map(s => s.getName()).join(', ');

    const prompt = `Create type ${typeName}${subIds.length ? ` which implements ${subIds}` : ''}${attributes.length ? ` with attributes ${attributes}` : ''}.\n\n###\n\n`;

    typeConstructionPrompts.push(JSON.stringify({
      prompt,
      completion: ` ${typeAlias.getText()}\n\n|||\n\n`
    }))
  }

  fs.writeFileSync('wiz/type_creation_prompts.jsonl', typeConstructionPrompts.join('\n'));
}

findTypeAliasUsages()
