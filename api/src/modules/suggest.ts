import { SourceFile } from "ts-morph";

const lineColumnToPosition = (sourceFile: SourceFile, line: number, column: number) => {
  let position = 0;
  const lines = sourceFile.getFullText().split('\n');

  for (let i = 0; i < line - 1; i++) {
    position += lines[i].length + 1; // +1 for the newline character
  }
  position += column;

  return position;
};

export const processSuggestion = (sourceFile: SourceFile, suggestion: string) => {
  const changes: Array<{
    action: 'add' | 'remove' | 'replace';
    code: string;
    startLine: number;
    startColumn: number;
    endLine?: number;
    endColumn?: number;
  }> = JSON.parse(suggestion);

  changes.forEach((change) => {
    const { action, code, startLine, startColumn, endLine, endColumn } = change;

    const startPosition = lineColumnToPosition(sourceFile, startLine, startColumn);

    switch (action) {
      case 'add':
        sourceFile.insertText(startPosition, code);
        break;
      case 'remove':
        if (endLine !== undefined && endColumn !== undefined) {
          const endPosition = lineColumnToPosition(sourceFile, endLine, endColumn);
          sourceFile.removeText(startPosition, endPosition);
        }
        break;
      case 'replace':
        if (endLine !== undefined && endColumn !== undefined) {
          const endPosition = lineColumnToPosition(sourceFile, endLine, endColumn);
          sourceFile.replaceText([startPosition, endPosition], code);
        }
        break;
      default:
        console.error('Invalid action:', action);
    }
  });
};