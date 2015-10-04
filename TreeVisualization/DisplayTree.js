var data = {
	numNodes : 4,
	nodeIds : [0, 1, 2, 3],
	vals : [3, 1, 1, 2],
	coords : [	
				[3,1],
				[2,3],
				[4,3],
				[5,5]
			 ],
	probBtwNodes : [
					[0, 1, 1],
					[1, 0, .5],
					[0, 2, .5],
					[2, 0, .25],
					[2, 3, 1],
					[3, 2, .5]
					]
};

/**
	This function reads in JSON data
	and creates a tree
*/
function readTree(){

	//create and array for all of the nodes in the tree
	var nodeList = [];
	var tempNode;
	for(var i = 0; i<data.numNodes; i++){
		tempNode = new Node(data.nodeIds[i], data.vals[i],
			data.coords[i], getNeighbors(data.probBtwNodes, data.nodeIds[i]));
		nodeList[i] = tempNode;
	}
	
	//create the tree from the given data
	var theTree = new Tree(data.numNodes, nodeList,
		data.probBtwNodes);

	//make sure the tree is valid
	if(checkTree(theTree)){

		//if the tree is valid draw it
		drawTree(theTree);
	}
	else{

		//if the tree is not valid show an alert message
		window.alert("the tree you provided was not valid");
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
		return false;
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
			return false;
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
					return false;
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
	return true;
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

		//write the probability next to the edge
		ctx.fillStyle = "#000000";
		ctx.font = "20px Georgia";
		ctx.fillText("" + tree.edgeProbs[j][2], 
			startNode.coordinates[0]*75 - distX/2 + shift*2, 
			startNode.coordinates[1]*75 - distY/2+ shift*2);
	}

	//draw the nodes on the screen
	for(var i = 0; i < tree.numNodes; i++){

		ctx.fillStyle = "#00A308";

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
	Tree class
*/
function Tree(numNodes, nodeList, edgeProbs){

	//properties
	this.numNodes = numNodes;
	this.nodeList = nodeList;
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
}

/**
	Node class
*/
function Node(theId, val, coords, neighbors){

	//properties
	this.nodeId = theId;
	this.val = val;
	this.coordinates = coords;
	this.neighbors = neighbors;
}
