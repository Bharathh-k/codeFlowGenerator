// instrument.js
const path = require("path");
const babelRegister = require("@babel/register");
const http = require("http"); // For posting logs

// --- Instrumentation Plugin ---
// This plugin instruments function declarations, if statements,
// loops, variable declarations, assignment expressions, and now break/continue.
const instrumentationPlugin = function ({types: t}) {
    let blockCounter = 0;
    return {
        visitor: {
            // Instrument functions.
            FunctionDeclaration(path) {
                const funcName = path.node.id.name;
                const assignment = t.expressionStatement(
                    t.assignmentExpression(
                        "=",
                        t.identifier(funcName),
                        t.callExpression(t.identifier("trace"), [t.identifier(funcName), t.stringLiteral(funcName)])
                    )
                );
                // Insert the assignment immediately after the function declaration.
                path.insertAfter(assignment);
            },

            // Instrument if statements.
            IfStatement(path) {
                blockCounter++;
                const thenLabel = `if_then_${blockCounter}`;
                if (t.isBlockStatement(path.node.consequent)) {
                    path.node.consequent.body.unshift(
                        t.expressionStatement(t.callExpression(t.identifier("logBlock"), [t.stringLiteral(thenLabel)]))
                    );
                } else {
                    path.node.consequent = t.blockStatement([
                        t.expressionStatement(t.callExpression(t.identifier("logBlock"), [t.stringLiteral(thenLabel)])),
                        path.node.consequent,
                    ]);
                }
                if (path.node.alternate) {
                    blockCounter++;
                    const elseLabel = `if_else_${blockCounter}`;
                    if (t.isBlockStatement(path.node.alternate)) {
                        path.node.alternate.body.unshift(
                            t.expressionStatement(
                                t.callExpression(t.identifier("logBlock"), [t.stringLiteral(elseLabel)])
                            )
                        );
                    } else {
                        path.node.alternate = t.blockStatement([
                            t.expressionStatement(
                                t.callExpression(t.identifier("logBlock"), [t.stringLiteral(elseLabel)])
                            ),
                            path.node.alternate,
                        ]);
                    }
                }
            },

            // Instrument loop statements.
            "ForStatement|WhileStatement|DoWhileStatement|ForInStatement|ForOfStatement"(path) {
                blockCounter++;
                const loopLabel = `loop_${blockCounter}`;
                if (t.isBlockStatement(path.node.body)) {
                    path.node.body.body.unshift(
                        t.expressionStatement(t.callExpression(t.identifier("logBlock"), [t.stringLiteral(loopLabel)]))
                    );
                } else {
                    path.node.body = t.blockStatement([
                        t.expressionStatement(t.callExpression(t.identifier("logBlock"), [t.stringLiteral(loopLabel)])),
                        path.node.body,
                    ]);
                }
                const exitLabel = `loop_exit_${blockCounter}`;
                path.insertAfter(
                    t.expressionStatement(t.callExpression(t.identifier("logBlock"), [t.stringLiteral(exitLabel)]))
                );
            },

            // --- Modified Variable Declarations ---
            // If a variable is declared as part of a for-loop header,
            // we want to log it in the "redos" (loop) block rather than the function-level variables.
            VariableDeclaration(path) {
                const isForLoopHeader =
                    path.parent && path.parent.type === "ForStatement" && path.parent.init === path.node;
                path.node.declarations.forEach((declarator) => {
                    if (declarator.init && t.isIdentifier(declarator.id)) {
                        if (isForLoopHeader) {
                            // Instrument for-loop header variables with traceVarInLoop.
                            declarator.init = t.callExpression(t.identifier("traceVarInLoop"), [
                                t.stringLiteral(declarator.id.name),
                                declarator.init,
                            ]);
                        } else {
                            // Normal declarations use traceVar.
                            declarator.init = t.callExpression(t.identifier("traceVar"), [
                                t.stringLiteral(declarator.id.name),
                                declarator.init,
                            ]);
                        }
                    }
                });
            },

            // Instrument assignment expressions.
            AssignmentExpression(path) {
                if (t.isIdentifier(path.node.left)) {
                    path.node.right = t.callExpression(t.identifier("traceVar"), [
                        t.stringLiteral(path.node.left.name),
                        path.node.right,
                    ]);
                }
            },

            // --- New Visitors for break and continue ---
            BreakStatement(path) {
                if (path.node._instrumented) return;
                blockCounter++;
                const breakLabel = `break_${blockCounter}`;
                const logCall = t.expressionStatement(
                    t.callExpression(t.identifier("logBlock"), [t.stringLiteral(breakLabel)])
                );
                const newBreak = t.breakStatement(path.node.label);
                newBreak._instrumented = true;
                path.replaceWith(t.blockStatement([logCall, newBreak]));
            },

            ContinueStatement(path) {
                if (path.node._instrumented) return;
                blockCounter++;
                const continueLabel = `continue_${blockCounter}`;
                const logCall = t.expressionStatement(
                    t.callExpression(t.identifier("logBlock"), [t.stringLiteral(continueLabel)])
                );
                const newContinue = t.continueStatement(path.node.label);
                newContinue._instrumented = true;
                path.replaceWith(t.blockStatement([logCall, newContinue]));
            },
        },
    };
};

