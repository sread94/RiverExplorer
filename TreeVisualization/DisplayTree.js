/**
	This function reads in JSON data
	and creates a tree
*/
function readTree(){

	var data = tree_valid3;

	//create and array for all of the nodes in the tree
	var nodeList = [];
	var tempNode;
	for(var i = 0; i<data.nodeIds.length; i++){
		tempNode = new Node(data.nodeIds[i], data.vals[i],
			data.coords[i], getNeighbors(data.probBtwNodes, data.nodeIds[i]));
		nodeList[i] = tempNode;
	}
	
	//create the tree from the given data
	var theTree = new Tree(data.numNodes, nodeList,
		data.probBtwNodes);

	//make sure the tree is valid
	var validTree = checkTree(theTree);

	if(validTree === "true"){

		//if the tree is valid draw it
		drawTree(theTree);
		computeNetworkValue(theTree, theTree.nodeList[0], theTree.nodeList[1]);
	}
	else{

		//if the tree is not valid show an alert message
		window.alert(validTree);
	}
}

/**
	finds all the neightbors of a given node
	based on the data for the probability for
	moving between nodes
*/
function getNeighbors(probabilities, nodeId){
	var neighbors = [];

	//loop through all of the probabilities and find
	//where the given nodeId is the first one listed
	//and store the nodes the given node is connected to
	for(var i = 0; i < probabilities.length; i++){
		if(probabilities[i][0] === nodeId){
			neighbors.push(probabilities[i][1]);
		}
	}
	return neighbors;
}

/**
	This function checks that the tree
	created by the given data is a legal
	tree (i.e. no loops, bidirected edges)
*/
function checkTree(tree){

	//if odd number of probabilities the tree is not bidirected
	if(tree.edgeProbs.length%2 ===1){
		return "The edges must be bidirected";
	}

	//if any pair of nodes a b has a probability
	//from a to b it must have a probability from b to a
	//if not return false
	for(var i = 0; i < tree.edgeProbs.length; i++){

		//the starting and ending nodes
		//whose reverse we are looking for
		var startNode = tree.edgeProbs[i][0];
		var endNode = tree.edgeProbs[i][1];
		var pairExists = false;

		//loop through all the probabilities and find
		//the set that goes the other way
		for(var j = 0; j < tree.edgeProbs.length; j++){
			var otherStart = tree.edgeProbs[j][0];
			var otherEnd = tree.edgeProbs[j][1];

			//if we find the other direction the pair exists
			if(startNode === otherEnd && endNode === otherStart){
				pairExists = true;
			}
		}

		//if the pair does not exist the tree is not valid
		if(!pairExists){
			return "The edges must be bidirected";
		}
	}

	//make sure numNodes is correct
	if(tree.numNodes != tree.nodeList.length){
		return "numNodes must match the number of nodes in the nodeIds array";
	}

	//make sure every node has at least 1 neighbor
	for(var n = 0; n<tree.numNodes; n++){
		if(tree.nodeList[n].neighbors.length===0){
			return "Every node must have at least 1 neighbor";
		}
	}

	//make sure all probabilities are between 0 and 1
	for(var m = 0; m<tree.edgeProbs.length; m++){
		if(tree.edgeProbs[m][2]>1 || tree.edgeProbs[m][2]<0){
				return "The edge probabilities must be between 0 and 1";
		}
	}

	//make sure all nodes have coordinates
	for(var f = 0; f < tree.nodeList.length; f++){
		if(tree.nodeList[f].coordinates === null ||
			tree.nodeList[f].coordinates === undefined){
			return "All nodes must have coordinates listed";
		}
	}

	//check for loops
	//breadth first search should never see
	//the same node twice
	var visitedNodes = [];

	//queue holds an array of number pairs
	//the first number is the node id
	//the second is the id of the parent
	var queue = [ [tree.nodeList[0].nodeId, -1] ];
	while(visitedNodes.length < tree.nodeList.length){

		//get the first node in the queue
		var curNodeInfo = queue.pop();
		var curNode = curNodeInfo[0];
		var curNodeParent = curNodeInfo[1];

		//mark this node as visited
		visitedNodes.push(curNode.nodeId);

		//for all the neighbors of this node
		//check if any neighbors who are not the parent
		//of this node have already been visited
		//if a neighbor other than the parent has been visited
		//there is a cycle
		for(var l = 0; l < tree.getNodeById(curNode).neighbors.length; l++){
			
			//get a neighbor of the node
			var curNeighbor = tree.getNodeById(curNode).neighbors[l];

			//if the neighbor is not the parent and has been visited
			//the tree is not valid
			if(curNeighbor !== curNodeParent){
				if(curNeighbor in visitedNodes){
					return "There cannot be any cycles in the tree";
				}

				//if the node has not been visited add the neighbor
				//to the queue
				queue.push([tree.getNodeById(curNode).neighbors[l], 
					curNode]);
			}
		}

	}

	//if no cycles or 1 way edges are found
	//the tree is valid
	return "true";
}

