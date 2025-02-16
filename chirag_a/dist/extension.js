/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.executionLogData = void 0;
exports.executeFile = executeFile;
exports.activate = activate;
exports.deactivate = deactivate;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __webpack_require__(1);
const initial_1 = __webpack_require__(2);
const path = __webpack_require__(5);
const child_process_1 = __webpack_require__(3);
exports.executionLogData = "";
function executeFile(filePath) {
    const ext = path.extname(filePath);
    let command;
    if (ext === ".js") {
        command = `node "${filePath}"`;
    }
    else if (ext === ".py") {
        command = `python "${filePath}"`;
    }
    else if (ext === ".sh") {
        command = `sh "${filePath}"`;
    }
    else {
        vscode.window.showErrorMessage(`Unsupported file type: ${ext}`);
        return;
    }
    (0, child_process_1.exec)(command, (error, stdout, stderr) => {
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
function activate(context) {
    console.log('Congratulations, your extension "codeflow" is now active!');
    context.subscriptions.push(vscode.commands.registerCommand("codeflow.graphGenerator", () => {
        initial_1.InitialPanel.createOrShow(context.extensionUri);
    }));
    context.subscriptions.push(vscode.commands.registerCommand("codeflow.refresh", () => {
        initial_1.InitialPanel.kill();
        initial_1.InitialPanel.createOrShow(context.extensionUri);
    }));
    context.subscriptions.push(vscode.commands.registerCommand("codeflow.executeFile", () => __awaiter(this, void 0, void 0, function* () {
        if (initial_1.InitialPanel.currentPanel) {
            initial_1.InitialPanel.currentPanel._executeFile();
        }
        else {
            vscode.window.showErrorMessage("Please open CodeFlow first");
        }
    })));
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
    context.subscriptions.push(vscode.commands.registerCommand("codeflow.askQuestion", () => __awaiter(this, void 0, void 0, function* () {
        const answer = yield vscode.window.showInformationMessage("How are you?", "Good", "Bad");
        if (answer === "Good") {
            vscode.window.showInformationMessage("I am glad to hear that!");
        }
        else if (answer === "Bad") {
            vscode.window.showInformationMessage("I am sorry to hear that!");
        }
    })));
}
// This method is called when your extension is deactivated
function deactivate() { }


/***/ }),
/* 1 */
/***/ ((module) => {

module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.InitialPanel = void 0;
const vscode = __webpack_require__(1);
const child_process_1 = __webpack_require__(3);
const getNonce_1 = __webpack_require__(4);
const path = __webpack_require__(5);
const fs = __webpack_require__(6);
let data_read = "";
const txtFilePath = path.join(__dirname, "./t.txt");
fs.readFile(txtFilePath, "utf8", (err, data_read) => {
    if (err) {
        console.error("Error:", err);
        return;
    }
    console.log("File data:", data_read);
});
class InitialPanel {
    static kill() {
        if (InitialPanel.currentPanel) {
            InitialPanel.currentPanel.dispose();
            InitialPanel.currentPanel = undefined;
        }
    }
    static createOrShow(extensionUri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        if (InitialPanel.currentPanel) {
            InitialPanel.currentPanel._panel.reveal(column);
            return;
        }
        const panel = vscode.window.createWebviewPanel(InitialPanel.viewType, "CodeFlow", column || vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(extensionUri, "media"),
                vscode.Uri.joinPath(extensionUri, "out/compiled"),
            ],
        });
        InitialPanel.currentPanel = new InitialPanel(panel, extensionUri);
    }
    constructor(panel, extensionUri) {
        this._disposables = [];
        this._panel = panel;
        this._extensionUri = extensionUri;
        const txtFilePath = path.join(__dirname, "./t.txt");
        fs.readFile(txtFilePath, "utf8", (err, fileData) => {
            if (err) {
                console.error("Error reading file:", err);
                return;
            }
            console.log("File data:", fileData);
            // Send the file data to the webview
            this._panel.webview.postMessage({
                type: "fileData",
                content: fileData,
            });
        });
        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage((message) => __awaiter(this, void 0, void 0, function* () {
            switch (message.type) {
                case "executeFile":
                    yield this._executeFile();
                    break;
                case "onInfo":
                    if (!message.value) {
                        return;
                    }
                    vscode.window.showInformationMessage(message.value);
                    if (!message.value) {
                        return;
                    }
                    vscode.window.showErrorMessage(message.value);
                    if (!message.value) {
                        return;
                    }
                    vscode.window.showErrorMessage(message.value);
                    break;
            }
        }), null, this._disposables);
    }
    _executeFile() {
        return __awaiter(this, void 0, void 0, function* () {
            // Get all files in the workspace
            const files = yield vscode.workspace.findFiles("**/*");
            if (files.length === 0) {
                vscode.window.showInformationMessage("No files found in the workspace.");
                return;
            }
            const selectedFile = yield vscode.window.showQuickPick(files.map((file) => file.fsPath), { placeHolder: "Select a file to execute" });
            if (!selectedFile) {
                return;
            }
            // Create logs directory if it doesn't exist
            const logsDir = path.join(this._extensionUri.fsPath, "logs");
            yield vscode.workspace.fs.createDirectory(vscode.Uri.file(logsDir));
            // Execute the selected file
            (0, child_process_1.exec)(`node "${selectedFile}"`, (error, stdout, stderr) => __awaiter(this, void 0, void 0, function* () {
                // Create log data
                const logData = `File: ${selectedFile}\nOutput:\n${stdout}\nError:\n${stderr}\n\nExecuted at: ${new Date().toISOString()}\n\n`;
                // Save logs to file
                const logFilePath = path.join(logsDir, "execution.log");
                try {
                    yield vscode.workspace.fs.writeFile(vscode.Uri.file(logFilePath), Buffer.from(logData, "utf8"));
                    // Update webview with execution results
                    this._panel.webview.postMessage({
                        type: "log",
                        content: logData,
                    });
                    vscode.window.showInformationMessage(`Logs saved to ${logFilePath}`);
                }
                catch (err) {
                    vscode.window.showErrorMessage(`Failed to save logs: ${err.message}`);
                }
                if (error) {
                    vscode.window.showErrorMessage(`Execution Error: ${error.message}`);
                }
            }));
        });
    }
    dispose() {
        InitialPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
    _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }
    _getHtmlForWebview(webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "main.js"));
        const stylesResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "css", "styles.css"));
        const stylesMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css"));
        const nonce = (0, getNonce_1.getNonce)();
        return `<!DOCTYPE html>
<html>
<head>
  <title>Dynamic Graph with WebSocket Data</title>
  <script type="text/javascript" src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
  <style>
    #mynetwork {
      width: 100%;
      height: 600px;
      border: 1px solid lightgray;
    }
  </style>
</head>
<body>
  <h2>One Node per Message (Rebuilt by Sequence)</h2>
  <div id="mynetwork"></div>

  <script>
    const SERVER_URL = "ws://172.16.128.248:3000"; // Update to your actual WebSocket server URL
    const socket = new WebSocket(SERVER_URL);

    // Accumulate all messages here
    const allMessages = [];

    // vis.js DataSets
    const nodes = new vis.DataSet([]);
    const edges = new vis.DataSet([]);

    // For generating unique node IDs
    let uniqueIdCounter = 1;
    function generateUniqueId() {
      return uniqueIdCounter++;
    }

    // Node ID reference, so we can link them in order
    // We'll rebuild these from scratch each time
    let nodeIds = []; // array of node IDs, in sorted order of messages

    // Setup the vis.js network
    const container = document.getElementById('mynetwork');
    const data = { nodes, edges };
    const options = {
      nodes: {
        shape: 'dot',
        size: 20
      },
      edges: {
        color: 'gray',
        arrows: {
          to: { enabled: true, scaleFactor: 0.5 }
        }
      },
      physics: {
        enabled: true,
        solver: 'forceAtlas2Based'
      }
    };
    const network = new vis.Network(container, data, options);

    /**
     * Rebuild the entire graph from scratch based on allMessages.
     * Ensures exactly one node per message, in the order of sequence.
     */
    function rebuildGraph() {
      // 1) Clear existing nodes/edges
      nodes.clear();
      edges.clear();
      nodeIds = [];

      // 2) Sort allMessages by raw_json.sequence
      allMessages.sort((a, b) => {
        const seqA = a.raw_json?.sequence ?? 0;
        const seqB = b.raw_json?.sequence ?? 0;
        return seqA - seqB;
      });

      // 3) First pass: create exactly one node per message
      for (let i = 0; i < allMessages.length; i++) {
        const msg = allMessages[i];
        const { raw_json } = msg;
        const { method, status } = raw_json;

        // Decide color
        let color = "gray";
        if (status === "error") {
          color = "red";
        } else if (status === "success") {
          color = "green";
        }

        // Create a brand-new node for this message
        const newNodeId = generateUniqueId();
        nodeIds.push(newNodeId);

        // Add to nodes DataSet
        nodes.add({
          id: newNodeId,
          label: method || "unknown",
          color: color,
          title: JSON.stringify(msg, null, 2)
        });
      }

      // 4) Second pass: create edges based on next_calls
      //    We'll link from message i to j if:
      //    - j has a strictly higher sequence
      //    - raw_json.method in j matches one of i's next_calls
      for (let i = 0; i < allMessages.length; i++) {
        const fromMsg = allMessages[i];
        const fromSeq = fromMsg.raw_json?.sequence ?? 0;
        const fromNodeId = nodeIds[i];
        const nextCalls = fromMsg.raw_json?.next_calls || [];

        // For each next_call in fromMsg
        nextCalls.forEach(callName => {
          // Find a future message whose raw_json.method == callName
          // and has a sequence > fromSeq
          let bestJ = null;
          let bestSeq = Infinity;

          for (let j = 0; j < allMessages.length; j++) {
            if (j === i) continue; // don't link to itself
            const toMsg = allMessages[j];
            const toSeq = toMsg.raw_json?.sequence ?? 0;
            if (
              toSeq > fromSeq && 
              toMsg.raw_json?.method === callName &&
              toSeq < bestSeq
            ) {
              bestJ = j;
              bestSeq = toSeq;
            }
          }

          // If we found a suitable future message, link them
          if (bestJ !== null) {
            edges.add({
              from: fromNodeId,
              to: nodeIds[bestJ]
            });
          }
        });
      }
    }

    // Socket events
    socket.onopen = () => {
      console.log("✅ Connected to WebSocket Server at " + SERVER_URL);
    };

    socket.onmessage = (event) => {
      try {
        const jsonData = JSON.parse(event.data);
        console.log("🔵 Received WebSocket data:", jsonData);

        // Expecting something like:
        // {
        //   current_function: 'functionB',
        //   raw_json: {
        //     method: 'functionB',
        //     next_calls: [],
        //     sequence: 2,
        //     status: 'success',
        //     ... other fields ...
        //   }
        // }

        // 1) Store this message in allMessages
        allMessages.push(jsonData);

        // 2) Rebuild the entire graph from scratch
        rebuildGraph();

      } catch (error) {
        console.error("❌ Error parsing WebSocket data:", error);
      }
    };

    socket.onclose = () => {
      console.log("⚠ WebSocket disconnected from " + SERVER_URL);
    };
  </script>
</body>
</html>
`;
    }
}
exports.InitialPanel = InitialPanel;
InitialPanel.viewType = "initial";


/***/ }),
/* 3 */
/***/ ((module) => {

module.exports = require("child_process");

/***/ }),
/* 4 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getNonce = getNonce;
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}


/***/ }),
/* 5 */
/***/ ((module) => {

module.exports = require("path");

/***/ }),
/* 6 */
/***/ ((module) => {

module.exports = require("fs");

/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(0);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=extension.js.map