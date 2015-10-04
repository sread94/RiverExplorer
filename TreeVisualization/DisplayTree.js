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
	var nodeList = [];
	var tempNode;
	for(var i = 0; i<data.numNodes; i++){
		tempNode = new Node(data.nodeIds[i], data.vals[i],
			data.coords[i]);
		nodeList[i] = tempNode;
	}
	
	var theTree = new Tree(data.numNodes, nodeList,
		data.probBtwNodes);
	drawTree(theTree);
}

/**
	This function checks that the tree
	created by the given data is a legal
	tree (i.e. no loops, bidirected edges)
*/
function checkTree(tree){

}

/**
	This function creates a visual representation 
	of the tree
*/
function drawTree(tree){
	var c=document.getElementById("myCanvas");
	var ctx=c.getContext("2d");
	ctx.fillStyle = "#00A308";

	for(var j = 0; j < tree.edgeProbs.length; j++){
		var startNodeId = tree.edgeProbs[j][0];
		var startNode = tree.getNodeById(startNodeId);
		var endNodeId = tree.edgeProbs[j][1];
		var endNode = tree.getNodeById(endNodeId);

		var shift = startNodeId > endNodeId ? 10 : -10;
		ctx.beginPath();
		ctx.moveTo(startNode.coordinates[0]*75 + shift, startNode.coordinates[1]*75);
		ctx.lineTo(endNode.coordinates[0]*75 + shift, endNode.coordinates[1]*75);
		ctx.stroke();

		var distX = startNode.coordinates[0]*75 + shift - endNode.coordinates[0]*75;
		var distY = startNode.coordinates[1]*75 - endNode.coordinates[1]*75;

		ctx.fillStyle = "#000000";
		ctx.font = "20px Georgia";
		ctx.fillText("" + tree.edgeProbs[j][2], 
			startNode.coordinates[0]*75 - distX/2 + shift*2, 
			startNode.coordinates[1]*75 - distY/2+ shift*2);
	}

	for(var i = 0; i < tree.numNodes; i++){
		ctx.fillStyle = "#00A308";
		ctx.beginPath();
		ctx.arc(75*tree.nodeList[i].coordinates[0],
			75*tree.nodeList[i].coordinates[1],30,0,2*Math.PI);
		ctx.fill();

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
	this.numNodes = numNodes;
	this.nodeList = nodeList;
	this.edgeProbs = edgeProbs;

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
function Node(theId, val, coords){
	this.nodeId = theId;
	this.val = val;
	this.coordinates = coords;
}