// --- Babel Register Setup ---
babelRegister({
    extensions: [".js"],
    plugins: [instrumentationPlugin],
});

// --- Global Tracer Setup in JSON Format ---
global.dependencies = [];
global.executionLog = [];
global.callStack = [];
global.blockLog = [];
global.variableLog = [];

// Global storage for active loop logs.
global.loopLogStack = [];
global.currentLoopLog = null;

// Global array to store only function logs and loop logs in order.
global.allLogs = [];

// Global sequence counter for function logs.
global.sequenceCounter = 0;

/*
  The new global.trace wraps functions so that a log entry is enqueued as soon as the function is called.
  This ensures that parent function logs appear before their children in global.allLogs.
*/
global.trace = function (fn, name) {
    return function (...args) {
        // Increment and assign a sequence number for the log.
        global.sequenceCounter++;
        const sequence = global.sequenceCounter;

        // Create a log entry with initial information.
        const logEntry = {
            sequence: sequence,
            method: name,
            params: args,
            startTime: new Date().toISOString(),
            finishTime: null,
            status: "running",
            error_message: "",
            stack_trace: "",
            next_calls: [],
            inner_logs: [],
        };

        // Enqueue the log entry immediately (FIFO order).
        global.allLogs.push(logEntry);

        // Track dependencies (for next_calls)
        if (global.callStack.length > 0) {
            const parent = global.callStack[global.callStack.length - 1];
            parent.logEntry.next_calls.push(name);
        }

        global.callStack.push({name: name, logEntry: logEntry});
        let result;
        try {
            result = fn.apply(this, args);
        } catch (error) {
            logEntry.status = "error";
            logEntry.error_message = error.message;
            logEntry.stack_trace = error.stack;
            if (global.callStack.length > 1) {
                result = undefined;
            } else {
                throw error;
            }
        } finally {
            global.callStack.pop();
            logEntry.finishTime = new Date().toISOString();
            if (logEntry.status !== "error") {
                logEntry.status = "success";
            }

            // Commented out debug output:
            // console.log(JSON.stringify(logEntry, null, 2));

            // --- POST the function log object immediately ---
            const postData = JSON.stringify(logEntry);
            const options = {
                hostname: "172.16.128.248",
                port: 3000,
                path: "/upload-json",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(postData),
                },
            };

            const req = http.request(options, (res) => {
                let responseData = "";
                res.setEncoding("utf8");
                res.on("data", (chunk) => {
                    responseData += chunk;
                });
                res.on("end", () => {
                    // console.log("Log successfully posted:", responseData);
                });
            });
            req.on("error", (err) => {
                // console.error("Error posting log:", err);
            });
            req.write(postData);
            req.end();
        }
        return result;
    };
};

