//arrays to hold values for the dynamic programming algorithms
var alphaToParent = [];
var alphaFromParent = [];

var betaToParent = [];
var betaFromParent = [];

var gammaToParent = [];
var gammaFromParent = [];

/**
	This function reads in JSON data
	and creates a tree
*/
function readTree(){

	var data = test_tree;

	//assign node ids 0 through numNodes-1 for the dynamic
	//calculation of the network values

	//create and array for all of the nodes in the tree
	var nodeList = [];
	var tempNode;

	//create the root of the tree
	var theRoot =  new Node(data.numNodes - 1, data.nodeLabels[0], data.vals[0],
			data.coords[0], getNeighbors(data.probBtwNodes, data.nodeLabels[0]));

	nodeList[0] = theRoot;

	//create the other nodes of the tree
	for(var i = 1; i<data.nodeLabels.length; i++){
		var neighbors = getNeighbors(data.probBtwNodes, data.nodeLabels[i]);
		var nodeId = i - 1;
		tempNode = new Node(nodeId, data.nodeLabels[i], data.vals[i],
			data.coords[i], neighbors);
		nodeList[i] = tempNode;
	}

	//create the tree from the given data
	var theTree = new Tree(data.numNodes, nodeList,
		data.probBtwNodes, theRoot);

	//make sure the tree is valid
	var validTree = checkTree(theTree);

	if(validTree === "true"){

		//if the tree is valid draw it
		drawTree(theTree);
		addMouseEvents(theTree);
		computeNetworkValueGeneral(theTree);
	}
	else{

		//if the tree is not valid show an alert message
		window.alert(validTree);
	}
}

/**
	add mouse events
*/
function addMouseEvents(tree){


	var c=document.getElementById("myCanvas");
	var ctx=c.getContext("2d");

	//when the user clicks the canvas check if they clicked on an edge
	var mouseDownListener = function(event){ 
        var mouseDownX = event.pageX;
        var mouseDownY = event.pageY; 
        checkIfOnEdge(tree, mouseDownX, mouseDownY);
    };

    c.addEventListener("mousedown",mouseDownListener,false);

}

