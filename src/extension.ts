// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const hoverProvider = vscode.languages.registerHoverProvider(
    [
      { scheme: 'file', language: 'javascript' },
      { scheme: 'file', language: 'typescript' },
      { scheme: 'file', language: 'javascriptreact' },
      { scheme: 'file', language: 'typescriptreact' },
    ],
    {
      async provideHover(document, position, token) {
        const range = document.getWordRangeAtPosition(position, /"([^"]+)"|'([^']+)'/);
        if (!range) {
          return;
        }

        const word = document.getText(range).replace(/['"]/g, '');
        if (!word) {
          return;
        }

        // 获取用户配置的 npm 源地址和 token
        const config = vscode.workspace.getConfiguration('showNpmVersion');
        const registryUrl = config.get<string>('registryUrl', 'https://registry.npmjs.org/');
        const authToken = config.get<string>('authToken', '');

        try {
          const response = await fetch(`${registryUrl.endsWith('/') ? registryUrl : registryUrl + '/'}${word}/latest`, {
            headers: authToken ? {
              'Authorization': `Bearer ${authToken}`
            } : {}
          });
          if (!response.ok) {
            return;
          }

          const data = await response.json() as any;
          const version = data.version;
          return new vscode.Hover(`Latest versions of ${word}: \`${version}\``);
        } catch (error) {
          return;
        }
      }
    }
  );

  context.subscriptions.push(hoverProvider);
}

// This method is called when your extension is deactivated
export function deactivate() {}