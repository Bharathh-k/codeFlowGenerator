// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { InitialPanel } from "./initial";
import * as path from "path";
import { exec } from "child_process";
export let executionLogData = "";
export function executeFile(filePath: string) {
  const ext = path.extname(filePath);

  let command: string;
  if (ext === ".js") {
    command = `node "${filePath}"`;
  } else if (ext === ".py") {
    command = `python "${filePath}"`;
  } else if (ext === ".sh") {
    command = `sh "${filePath}"`;
  } else {
    vscode.window.showErrorMessage(`Unsupported file type: ${ext}`);
    return;
  }

  exec(command, (error, stdout, stderr) => {
    if (error) {
      vscode.window.showErrorMessage(`Execution Error: ${error.message}`);
      return;
    }
    vscode.window.showInformationMessage(`Output:\n${stdout}`);
    if (stderr) {
      console.error(`Execution Stderr: ${stderr}`);
    }
  });
}
export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "codeflow" is now active!');
  context.subscriptions.push(
    vscode.commands.registerCommand("codeflow.graphGenerator", () => {
      InitialPanel.createOrShow(context.extensionUri);
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("codeflow.refresh", () => {
      InitialPanel.kill();
      InitialPanel.createOrShow(context.extensionUri);
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("codeflow.executeFile", async () => {
      if (InitialPanel.currentPanel) {
        InitialPanel.currentPanel._executeFile();
      } else {
        vscode.window.showErrorMessage("Please open CodeFlow first");
      }
    })
  );
  // let disposable = vscode.commands.registerCommand('codeflow.executeFile', async () => {
  //     // Get all files in the workspace
  //     const files = await vscode.workspace.findFiles('**/*'); // Modify pattern if needed

  //     if (files.length === 0) {
  //         vscode.window.showInformationMessage("No files found in the workspace.");
  //         return;
  //     }

  //     // Show file picker
  //     const selectedFile = await vscode.window.showQuickPick(
  //         files.map(file => file.fsPath),
  //         { placeHolder: "Select a file to execute" }
  //     );

  //     if (!selectedFile) {
  //         return;
  //     }

  // 	// Execute the selected file and collect logs
  // 	exec(`node "${selectedFile}"`, (error, stdout, stderr) => {
  // 		if (error) {
  // 		vscode.window.showErrorMessage(`Execution Error: ${error.message}`);
  // 		return;
  // 		}
  // 		vscode.window.showInformationMessage(`Output:\n${stdout}`);
  // 		if (stderr) {
  // 		console.error(`Execution Stderr: ${stderr}`);
  // 		}
  // 		let executionLogData = {
  // 			file: selectedFile,
  // 			output: stdout,
  // 			error: stderr
  // 		};
  // 		// Collect logs
  // 		const logFilePath = path.join(context.logUri.fsPath, 'execution.log');
  // 		const workspaceLogFilePath = path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, 'logs', 'execution.log');
  // 		let logData = `File: ${selectedFile}\nOutput:\n${stdout}\nError:\n${stderr}\n\n`;
  // 		// Save logs to extension log directory
  // 		vscode.workspace.fs.writeFile(vscode.Uri.file(logFilePath), Buffer.from(logData, 'utf8'))
  // 		.then(
  // 			() => {
  // 				vscode.window.showInformationMessage(`Logs saved to ${logFilePath}`);
  // 			},
  // 			(err: any) => {
  // 				vscode.window.showErrorMessage(`Failed to save logs: ${err.message}`);
  // 			}
  // 		);
  // 		if (InitialPanel.currentPanel) {
  // 			InitialPanel.currentPanel.webview.postMessage({
  // 				type: 'onInfo',
  // 				value: `Logs saved to ${logFilePath}`
  // 			});
  // 		}
  // 		// Save logs to workspace logs directory
  // 		if (vscode.workspace.workspaceFolders) {
  // 			vscode.workspace.fs.createDirectory(vscode.Uri.file(path.dirname(workspaceLogFilePath))).then(() => {
  // 				vscode.workspace.fs.writeFile(vscode.Uri.file(workspaceLogFilePath), Buffer.from(logData, 'utf8'))
  // 				.then(
  // 					() => {
  // 						vscode.window.showInformationMessage(`Logs also saved to ${workspaceLogFilePath}`);
  // 					},
  // 					(err: any) => {
  // 						vscode.window.showErrorMessage(`Failed to save logs to workspace: ${err.message}`);
  // 					}
  // 				);
  // 			});
  // 		} else {
  // 			vscode.window.showErrorMessage('No workspace folder is open. Logs cannot be saved to workspace.');
  // 		}
  // 	});
  // });

  // context.subscriptions.push(disposable);

  context.subscriptions.push(
    vscode.commands.registerCommand("codeflow.askQuestion", async () => {
      const answer = await vscode.window.showInformationMessage(
        "How are you?",
        "Good",
        "Bad"
      );
      if (answer === "Good") {
        vscode.window.showInformationMessage("I am glad to hear that!");
      } else if (answer === "Bad") {
        vscode.window.showInformationMessage("I am sorry to hear that!");
      }
    })
  );
}
// This method is called when your extension is deactivated
export function deactivate() {}