/**
	This function creates a visual representation 
	of the tree
*/
function drawTree(tree){

	//get the canvas
	var c=document.getElementById("myCanvas");
	var ctx=c.getContext("2d");

	//draw all the edges
	for(var j = 0; j < tree.edgeProbs.length; j++){

		//get the nodes that belong to the edge
		var startNodeId = tree.edgeProbs[j][0];
		var startNode = tree.getNodeById(startNodeId);
		var endNodeId = tree.edgeProbs[j][1];
		var endNode = tree.getNodeById(endNodeId);

		//determine how the shift the edge so that
		//both directed edges are seen
		var shift = startNodeId > endNodeId ? 10 : -10;


		//draw a path from the starting node to the ending node
		ctx.beginPath();
		ctx.moveTo(startNode.coordinates[0]*75 + shift, startNode.coordinates[1]*75);
		ctx.lineTo(endNode.coordinates[0]*75 + shift, endNode.coordinates[1]*75);
		ctx.stroke();

		//find the distance between the nodes in the x and y directions
		var distX = startNode.coordinates[0]*75 + shift - endNode.coordinates[0]*75;
		var distY = startNode.coordinates[1]*75 - endNode.coordinates[1]*75;

		var shift2 = startNode.coordinates[0] > endNode.coordinates[0] ? 12 : -12;

		//write the probability next to the edge
		ctx.fillStyle = "#000000";
		ctx.font = "20px Georgia";
		ctx.fillText("" + tree.edgeProbs[j][2], 
			startNode.coordinates[0]*75 - distX/2 + shift*2 + shift2, 
			startNode.coordinates[1]*75 - distY/2 + shift*2);
	}

	//draw the nodes on the screen
	for(var i = 0; i < tree.numNodes; i++){

		ctx.fillStyle = "#7FFF00";

		//draw a circle for the node based on the coordinates given
		ctx.beginPath();
		ctx.arc(75*tree.nodeList[i].coordinates[0],
			75*tree.nodeList[i].coordinates[1],30,0,2*Math.PI);
		ctx.fill();

		//write the value of the node in the center
		ctx.fillStyle = "#000000";
		ctx.font = "20px Georgia";
		ctx.fillText("" + tree.nodeList[i].val, 
			75*tree.nodeList[i].coordinates[0]-5, 
			75*tree.nodeList[i].coordinates[1]);
	}

}

/**
	This function computes the value of the river network 
*/
function computeNetworkValue(tree, nodeA, nodeB){

	//alpha
	var alphaAB = computeAlphaVal(tree, nodeA, nodeB);
	var alphaBA = computeAlphaVal(tree, nodeB, nodeA);

	//beta
	var betaAB = computeBetaVal(tree, nodeA, nodeB);
	var betaBA = computeBetaVal(tree, nodeB, nodeA);

	//gamma


	//Display values on the screen

	//get the canvas
	var c=document.getElementById("myCanvas");
	var ctx=c.getContext("2d");

	ctx.fillStyle = "#000000";
	ctx.font = "20px Georgia";
	ctx.fillText("Node A is: " + nodeA.nodeId, 200, 500);
	ctx.fillText("Node B is: " + nodeB.nodeId, 200, 520);
	ctx.fillText("AlphaAB is: " + alphaAB, 200, 540);
	ctx.fillText("AlphaBA is: " + alphaBA, 200, 560);
	ctx.fillText("BetaAB is: " + betaAB, 200, 580);
	ctx.fillText("BetaBA is: " + betaBA, 200, 600);

}

