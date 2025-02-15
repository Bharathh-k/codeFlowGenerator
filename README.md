# codeFlowGenerator

Monitor backend services for unhandled exceptions or crashes (such as API failures).
Reconstruct the flow of execution leading to the crash, including:
The method calls leading to the failure.
The parameters passed to those methods.
The loop iterations.
The conditional blocks that were executed, etc.
Generate a graph to show the entire flow, allowing you to trace exactly how the crash happened and which conditions led to it.

Essentially trying to create a dynamic analysis tool that performs error tracing and visualizes the exact sequence of execution that led to the crash. This involves capturing detailed information about the service's execution flow at runtime.

This software will essentially become a dynamic tracing and visualizing tool that helps developers understand the exact sequence of method calls, parameters, and flow logic that led to a service crash. By visualizing the execution path, you’ll be able to spot bottlenecks, faulty logic, and other areas of concern that contributed to the failure.
