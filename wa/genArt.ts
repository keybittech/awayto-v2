import { Project, Node, SyntaxKind, ExportedDeclarations } from 'ts-morph';
import * as fs from 'fs';
import * as jsonlines from 'jsonlines';

async function generateArtifacts() {
  const project = new Project({
    tsConfigFilePath: './tsconfig.json',
  });

  const ignoreFields = (await (await fs.promises.readFile('ignore_fields', 'utf-8')).split('\n'));
  const sourceFiles = project.getSourceFiles();

  const artifacts = [] as Record<string, Record<string, unknown> | string>[];

  for (const sourceFile of sourceFiles) {
    const apiDefs = sourceFile.getVariableDeclarations().filter(declaration => declaration.getName().endsWith('Api'));
    const reactComponents = sourceFile.getFunctions().filter(func => func.getReturnType().getText().includes('JSX.Element'));

    for (const apiDef of apiDefs) {
      if (apiDef) {
        const endpoints = apiDef.getInitializer()?.getDescendantsOfKind(SyntaxKind.PropertyAssignment)
        .filter(e => {
          return !ignoreFields.includes(e.getName());
        })
        .map(endpoint => {
          const endpointName = endpoint.getName();
          const endpointArgs = endpoint.getType().getProperty('queryArg')?.getValueDeclaration()?.getText() ?? '';
          const endpointPath = endpoint.getType().getProperty('url')?.getValueDeclaration()?.getText() ?? '';
          const endpointResult = endpoint.getType().getProperty('resultType')?.getValueDeclaration()?.getText() ?? '';
  
          return { endpointName, endpointArgs, endpointPath, endpointResult };
        });
  
        const types = sourceFile.getInterfaces().map(type => type.getText());

        const exportedDeclarationsMap = sourceFile.getExportedDeclarations();

        const exportedTypes: ExportedDeclarations[] = [];
        const iterator = Array.from(exportedDeclarationsMap.entries());
        iterator.forEach(([exportName, declarations]) => {
          const typeDeclarations = declarations.filter(
            declaration => declaration.getKind() === SyntaxKind.TypeAliasDeclaration ||
                           declaration.getKind() === SyntaxKind.ClassDeclaration ||
                           declaration.getKind() === SyntaxKind.EnumDeclaration ||
                           declaration.getKind() === SyntaxKind.InterfaceDeclaration
          );
          exportedTypes.push(...typeDeclarations);
        });
        
        types.concat(exportedTypes.map(type => type.getText()));

        const prompt = {
          fileName: sourceFile.getBaseName(),
          endpoints,
          types,
        };
  
        const result = apiDef.getText();
        artifacts.push({ prompt, result });
      }
    }

    for (const reactComponent of reactComponents) {
      const defaultExportName = reactComponent.getName();

      const hooks = sourceFile.getImportDeclarations()
        .filter(imp => imp.getModuleSpecifierValue().endsWith('/hooks'))
        .flatMap(imp => imp.getNamedImports().map(spec => spec.getName()));

      const childComponents = sourceFile.getVariableDeclarations()
        .filter(declaration => declaration.getInitializer()?.getText().includes('useComponents'))
        .flatMap(declaration => {
          const initializer = declaration.getInitializer();
          if (Node.isCallExpression(initializer)) {
            return initializer.getArguments().map(arg => arg.getText());
          } else {
            return [];
          }
        });

      const prompt = {
        fileName: sourceFile.getBaseName(),
        defaultExportName,
        hooks,
        childComponents,
      };

      const result = reactComponent.getText();
      artifacts.push({ prompt, result });
    }
  }

  await fs.promises.writeFile('artifacts.jsonl', '');
  const writeStream = fs.createWriteStream('artifacts.jsonl');
  const stringifyStream = jsonlines.stringify();
  stringifyStream.pipe(writeStream);

  for (const artifact of artifacts) {
    stringifyStream.write(artifact);
  }

  stringifyStream.end();
}

generateArtifacts().catch(console.error);