/**
	finds all the neighbors of a given node
	based on the data for the probability for
	moving between nodes
*/
function getNeighbors(probabilities, nodeLabel){
	var neighbors = [];

	//loop through all of the probabilities and find
	//where the given nodeId is the first one listed
	//and store the nodes the given node is connected to
	for(var i = 0; i < probabilities.length; i++){
		if(probabilities[i][0] === nodeLabel){
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
		return "numNodes must match the number of nodes in the nodeLabels array";
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
	var queue = [ [tree.nodeList[0].nodeId, -2] ];
	while(visitedNodes.length < tree.nodeList.length){

		//get the first node in the queue
		var curNodeInfo = queue.pop();
		var curNode = curNodeInfo[0];
		var curNodeParent = curNodeInfo[1];

		//mark this node as visited
		visitedNodes.push(curNode);

		//for all the neighbors of this node
		//check if any neighbors who are not the parent
		//of this node have already been visited
		//if a neighbor other than the parent has been visited
		//there is a cycle
		for(var l = 0; l < tree.getNodeById(curNode).neighbors.length; l++){
			
			//get a neighbor of the node
			var curNeighbor = tree.getNodeIdByLabel(tree.getNodeById(curNode).neighbors[l]);

			//if the neighbor is not the parent and has been visited
			//the tree is not valid
			if(curNeighbor !== curNodeParent){
				for(var p = 0; p < visitedNodes.length; p++){
					if(curNeighbor === visitedNodes[p]){
						return "There cannot be any cycles in the tree";
					}
				}

				//if the node has not been visited add the neighbor
				//to the queue
				queue.push([curNeighbor, curNode]);
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
		var startNode = tree.getNodeByLabel(tree.edgeProbs[j][0]);
		var startNodeId = startNode.nodeId;
		var endNode = tree.getNodeByLabel(tree.edgeProbs[j][1]);
		var endNodeId = endNode.nodeId;

		//determine how the shift the edge so that
		//both directed edges are seen
		var shift = startNodeId > endNodeId ? 10 : -10;

		//draw a path from the starting node to the ending node
		ctx.beginPath();
		ctx.moveTo(startNode.coordinates[0]*75 + shift, startNode.coordinates[1]*75);
		ctx.lineTo(endNode.coordinates[0]*75 + shift, endNode.coordinates[1]*75);
		ctx.stroke();

		//find the distance between the nodes in the x and y directions
		var distX = startNode.coordinates[0]*75 - endNode.coordinates[0]*75;
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
	when user clicks on the screen test if they clicked
	on an edge. If so, show the probablility of moving from
	one node to the other.
*/
function checkIfOnEdge(tree, xPos, yPos){

	for(var i = 0; i < tree.edgeProbs.length; i++){

		//get the nodes for the current node pair
		var node1 = tree.edgeProbs[i][0];
		var node2 = tree.edgeProbs[i][1];

		//find the coordinates
		var coord1 = tree.getNodeById(node1).coordinates;
		var coord2 = tree.getNodeById(node2).coordinates;

		//figure out how the line was shifted
		var shift = node1 > node2 ? 10 : -10;
		if(coord1[0] > coord2){
			shift += 20;
		}

		//find the distance between nodes
		var distBetweenNodes = Math.sqrt( 
			Math.pow(coord1[0]*75 - coord2[0]*75,2) 
			+ Math.pow(coord1[1]*75 - coord2[1]*75,2));

		//find the distance between 1 node and the clicked point
		//plus the distance from the clicked point and the second node
		var dist1ToClickTo2 = Math.sqrt(Math.pow(coord1[0]*75 + shift - xPos,2) 
			+ Math.pow(coord1[1]*75 - yPos,2)) 
			+ Math.sqrt(Math.pow(xPos - coord2[0]*75 - shift,2)
			+ Math.pow(yPos - coord2[1]*75,2));

		//if the user is close to the line show the probability that
		//that line represents
		var difference = dist1ToClickTo2 - distBetweenNodes;
		if(difference < 1 && difference > 0){
			window.alert("The probability of moving from " + node1 + 
				" to " + node2 + " is " + tree.edgeProbs[i][2]);
		}
	}

}

/**
	calculate the value of the river network
	based on the root
*/
function computeNetworkValueGeneral(tree){

	computeNetworkValueGeneral_AlphaValues(tree);
	computeNetworkValueGeneral_BetaValues(tree);
	computeNetworkValueGeneral_GammaValues(tree);

}

/**
	compute the alpha values of the network
*/
function computeNetworkValueGeneral_AlphaValues(tree){

	//declare the length of each of the alpha arrays
	alphaToParent.length = tree.numNodes -1;
	alphaFromParent.length = tree.numNodes - 1;

	//find all alpha values going from the leaf nodes up to the root
	for(var i = 0; i < tree.root.neighbors.length; i++){
		computeAlphaToParent(tree, tree.getNodeByLabel(tree.root.neighbors[i]),
			tree.root);
	}

	//find the alpha values the root sends to each child
	for(var j = 0; j < tree.root.neighbors.length; j++){
		computeAlphaFromRoot(tree, tree.getNodeByLabel(tree.root.neighbors[j]));
	}

	//find the alpha values parents send to the children
	for(var k = 0; k < tree.root.neighbors.length; k++){
		var curNode = tree.getNodeByLabel(tree.root.neighbors[k]);
		for(var m = 0; m < curNode.neighbors.length; m++){
			if(curNode.neighbors[m]!= tree.root.nodeLabel){
				computeAlphaFromParent(tree, tree.getNodeByLabel(curNode.neighbors[m]),
					tree.getNodeByLabel(tree.root.neighbors[k]), tree.root);
			}	
		}
	}

	//get the canvas
	var c=document.getElementById("myCanvas");
	var ctx=c.getContext("2d");

	//Display values on the screen
	ctx.fillStyle = "#000000";
	ctx.font = "20px Georgia";
	ctx.fillText("alphaToParent: " + alphaToParent, 150, 500);
	ctx.fillText("alphaFromParent: " + alphaFromParent, 150, 520);
}

/**
	Compute values for the alpha to parent array
	starting at the node, and caluclating the values
	of all neighbors, excluding the parent
*/
function computeAlphaToParent(tree, node, parent){

	//if the node is a leaf node return the node val
	if(node.neighbors.length === 1 && 
		tree.getNodeIdByLabel(node.neighbors[0]) === parent.nodeId){
		alphaToParent[node.nodeId] = node.val;
	} 
	else{
		//alpha value is the nodeValue
		//plus probability to traverse up tree
		//from each child times the alpha value
		//of the child
		alphaToParent[node.nodeId] = node.val;
		for(var i = 0; i < node.neighbors.length; i++){
			if(tree.getNodeIdByLabel(node.neighbors[i]) !== parent.nodeId){

				//recursively call the algorithm to calculate the alpha value
				//of the children
				computeAlphaToParent(tree, 
					tree.getNodeByLabel(node.neighbors[i]), 
					node);

				//get the child's alpha value
				alphaToParent[node.nodeId] += 
					alphaToParent[tree.getNodeIdByLabel(node.neighbors[i])]*
					tree.getDirectedProbabilityByIds (tree.getNodeIdByLabel(node.neighbors[i]), 
						node.nodeId);
			}
		}
	}
}

/**
	compute the alpha values going from the root
	to the given node
*/
function computeAlphaFromRoot(tree, node){

	//the value from the root to each of it's children
	//plus the alpha value of every other child up to the root
	//times the probablilty from child to root
	alphaFromParent[node.nodeId] = tree.root.val;
	for(var i = 0; i < tree.root.neighbors.length; i++){
		var curChild = tree.root.neighbors[i];

		//if the current child is not the node we are getting the
		//alpha value to then add the alpha from that child
		//to the root
		if(curChild != node.nodeLabel){
			var curChildIndex = tree.getNodeIdByLabel(curChild);
			alphaFromParent[node.nodeId] += alphaToParent[curChildIndex]
				*tree.getDirectedProbabilityByIds(
					curChildIndex, tree.root.nodeId);
		}
	}
}

/**
	compute the alpha values coming down the tree from
	the parent
*/
function computeAlphaFromParent(tree, node, parent, grandparent){

	//use the alphaFromParent value of the parent to calculate
	//the alpha value
	alphaFromParent[node.nodeId] = alphaFromParent[parent.nodeId]
		*tree.getDirectedProbabilityByIds(grandparent.nodeId, parent.nodeId)
		+ parent.val;

	for(var j = 0; j < parent.neighbors.length; j++){
		if(parent.neighbors[j] != node.nodeLabel && 
			parent.neighbors[j] != grandparent.nodeLabel){
			var curNodeId = tree.getNodeIdByLabel(parent.neighbors[j]);
			alphaFromParent[node.nodeId] += alphaToParent[curNodeId] *
				tree.getDirectedProbabilityByIds(curNodeId, parent.nodeId);
		}
	}

	//if it is a leaf node return
	if(node.neighbors.length === 1 && 
		tree.getNodeIdByLabel(node.neighbors[0]) === parent.nodeId){
		return;
	} 

	//else recursively call the function for all neighbors
	//who are not the parent
	else{
		for(var i = 0; i < node.neighbors.length; i++){
			if(node.neighbors[i] != parent.nodeLabel){
				computeAlphaFromParent(tree, 
					tree.getNodeByLabel(node.neighbors[i]), node, parent);
			}
		}
	}
}

/**
	compute the beta values of the network
*/
function computeNetworkValueGeneral_BetaValues(tree){

	//declare the length of each of the beta arrays
	betaToParent.length = tree.numNodes -1;
	betaFromParent.length = tree.numNodes - 1;


	//find all beta values going from the leaf nodes up to the root
	for(var i = 0; i < tree.root.neighbors.length; i++){
		computeBetaToParent(tree, tree.getNodeByLabel(tree.root.neighbors[i]),
			tree.root);
	}

	//find the beta values the root sends to each child
	for(var j = 0; j < tree.root.neighbors.length; j++){
		computeBetaFromRoot(tree, tree.getNodeByLabel(tree.root.neighbors[j]));
	}

	//find the beta values parents send to the children
	for(var k = 0; k < tree.root.neighbors.length; k++){
		var curNode = tree.getNodeByLabel(tree.root.neighbors[k]);
		for(var m = 0; m < curNode.neighbors.length; m++){
			if(curNode.neighbors[m]!= tree.root.nodeLabel){
				computeBetaFromParent(tree, tree.getNodeByLabel(curNode.neighbors[m]),
					curNode, tree.root);
			}
		}
	}

	//get the canvas
	var c=document.getElementById("myCanvas");
	var ctx=c.getContext("2d");

	//Display values on the screen
	ctx.fillStyle = "#000000";
	ctx.font = "20px Georgia";
	ctx.fillText("betaToParent: " + betaToParent, 150, 560);
	ctx.fillText("betaFromParent: " + betaFromParent, 150, 580);

}

/**
	Calculate the beta values from child to parent of the network 
	of the subtree, with the root of the subtree at the node
*/
function computeBetaToParent(tree, node, parent){

	//if the node is a leaf node return the node val
	if(node.neighbors.length === 1 && 
		tree.getNodeIdByLabel(node.neighbors[0]) === parent.nodeId){
		betaToParent[node.nodeId] = node.val;
	}
	else{

		//beta value is the nodeValue
		//plus probability to traverse down tree
		//to each child times the beta value
		//of the child
		betaToParent[node.nodeId] = node.val;
		for(var i = 0; i < node.neighbors.length; i++){
			if(tree.getNodeIdByLabel(node.neighbors[i]) !== parent.nodeId){

				//recursively call the algorithm to calculate the beta value
				//of the children
				computeBetaToParent(tree, tree.getNodeByLabel(node.neighbors[i]), 
					node);

				//get the child's beta value
				betaToParent[node.nodeId] += 
					betaToParent[tree.getNodeIdByLabel(node.neighbors[i])]*
					tree.getDirectedProbabilityByIds(node.nodeId, 
						tree.getNodeIdByLabel(node.neighbors[i]));
			}
		}
	}
}

/**
	compute the beta value from the root to each child
*/
function computeBetaFromRoot(tree, node){

	//the value from the root to each of it's children
	//plus the beta value of every other child up to the root
	//times the probablilty from root to child
	betaFromParent[node.nodeId] = tree.root.val;
	for(var i = 0; i < tree.root.neighbors.length; i++){
		var curChild = tree.root.neighbors[i];

		//if the current child is not the node we are getting the
		//beta value to then add the beta from that child
		//to the root
		if(curChild != node.nodeLabel){
			var curChildIndex = tree.getNodeIdByLabel(curChild);
			betaFromParent[node.nodeId] += betaToParent[curChildIndex]
				*tree.getDirectedProbabilityByIds(
					tree.root.nodeId,curChildIndex);
		}
	}
}

/**
	find the beta values from the parents to the children
*/
function computeBetaFromParent(tree, node, parent, grandparent){

	//use the betaFromParent value of the parent to calculate
	//the beta value
	betaFromParent[node.nodeId] = betaFromParent[parent.nodeId]
		*tree.getDirectedProbabilityByIds(parent.nodeId, grandparent.nodeId)
		+ parent.val;

	for(var j = 0; j < parent.neighbors.length; j++){
		if(parent.neighbors[j] != node.nodeLabel && 
			parent.neighbors[j] != grandparent.nodeLabel){
			var curNodeId = tree.getNodeIdByLabel(parent.neighbors[j]);
			betaFromParent[node.nodeId] += betaToParent[curNodeId] *
				tree.getDirectedProbabilityByIds(parent.nodeId, curNodeId);
		}
	}

	//if it is a leaf node return
	if(node.neighbors.length === 1 && 
		tree.getNodeIdByLabel(node.neighbors[0]) === parent.nodeId){
		return;
	} 

	//else recursively call the function for all neighbors
	//who are not the parent
	else{
		for(var i = 0; i < node.neighbors.length; i++){
			if(node.neighbors[i] != parent.nodeLabel){
				computeBetaFromParent(tree, 
					tree.getNodeByLabel(node.neighbors[i]), node);
			}
		}
	}
}

/**
	Calculate the gamma values to and from the parent
	for each node
*/
function computeNetworkValueGeneral_GammaValues(tree){

	//declare the length of each of the gamma arrays
	gammaToParent.length = tree.numNodes - 1;
	gammaFromParent.length = tree.numNodes - 1;


	//find all gamma values going from the leaf nodes up to the root
	for(var i = 0; i < tree.root.neighbors.length; i++){
		computeGammaToParent(tree, tree.getNodeByLabel(tree.root.neighbors[i]),
			tree.root);
	}

	//find the gamma values the root sends to each child
	for(var j = 0; j < tree.root.neighbors.length; j++){
		computeGammaFromRoot(tree, tree.getNodeByLabel(tree.root.neighbors[j]));
	}

	//find the gamma values parents send to the children
	for(var k = 0; k < tree.root.neighbors.length; k++){
		var curNode = tree.getNodeByLabel(tree.root.neighbors[k]);
		for(var m = 0; m < curNode.neighbors.length; m++){
			if(curNode.neighbors[m]!= tree.root.nodeLabel){
				computeGammaFromParent(tree, tree.getNodeByLabel(curNode.neighbors[m]),
					curNode, tree.root);
			}
		}
	}

	//get the canvas
	var c=document.getElementById("myCanvas");
	var ctx=c.getContext("2d");

	//Display values on the screen
	ctx.fillStyle = "#000000";
	ctx.font = "20px Georgia";
	ctx.fillText("gammaToParent: " + gammaToParent, 150, 620);
	ctx.fillText("gammaFromParent: " + gammaFromParent, 150, 640);
}

/**
	Compute the gamma value for the network using
	dynamic programming
*/
function computeGammaToParent(tree, node, parent){

	//if the node is a leaf node return the node val
	if(node.neighbors.length === 1 && 
		tree.getNodeIdByLabel(node.neighbors[0]) === parent.nodeId){
		gammaToParent[node.nodeId] = node.val*node.val;
	}

	else{

		//gamma is all the paths in the subtree where
		//node is the root, excluding the parent
		//This means gamma is the sum of:
		//alpha (all paths from within the tree to the root)
		//beta (all paths from the root down to another node)
		//paths from one node to another in the tree, passing
		//through the root
		//gamma of all subtrees (where the roots of those
		//trees are the children of the current root)
		gammaToParent[node.nodeId] = node.val * alphaToParent[node.nodeId];
		gammaToParent[node.nodeId] += node.val * betaToParent[node.nodeId];
		gammaToParent[node.nodeId] -= node.val * node.val;

		for(var i = 0; i < node.neighbors.length; i++){
			if(tree.getNodeIdByLabel(node.neighbors[i]) !== parent.nodeId){

				for(var j = 0; j< node.neighbors.length; j++){
					if(i !== j && 
						tree.getNodeIdByLabel(node.neighbors[j]) !== parent.nodeId){

					//find the probability going from the ith to the jth subtree
					gammaToParent[node.nodeId] += 
						alphaToParent[tree.getNodeIdByLabel(node.neighbors[i])] *	
						tree.getDirectedProbabilityByIds(
							tree.getNodeIdByLabel(node.neighbors[i]),
							node.nodeId) * 
						tree.getDirectedProbabilityByIds(node.nodeId, 
							tree.getNodeIdByLabel(node.neighbors[j])) *
						betaToParent[tree.getNodeIdByLabel(node.neighbors[j])];			
					}
				}

				//find the gamma value of node i
				computeGammaToParent(tree, tree.getNodeByLabel(node.neighbors[i]), 
					node);

				//gamma of this node depends on gamma of the children
				gammaToParent[node.nodeId] += gammaToParent[tree.getNodeIdByLabel(node.neighbors[i])];
			}
		}
	}
}

/**
	Compute the gamma value from the root to each of the root's children
*/
function computeGammaFromRoot(tree, node){

	//if the root only has 1 neighbor
	//then gammaFromRoot is the root value squared
	if(tree.root.neighbors.length === 1){
		gammaFromParent[node.nodeId] = tree.root.val*tree.root.val;
		return;
	}

	gammaFromParent[node.nodeId] = 0;


	//alpha from parent
	var alphaVal = tree.root.val;

	//beta from parent
	var betaVal = tree.root.val;

	//loop through all children and find all paths from a node in
	//one subtree to a node in another
	for(var i = 0; i < tree.root.neighbors.length; i++){
		var curChild = tree.root.neighbors[i];

		//exclude node when calculating the gammaToRoot value
		if(curChild != node.nodeLabel){
			var curChildIndex = tree.getNodeIdByLabel(curChild);

			//add the gammaToParent value for each neighbor
			gammaFromParent[node.nodeId] += gammaToParent[curChildIndex];

			alphaVal += alphaToParent[curChildIndex] *
				tree.getDirectedProbabilityByIds(curChildIndex, tree.root.nodeId);

			betaVal += betaToParent[curChildIndex] *
				tree.getDirectedProbabilityByIds(tree.root.nodeId, curChildIndex);

			for(var j = 0; j < tree.root.neighbors.length; j++){
				var secondChild = tree.root.neighbors[j];

				//when calculating paths from one child of the root to another
				//make sure both children are unique
				if(i != j && secondChild != node.nodeLabel){
					var secondChildIndex = tree.getNodeIdByLabel(secondChild);

					gammaFromParent[node.nodeId] += alphaToParent[curChildIndex]*
						tree.getDirectedProbabilityByIds(curChildIndex, tree.root.nodeId)*
						tree.getDirectedProbabilityByIds(tree.root.nodeId, secondChildIndex)*
						betaToParent[secondChildIndex];

				}
			}
		}
	}

	//add the alphaFromRoot plus betaFromRoot for the given node
	//plus the root value squared
	gammaFromParent[node.nodeId] += tree.root.val * alphaVal +
		tree.root.val * betaVal - tree.root.val*tree.root.val;
}

/**
	compute the gamma value from the parent to the child node
*/
function computeGammaFromParent(tree, node, parent, grandparent){

	//use betaFromParent
	gammaFromParent[node.nodeId] = 0;

	//alpha value will be a combination of alpha from parent of the parent
	//alpha values of all children of the parent excluding node
	//and the parent value
	var alphaVal = parent.val + 
		tree.getDirectedProbabilityByIds(grandparent.nodeId, parent.nodeId)*
		alphaFromParent[parent.nodeId];

	//beta value will be a combination of beta from parent of the parent
	//beta values of all children of the parent excluding node
	//and the parent value
	var betaVal = parent.val + 
		tree.getDirectedProbabilityByIds(parent.nodeId, grandparent.nodeId)*
		betaFromParent[parent.nodeId];

	//start in another child of parent and end in another child of the parent
	for(var j = 0; j < parent.neighbors.length; j++){
		if(parent.neighbors[j] != node.nodeLabel && 
			parent.neighbors[j] != grandparent.nodeLabel){

			var curNodeId = tree.getNodeIdByLabel(parent.neighbors[j]);
			
			//add the gamma value of all subtrees rooted at the children
			//of parent (excluding node)
			gammaFromParent[node.nodeId] += gammaToParent[curNodeId];

			//find the paths between all sets of children of parent
			//excluding paths into or out of node
			for(var k = 0; k <parent.neighbors.length; k++){
				if(parent.neighbors[k] != node.nodeLabel && 
					parent.neighbors[k] != grandparent.nodeLabel && j != k){
			
					var secondNodeId = tree.getNodeIdByLabel(parent.neighbors[k]);

					gammaFromParent[node.nodeId] += alphaToParent[curNodeId]*
						tree.getDirectedProbabilityByIds(curNodeId, parent.nodeId)*
						tree.getDirectedProbabilityByIds(parent.nodeId, secondNodeId)*
						betaToParent[secondNodeId];
				}
			}

			//add the beta value from the child to the parent
			betaVal += betaToParent[curNodeId] *
				tree.getDirectedProbabilityByIds(parent.nodeId, curNodeId);

			//add the alpha value from the child to the parent
			alphaVal += alphaToParent[curNodeId]*
				tree.getDirectedProbabilityByIds(curNodeId, parent.nodeId);

			//start in a child of the parent an end in the grandparent
			gammaFromParent[node.nodeId] += alphaToParent[curNodeId]*
				tree.getDirectedProbabilityByIds(curNodeId, parent.nodeId)*
				tree.getDirectedProbabilityByIds(parent.nodeId, grandparent.nodeId)*
				betaFromParent[parent.nodeId];

			//start in the grandparent and end in the grandparent
			gammaFromParent[node.nodeId] += alphaFromParent[parent.nodeId]*
				tree.getDirectedProbabilityByIds(grandparent.nodeId, parent.nodeId)*
				tree.getDirectedProbabilityByIds(parent.nodeId, curNodeId)*
				betaToParent[curNodeId];
		}
	}

	//add the gamma value from the parent
	//parent value * the beta value
	//parent value * the alpha value
	//minus parent value * parent value
	gammaFromParent[node.nodeId] += gammaFromParent[parent.nodeId] 
		- parent.val*parent.val + parent.val * betaVal
		+ parent.val*alphaVal;

	//if node has no children return
	if(node.neighbors.length === 1 && 
		tree.getNodeIdByLabel(node.neighbors[0]) === parent.nodeId){
		return;
	} 

	//recursively call the function to calculate gammaFromParent
	//for all nodes
	for(var i = 0; i < node.neighbors.length; i++){
		if(node.neighbors[i] != parent.nodeLabel){
			computeGammaFromParent(tree, 
				tree.getNodeByLabel(node.neighbors[i]), node, parent);
		}
	}
}

/**
	Tree class

	Each tree has a number of nodes, a list of nodes (of type node),
	and a 2-D array of the probability of a fish swimming from
	one node to another (probability of passing a barrier)
*/
function Tree(numNodes, nodeList, edgeProbs, root){

	//properties

	//number of nodes in the tree
	this.numNodes = numNodes;

	//list of nodes in the tree (of type Node)
	this.nodeList = nodeList;

	this.root = root;

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
		get the node associated with a given label
	*/
	this.getNodeByLabel = function(theLabel){
		var node;
		for(var i = 0; i < this.numNodes; i++){
			if(this.nodeList[i].nodeLabel === theLabel){
				return nodeList[i];
			}
		}
		return null;
	}

	/**
		get the node id associated with a given label
	*/
	this.getNodeIdByLabel = function(theLabel){
		for(var i = 0; i < this.numNodes; i++){
			if(this.nodeList[i].nodeLabel === theLabel){
				return nodeList[i].nodeId;
			}
		}
		return null;
	}
	/**
		get the node label for the node based on the node id
	*/
	this.getNodeLabelById = function(theId){
		for(var i = 0; i < this.numNodes; i++){
			if(this.nodeList[i].nodeId === theId){
				return nodeList[i].nodeLabel;
			}
		}
		return null;
	}

	/**
		get the proability can go from idStart to idEnd
	*/
	this.getDirectedProbabilityByIds = function (idStart, idEnd){
		var labelStart = this.getNodeLabelById(idStart);
		var labelEnd = this.getNodeLabelById(idEnd);
		for(var i = 0; i < this.edgeProbs.length; i++){
			if(this.edgeProbs[i][0] === labelStart &&
				this.edgeProbs[i][1] === labelEnd){
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
function Node(theId, theLabel, val, coords, neighbors){

	//properties

	//id of the node
	this.nodeId = theId;

	//label on the node
	this.nodeLabel = theLabel;

	//the value of the node
	this.val = val;

	//coordinates of the node (where it will be on the screen)
	this.coordinates = coords;

	//list of node ids that are the node's neighbors
	this.neighbors = neighbors;
}