/**
	Compute the alpha value for the network
*/
function computeAlphaVal(tree, node, parent){
	
	//if the node is a leaf node return the node val
	if(node.neighbors.length === 1 && 
		node.neighbors[0] === parent.nodeId){
		return node.val;
	}

	else{

		//alphaVal will be the value of the current node
		//plus the alpha values of all children * the probability
		//that a fish could swim from the child node to the current node
		alphaVal = node.val;
		for(var i = 0; i < node.neighbors.length; i++){
			if(node.neighbors[i] !== parent.nodeId){

				alphaVal += computeAlphaVal(tree, tree.getNodeById(node.neighbors[i]), 
					node)* tree.getDirectedProbabilityByIds (node.neighbors[i], 
						node.nodeId);
			}
		}
		return alphaVal;
	}
}

/**
	Compute the beta value for the network
*/
function computeBetaVal(tree, node, parent){

	//if the node is a leaf node return the node val
	if(node.neighbors.length === 1 && 
		node.neighbors[0] === parent.nodeId){
		return node.val;
	}

	else{

		//betaVal will be the value of the current node
		//plus the beta values of all children * the probability
		//that a fish could swim from the current node to the childe node
		betaVal = node.val;
		for(var i = 0; i < node.neighbors.length; i++){
			if(node.neighbors[i] !== parent.nodeId){

				betaVal += computeBetaVal(tree, tree.getNodeById(node.neighbors[i]), 
					node)* tree.getDirectedProbabilityByIds (node.nodeId, 
						node.neighbors[i]);
			}
		}
		return betaVal;
	}
}

/**
	Compute the gamma value for the network
*/
function computeGammaVal(tree, node, parent){

}

/**
	Tree class

	Each tree has a number of nodes, a list of nodes (of type node),
	and a 2-D array of the probability of a fish swimming from
	one node to another (probability of passing a barrier)
*/
function Tree(numNodes, nodeList, edgeProbs){

	//properties

	//number of nodes in the tree
	this.numNodes = numNodes;

	//list of nodes in the tree (of type Node)
	this.nodeList = nodeList;

	//2-D array of the different edge probabilities
	//edgeProbs[i] = [startNode, endNode, probability]
	//where i is some index, start node is the node where
	//the directed edge start, end node is the node where
	//the directed edge ends, and probability is between 0 and 1
	this.edgeProbs = edgeProbs;

	/**
		get the node associated with a given id
	*/
	this.getNodeById = function(theId){
		var node;
		for(var i = 0; i < this.numNodes; i++){
			if(this.nodeList[i].nodeId === theId){
				return nodeList[i];
			}
		}
		return null;
	}

	/**
		get the proability can go from idStart to idEnd
	*/
	this.getDirectedProbabilityByIds = function (idStart, idEnd){
		for(var i = 0; i < this.edgeProbs.length; i++){
			if(this.edgeProbs[i][0] === idStart &&
				this.edgeProbs[i][1] === idEnd){
				return this.edgeProbs[i][2];
			}
		}
	}
}

/**
	Node class

	A node has an id, a value, coordinates for the location
	on the screen, and a list of neighbor ids
*/
function Node(theId, val, coords, neighbors){

	//properties

	//id of the node
	this.nodeId = theId;

	//the value of the node
	this.val = val;

	//coordinates of the node (where it will be on the screen)
	this.coordinates = coords;

	//list of node ids that are the node's neighbors
	this.neighbors = neighbors;
}
