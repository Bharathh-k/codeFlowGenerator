import * as vscode from "vscode";
import { exec } from "child_process";
import { getNonce } from "./getNonce";
import * as path from "path";
import * as fs from "fs";
let data_read = "";
const txtFilePath = path.join(__dirname, "./t.txt");
fs.readFile(txtFilePath, "utf8", (err, data_read) => {
    if (err) {
      console.error("Error:", err);
      return;
    }
    console.log("File data:", data_read);
});


export class InitialPanel {
  static kill() {
    if (InitialPanel.currentPanel) {
      InitialPanel.currentPanel.dispose();
      InitialPanel.currentPanel = undefined;
    }
  }
  public static currentPanel: InitialPanel | undefined;
  public static readonly viewType = "initial";

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (InitialPanel.currentPanel) {
      InitialPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      InitialPanel.viewType,
      "CodeFlow",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, "media"),
          vscode.Uri.joinPath(extensionUri, "out/compiled"),
        ],
      }
    );

    InitialPanel.currentPanel = new InitialPanel(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
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
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.type) {
          case "executeFile":
            await this._executeFile();
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
      },
      null,
      this._disposables
    );
  }

  public async _executeFile() {
    // Get all files in the workspace
    const files = await vscode.workspace.findFiles("**/*");

    if (files.length === 0) {
      vscode.window.showInformationMessage("No files found in the workspace.");
      return;
    }

    const selectedFile = await vscode.window.showQuickPick(
      files.map((file) => file.fsPath),
      { placeHolder: "Select a file to execute" }
    );

    if (!selectedFile) {
      return;
    }

    // Create logs directory if it doesn't exist
    const logsDir = path.join(this._extensionUri.fsPath, "logs");
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(logsDir));

    // Execute the selected file
    exec(`node "${selectedFile}"`, async (error, stdout, stderr) => {
      // Create log data
      const logData = `File: ${selectedFile}\nOutput:\n${stdout}\nError:\n${stderr}\n\nExecuted at: ${new Date().toISOString()}\n\n`;

      // Save logs to file
      const logFilePath = path.join(logsDir, "execution.log");
      try {
        await vscode.workspace.fs.writeFile(
          vscode.Uri.file(logFilePath),
          Buffer.from(logData, "utf8")
        );

        // Update webview with execution results
        this._panel.webview.postMessage({
          type: "log",
          content: logData,
        });

        vscode.window.showInformationMessage(`Logs saved to ${logFilePath}`);
      } catch (err: any) {
        vscode.window.showErrorMessage(`Failed to save logs: ${err.message}`);
      }

      if (error) {
        vscode.window.showErrorMessage(`Execution Error: ${error.message}`);
      }
    });
  }

  public dispose() {
    InitialPanel.currentPanel = undefined;
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "main.js")
    );

    const stylesResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "css", "styles.css")
    );
    const stylesMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );

    const nonce = getNonce();

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
