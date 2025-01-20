// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import path from 'path';
import fs from 'fs';

import { parseNpmPackageName } from './utils';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const hoverProvider = vscode.languages.registerHoverProvider(
    [
      { scheme: 'file' },
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

        // 解析出npm包名
        const packageName = parseNpmPackageName(word);
        if (!packageName) {
          return;
        }

        // 获取用户配置的 npm 源地址和 token
        const config = vscode.workspace.getConfiguration('showNpmVersion');
        const registryUrl = config.get<string>('registryUrl', 'https://registry.npmjs.org/');
        const authToken = config.get<string>('authToken', '');

        try {
          const response = await fetch(`${registryUrl.endsWith('/') ? registryUrl : registryUrl + '/'}${packageName}/latest`, {
            headers: authToken ? {
              'Authorization': `Bearer ${authToken}`
            } : {}
          });
          if (!response.ok) {
            return;
          }

          const data = await response.json() as any;
          const version = data.version;
          const versionTips = `Latest versions of ${packageName}: \`${version}\`.`;

          // 获取package.json和node_modules里依赖版本
          // 获取当前工作区的根目录
          let rootPath;
          const workspaceFolders = vscode.workspace.workspaceFolders;
          if (workspaceFolders && workspaceFolders.length > 0) {
            rootPath = path.resolve(workspaceFolders[0].uri.fsPath);
            console.log('Project root path:', rootPath);
          } else {
            console.log('No workspace folder is open.');
          }
          // 获取当前文件所在目录
          const editor = vscode.window.activeTextEditor;
          let currentPath;
          if (editor) {
            const document = editor.document;
            const filePath = document.uri.fsPath;
            currentPath = path.dirname(filePath);
          }
          // 往根目录查找最近的package.json和node_modules
          
          let nodeModulesTips = '';
          if (rootPath && currentPath) {
            while (currentPath.startsWith(rootPath)) {
              let packageJsonPath = null;
              let nodeModulesPath = null;
              const potentialPackageJsonPath = path.join(currentPath, 'package.json');
              const potentialNodeModulesPath = path.join(currentPath, 'node_modules');

              if (fs.existsSync(potentialPackageJsonPath) && !packageJsonPath) {
                packageJsonPath = potentialPackageJsonPath;
              }

              if (fs.existsSync(potentialNodeModulesPath) && !nodeModulesPath) {
                nodeModulesPath = potentialNodeModulesPath;
              }

              let nodeModulesVersion;
              if (nodeModulesPath) {
                const pkgPath = path.join(nodeModulesPath, packageName, 'package.json');
                if (fs.existsSync(pkgPath)) {
                  delete require.cache[pkgPath];
                  nodeModulesVersion = require(pkgPath).version;
                }
              }
              
              if (packageJsonPath) {
                nodeModulesTips = `Version of ${packageName} installed in node_modules: \`${nodeModulesVersion ? nodeModulesVersion : 'Not Installed!'}\``;
                break;
              }

              const parentPath = path.dirname(currentPath);
              if (parentPath === currentPath) {
                break; // Reached the root of the file system
              }
              currentPath = parentPath;
            }
          }

          return new vscode.Hover(`${versionTips}\n\n${nodeModulesTips}`);
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