// Updated logBlock: when a loop exits, add its complete log to the current function's inner_logs
// and also store the loop log in the global array. For non-loop (generic block) logs, do not store.
global.logBlock = function (label) {
    const timestamp = new Date().toISOString();
    if (label.startsWith("loop_") && !label.startsWith("loop_exit_")) {
        // Create a loop log only if one isn't already active.
        if (global.loopLogStack.length === 0) {
            const newLoopLog = {event: "For loop entered", variables: []};
            global.loopLogStack.push(newLoopLog);
            global.currentLoopLog = newLoopLog;
        }
    } else if (label.startsWith("loop_exit_")) {
        // When exiting the loop, finish the current loop log.
        if (global.loopLogStack.length > 0) {
            const completedLoopLog = global.loopLogStack.pop();
            completedLoopLog.exitEvent = "For loop exited";
            if (global.callStack.length > 0) {
                const current = global.callStack[global.callStack.length - 1];
                current.logEntry.inner_logs = current.logEntry.inner_logs || [];
                current.logEntry.inner_logs.push(completedLoopLog);
            } else {
                // console.log(JSON.stringify(completedLoopLog, null, 2));
            }
            global.currentLoopLog =
                global.loopLogStack.length > 0 ? global.loopLogStack[global.loopLogStack.length - 1] : null;
            // Store only loop logs in the global array.
            global.allLogs.push(completedLoopLog);
        } else {
            const loopExitLog = {event: "For loop exited", timestamp: timestamp};
            if (global.callStack.length > 0) {
                const current = global.callStack[global.callStack.length - 1];
                current.logEntry.inner_logs = current.logEntry.inner_logs || [];
                current.logEntry.inner_logs.push(loopExitLog);
            } else {
                // console.log(JSON.stringify(loopExitLog, null, 2));
            }
            global.allLogs.push(loopExitLog);
        }
    } else {
        // For other block logs (non-loop) simply output but do not store.
        // console.log("Block Log:", label);
    }
    global.blockLog.push(label);
};

// Updated traceVar: if inside a loop, add to the loop log;
// otherwise, add to the function's inner_logs but do NOT store separately.
global.traceVar = function (name, value) {
    const timestamp = new Date().toISOString();
    let eventType = "varDeclaration";
    let varLogEntry = {
        event: eventType,
        variable: name,
        value: value,
        timestamp: timestamp,
    };

    if (global.currentLoopLog) {
        if (global.currentLoopLog.variables.some((entry) => entry.variable === name)) {
            varLogEntry.event = "varUpdate";
        }
        global.currentLoopLog.variables.push(varLogEntry);
    } else if (global.callStack.length > 0) {
        const current = global.callStack[global.callStack.length - 1];
        current.logEntry.variables = current.logEntry.variables || [];
        if (current.logEntry.variables.some((entry) => entry.variable === name)) {
            varLogEntry.event = "varUpdate";
        }
        current.logEntry.variables.push(varLogEntry);
        current.logEntry.inner_logs = current.logEntry.inner_logs || [];
        current.logEntry.inner_logs.push(varLogEntry);
    } else {
        global.variableLog.push(varLogEntry);
    }
    // console.log(JSON.stringify(varLogEntry, null, 2));
    return value;
};

// NEW: traceVarInLoop logs a for-loop header declaration exclusively to the active loop log.
// Do not store this separately.
global.traceVarInLoop = function (name, value) {
    const timestamp = new Date().toISOString();
    const varLogEntry = {
        event: "varDeclaration",
        variable: name,
        value: value,
        timestamp: timestamp,
    };

    // Create a loop context if none exists.
    if (global.loopLogStack.length === 0) {
        const newLoopLog = {event: "For loop entered", variables: []};
        global.loopLogStack.push(newLoopLog);
        global.currentLoopLog = newLoopLog;
    }

    const currentLoopLog = global.loopLogStack[global.loopLogStack.length - 1];
    currentLoopLog.variables.push(varLogEntry);
    return value;
};

// --- Run the Entry File ---
const entryFile = process.argv[2];
if (!entryFile) {
    // console.error("Usage: node instrument.js <entry-file>");
    process.exit(1);
}
const absoluteEntryPath = path.resolve(entryFile);
// console.log("--- Running Instrumented Code ---");

try {
    require(absoluteEntryPath);
} catch (error) {
    const errorLog = {
        method: "moduleExecution",
        params: [],
        status: "error",
        error_message: error.message,
        stack_trace: error.stack,
        timestamp: new Date().toISOString(),
        next_calls: [],
    };
    // console.error(JSON.stringify(errorLog, null, 2));
    global.allLogs.push(errorLog);
}

// When the process exits, print the details of the allLogs array.
process.on("exit", function () {
    console.log("\n--- Final Collected Logs ---");
    console.log("Array Name: allLogs");
    console.log("Total Entries:", global.allLogs.length);
    console.log(JSON.stringify(global.allLogs, null, 2));
});

// console.log(global.allLogs);

// Export the logs array.
module.exports = {
    logs: global.allLogs,
};
