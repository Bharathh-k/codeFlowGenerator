// Metadata storage using Map
const nodeMetaMap = new Map([
  [1, {
    "method": "processData",
    "params": {"user_id": 123, "amount": 500},
    "status": "error",
    "error_message": "TypeError: unsupported operand type(s)",
    "stack_trace": "Traceback (most recent call last)...",
    "timestamp": "2025-02-14T10:30:00Z",
    "next_calls": ["validateInput", "fetchUserDetails"]
  }],
  [2, {
    "method": "fetchUserDetails",
    "params": {"user_id": 123},
    "status": "success",
    "timestamp": "2025-02-14T10:32:00Z",
    "next_calls": ["processData"]
  }],
  [3, {
    "method": "validateInput",
    "params": {"input": "user_id"},
    "status": "success",
    "timestamp": "2025-02-14T10:29:00Z",
    "next_calls": ["fetchUserDetails"]
  }]
]);

// Initial nodes and edges
var nodes = new vis.DataSet([
  { id: 1, label: 'Node 1', title: JSON.stringify(nodeMetaMap.get(1), null, 2) },
  { id: 2, label: 'Node 2', title: JSON.stringify(nodeMetaMap.get(2), null, 2) },
  { id: 3, label: 'Node 3', title: JSON.stringify(nodeMetaMap.get(3), null, 2) }
]);

var edges = new vis.DataSet([
  { from: 1, to: 2 },
  { from: 2, to: 3 }
]);

// Create a network
var container = document.getElementById('mynetwork');
var data = {
  nodes: nodes,
  edges: edges
};
var options = {
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

var network = new vis.Network(container, data, options);

var nodeCounter = 4;
var automationInterval; // Variable to hold the interval

// Function to add a new node
function addNode(nodeId) {
  if (nodeId) {
    // Check if node with this ID already exists
    if (nodes.get(nodeId)) {
      console.log("Node with this ID already exists!");
    } else {
      nodes.add({ id: nodeId, label: 'Node ' + nodeId });
    }
  } else {
    console.log("Please provide a valid Node ID.");
  }
}

// Function to add a new edge
function addEdge(fromNode, toNode) {
  if (fromNode && toNode) {
    // Check if both nodes exist
    if (nodes.get(fromNode) && nodes.get(toNode)) {
      edges.add({ from: fromNode, to: toNode });
    } else {
      console.log("One or both of the nodes do not exist!");
    }
  } else {
    console.log("Please provide both From Node and To Node.");
  }
}

// Automation Function
function automation() {
  var nodeToAdd = nodeCounter++;
  var max = nodes.length;  // Setting max to current number of nodes
  var edgefromnode = Math.floor(Math.random() * max) + 1;
  var edgetonode = Math.floor(Math.random() * max) + 1;
  addNode(nodeToAdd);
  addEdge(edgefromnode, edgetonode);

  // Add default metadata for the new node
  nodeMetaMap.set(nodeToAdd, {
    "method": "automatedMethod",
    "params": {"node_id": nodeToAdd},
    "status": "pending",
    "timestamp": new Date().toISOString(),
    "next_calls": []
  });

  // Update node's hover title with metadata
  nodes.update({
    id: nodeToAdd,
    title: JSON.stringify(nodeMetaMap.get(nodeToAdd), null, 2)
  });
}

// Start Automation
export function startAutomation() {
  if (!automationInterval) { // Prevent multiple intervals
    automationInterval = setInterval(automation, 3000); // Run every second
  }
}

// Stop Automation
export function stopAutomation() {
  clearInterval(automationInterval);
  automationInterval = null;
}
