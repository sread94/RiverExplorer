//arrays to hold values for the dynamic programming algorithms
var alphaToParent = [];
var alphaFromParent = [];

var betaToParent = [];
var betaFromParent = [];

var gammaToParent = [];
var gammaFromParent = [];

var parentId = [];


//the current tree
var riverNetwork;

//json representing flow in and out and total network value
var networkInfo;

var totalNetworkValue;

//True if UI is displaying flow in valuse
var showFlowIn = true;

//UI data
var svg;
var radius;
var data;

//for total network value calculation
var parentForCalc = "a";
var childForCalc = "b";

//d3 tree json
var root;

/*****DATA TYPES*****/

/**
	Tree class

	Each tree has a number of nodes, a list of nodes (of type node),
	and a 2-D array of the probability of a fish swimming from
	one node to another (probability of passing a barrier)
*/
function Tree(numNodes, nodeList, nodeHash, edgeProbs, root){

	//properties

	//number of nodes in the tree
	this.numNodes = numNodes;

	//list of nodes in the tree (of type Node)
	this.nodeList = nodeList;

	this.nodeHash = nodeHash;

	this.root = root;

	//2-D array of the different edge probabilities
	//edgeProbs[i] = [startNode, endNode, probability]
	//where i is some index, start node is the node where
	//the directed edge start, end node is the node where
	//the directed edge ends, and probability is between 0 and 1
	this.edgeProbs = edgeProbs;

	//transform edgeProbs into a matrix
	this.newEdgeProbs = new Array(edgeProbs.length);

	this.createNewEdgeProbs = function(){
		for(var i = 0; i < edgeProbs.length; i++){
			this.newEdgeProbs[i] = new Array(edgeProbs.length);
		}
		for(var i = 0; i < edgeProbs.length; i++){
			var first = edgeProbs[i][0];
			var second = edgeProbs[i][1];
			var third = edgeProbs[i][2];
			this.newEdgeProbs[this.nodeHash[first].nodeId][this.nodeHash[second].nodeId] = third;
		}
	}

	this.createNewEdgeProbs();

	/**
		get the node associated with a given id
	*/
	this.getNodeById = function(theId){
		return nodeList[theId];
	}

	/**
		get the node associated with a given label
	*/
	this.getNodeByLabel = function(theLabel){
		return nodeHash[theLabel];
	}

	/**
		get the node id associated with a given label
	*/
	this.getNodeIdByLabel = function(theLabel){
		return nodeHash[theLabel].nodeId;
	}
	/**
		get the node label for the node based on the node id
	*/
	this.getNodeLabelById = function(theId){
		return nodeList[theId].nodeLabel;
	}

	/**
		get the proability can go from idStart to idEnd
	*/
	this.getDirectedProbabilityByIds = function (idStart, idEnd){
		return this.newEdgeProbs[idStart][idEnd];
	}

	/**
	* update the correct edges given the barrier id
	* and values in each direction
	*/
	this.updateEdgeValues = function(id, upstream, downstream){
		//user cannot change the values of the non-barrier edges
		if(id == -1){
			return;
		}
		for(var i = 0; i < this.edgeProbs.length; i++){
			if(edgeProbs[i][3] == id){
				edgeProbs[i][2] = upstream;
				edgeProbs[i+1][2] = downstream;
				this.createNewEdgeProbs();
				return;
			}
		}
	}

	/**
	* Get the id for the barrier that connects
	* idStart and idEnd
	*/
	this.getBarrierId = function(idStart, idEnd){
		if(idStart==null || idEnd == null){
			return;
		}
		for(var i = 0; i < this.edgeProbs.length; i++){
			if(edgeProbs[i][0] == idStart && edgeProbs[i][1]==idEnd){
				return edgeProbs[i][3];
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

	//list of node labels that are the node's neighbors
	this.neighbors = neighbors;

}


/*****CREATE TREE*****/

/**
	This function reads in JSON data
	and creates a tree
*/
function readTree(){

	//assign node ids 0 through numNodes-1 for the dynamic
	//calculation of the network values

	//create and array for all of the nodes in the tree
	var nodeList = [];
	var nodeHash = {};
	var tempNode;

	//create the root of the tree
	var theRoot =  new Node(data.numNodes - 1, data.nodeLabels[0], data.vals[0],
			data.coords[0], getNeighbors(data.probBtwNodes, data.nodeLabels[0]));

	nodeList[data.numNodes - 1] = theRoot;
	nodeHash[theRoot.nodeLabel] = theRoot;

	//create the other nodes of the tree
	for(var i = 1; i<data.nodeLabels.length; i++){
		var neighbors = getNeighbors(data.probBtwNodes, data.nodeLabels[i]);
		var nodeId = i - 1;
		tempNode = new Node(nodeId, data.nodeLabels[i], data.vals[i],
			data.coords[i], neighbors);
		nodeHash[tempNode.nodeLabel] = tempNode;
		nodeList[nodeId] = tempNode;
	}

	//create the tree from the given data
	var theTree = new Tree(data.numNodes, nodeList, nodeHash,
		data.probBtwNodes, theRoot);

	//make sure the tree is valid
	var validTree = checkTree(theTree);


	if(validTree === "true"){
		
		riverNetwork = theTree;
		computeNetworkValueGeneral(theTree);

		//create the new d3 tree
		root = JSON.parse(createD3Tree(null,riverNetwork.root));
	}
	else{

		//if the tree is not valid show an alert message
		window.alert(validTree);
	}
}

/**
* create the d3 json representation of the current river network
*/
function createD3Tree(parent, node){
	var neighbors = node.neighbors;
	var children = [];
	var numChildren = 0;
	for(var i = 0; i < neighbors.length; i++){
		if(parent == null || neighbors[i] != parent.nodeLabel){
			children[numChildren] = neighbors[i];
			numChildren++;
		}
	}
	if(numChildren == 0){
		return "{\"name\":\""+node.nodeLabel+"\", \"value\":" 
			+ node.val + ",\"flowInto\":" 
			+ getFlowInto(node.nodeLabel) +",\"flowOut\":" 
			+ getFlowOut(node.nodeLabel)+"}";
	}
	else{
		var json = "{\"name\":\""+node.nodeLabel+"\", \"value\":" 
			+ node.val + ",\"flowInto\":" 
			+ getFlowInto(node.nodeLabel) +",\"flowOut\":" 
			+ getFlowOut(node.nodeLabel) + ",";
		json += "\"children\":[";
		for(var i = 0; i<numChildren; i++){
			json += createD3Tree(node, riverNetwork.getNodeByLabel(children[i]));
			if(i != numChildren-1){
				json +=",";
			}
		}
		json += "]}";
	}
	return json;
}

/**
	get the flow into value for the specified node
	from the network info
*/
function getFlowInto(nodeLabel){
	var flowIntoArr = networkInfo.flowInto;
	for(var i = 0; i < flowIntoArr.length; i++){
		if(flowIntoArr[i][0] == nodeLabel){
			return flowIntoArr[i][1];
		}
	}
}

/**
	get the flow out value for the specified node
	from the network info
*/
function getFlowOut(nodeLabel){
	var flowOutArr = networkInfo.flowOut;
	for(var i = 0; i < flowOutArr.length; i++){
		if(flowOutArr[i][0] == nodeLabel){
			return flowOutArr[i][1];
		}
	}
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
				window.alert("m is: " + m + " and node id is: " + tree.edgeProbs[m][3]);
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

/*****COMPUTE ALPHA, BETA, GAMMA*****/

/**
	calculate the value of the river network
	based on the root
*/
function computeNetworkValueGeneral(tree){

	computeNetworkValueGeneral_AlphaValues(tree);

	computeNetworkValueGeneral_BetaValues(tree);

	computeNetworkValueGeneral_GammaValues(tree);

	totalNetworkValue = computeTotalNetworkValue(tree, childForCalc, parentForCalc);

	networkInfo = JSON.parse(getNetworkInformation());

}

function computeNetworkValueAtRoot(iId, iAlpha, iBeta, iGamma, childIds, childAlphas, childBetas, childGammas){

	var root = riverNetwork.root;
	var networkValue = 0;

	var rootBeta = root.val;
	for(var i = 0; i<childIds.length; i++){
		rootBeta += riverNetwork.getDirectedProbabilityByIds(root.nodeId, childIds[i])*childBetas[i];
	}

	var rootAlpha = root.val;
	for(var i = 0; i<childIds.length; i++){
		rootAlpha += riverNetwork.getDirectedProbabilityByIds(childIds[i], root.nodeId)*childAlphas[i];
	}

	var rootGamma = root.val*rootBeta + root.val*rootAlpha - root.val*root.val;
	for(var i = 0; i<childIds.length; i++){
		rootGamma += childGammas[i];
	}

	networkValue += iGamma;
	networkValue += iAlpha*riverNetwork.getDirectedProbabilityByIds(iId, root.nodeId)*rootBeta;
	networkValue += iBeta* riverNetwork.getDirectedProbabilityByIds(root.nodeId, iId)*rootAlpha;
	networkValue += rootGamma;
	return networkValue;
}

/**
	compute the alpha values of the network
*/
function computeNetworkValueGeneral_AlphaValues(tree){

	//calculate the alpha to parent values of the whole tree
	computeAlphaToParent(tree, tree.root, -1);

	//cut off the calculation alpha to parent of the root
	alphaToParent.length = tree.numNodes -1;

	//find the alpha values the root sends to each child
	computeAlphaFromParent(tree);

	//cut off the calculation alpha from parent of the root
	alphaFromParent.length = tree.numNodes - 1;

}

/**
	Compute values for the alpha to parent array
	starting at the node, and caluclating the values
	of all neighbors, excluding the parent
*/
function computeAlphaToParent(tree, node, parent){

	parentId[node.nodeId] = parent.nodeId;
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
	Compute the alpha values for the tree from the parent
*/
function computeAlphaFromParent(tree){

	//loop through all children of the root
	for(var j = 0; j < tree.root.neighbors.length; j++){

		//calculate the alpha from parent for all children of the root
		computeAlphaFromRoot(tree, tree.getNodeByLabel(tree.root.neighbors[j]));
		var curNode = tree.getNodeByLabel(tree.root.neighbors[j]);

		//loop through the children of the current node
		for(var m = 0; m < curNode.neighbors.length; m++){
			if(curNode.neighbors[m]!= tree.root.nodeLabel){
				
				//calculate the child's alpha value
				computeAlphaFromChildOfRoot(tree, tree.getNodeByLabel(curNode.neighbors[m]),
					curNode, tree.root);
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
function computeAlphaFromChildOfRoot(tree, node, parent, grandparent){

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
				computeAlphaFromChildOfRoot(tree, 
					tree.getNodeByLabel(node.neighbors[i]), node, parent);
			}
		}
	}
}

/**
	compute the beta values of the network
*/
function computeNetworkValueGeneral_BetaValues(tree){

	//find all beta values going from the leaf nodes up to the root
	computeBetaToParent(tree, tree.root, -1);

	//do not include root beta to parent value
	betaToParent.length = tree.numNodes -1;

	//find all beta values from parent
	computeBetaFromParent(tree);

	//do not include root beta from parent value
	betaFromParent.length = tree.numNodes - 1;

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

function computeBetaFromParent(tree){

	//find the beta values the root sends to each child
	for(var j = 0; j < tree.root.neighbors.length; j++){
		computeBetaFromRoot(tree, tree.getNodeByLabel(tree.root.neighbors[j]));
		var curNode = tree.getNodeByLabel(tree.root.neighbors[j]);
		for(var m = 0; m < curNode.neighbors.length; m++){
			if(curNode.neighbors[m]!= tree.root.nodeLabel){
				computeBetaFromChildOfRoot(tree, tree.getNodeByLabel(curNode.neighbors[m]),
					curNode, tree.root);
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
function computeBetaFromChildOfRoot(tree, node, parent, grandparent){

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
				computeBetaFromChildOfRoot(tree, 
					tree.getNodeByLabel(node.neighbors[i]), node, parent);
			}
		}
	}
}

/**
	Calculate the gamma values to and from the parent
	for each node
*/
function computeNetworkValueGeneral_GammaValues(tree){

	//find all gamma values going from the leaf nodes up to the root
	computeGammaToParent(tree, tree.root, -1);

	//exclude the root value from the gamma array
	gammaToParent.length = tree.numNodes - 1;

	//compute gamma from parent values
	computeGammaFromParent(tree);

	//exclude gamma from parent for the root
	gammaFromParent.length = tree.numNodes - 1;
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

function computeGammaFromParent(tree){
	//find the gamma values the root sends to each child
	for(var j = 0; j < tree.root.neighbors.length; j++){
		computeGammaFromRoot(tree, tree.getNodeByLabel(tree.root.neighbors[j]));
		var curNode = tree.getNodeByLabel(tree.root.neighbors[j]);
		for(var m = 0; m < curNode.neighbors.length; m++){
			if(curNode.neighbors[m]!= tree.root.nodeLabel){
				computeGammaFromChildOfRoot(tree, tree.getNodeByLabel(curNode.neighbors[m]),
					curNode, tree.root);
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

	//loop through all children and find all paths from a node in
	//one subtree to a node in another
	for(var i = 0; i < tree.root.neighbors.length; i++){
		var curChild = tree.root.neighbors[i];

		//exclude node when calculating the gammaToRoot value
		if(curChild != node.nodeLabel){
			var curChildIndex = tree.getNodeIdByLabel(curChild);

			//add the gammaToParent value for each neighbor
			gammaFromParent[node.nodeId] += gammaToParent[curChildIndex];

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
	gammaFromParent[node.nodeId] += tree.root.val * alphaFromParent[node.nodeId] +
		tree.root.val * betaFromParent[node.nodeId] - tree.root.val*tree.root.val;
}

/**
	compute the gamma value from the parent to the child node
*/
function computeGammaFromChildOfRoot(tree, node, parent, grandparent){

	//use betaFromParent
	gammaFromParent[node.nodeId] = 0;

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
	//parent value * beta from parent
	//parent value * alpha from parent
	//minus parent value * parent value
	gammaFromParent[node.nodeId] += gammaFromParent[parent.nodeId] 
		- parent.val*parent.val + parent.val * betaFromParent[node.nodeId]
		+ parent.val*alphaFromParent[node.nodeId];

	//if node has no children return
	if(node.neighbors.length === 1 && 
		tree.getNodeIdByLabel(node.neighbors[0]) === parent.nodeId){
		return;
	} 

	//recursively call the function to calculate gammaFromParent
	//for all nodes
	for(var i = 0; i < node.neighbors.length; i++){
		if(node.neighbors[i] != parent.nodeLabel){
			computeGammaFromChildOfRoot(tree, 
				tree.getNodeByLabel(node.neighbors[i]), node, parent);
		}
	}
}

/**
	Calculate the total value of the river network given a pair
	of nodes. The pair must be a child and a parent and must
	be given in the correct order.

	No matter the child-parent pair the value of the network
	will be the same.

	The total value is printed to the screen then returned
*/
function computeTotalNetworkValue(tree, child, parent){

	//find the probability from going from child to parent
	//and parent to child
	var childToParent = tree.getDirectedProbabilityByIds(tree.getNodeIdByLabel(child), tree.getNodeIdByLabel(parent));
	var parentToChild = tree.getDirectedProbabilityByIds(tree.getNodeIdByLabel(parent), tree.getNodeIdByLabel(child));

	//calculate the value of the network
	//gamma of each subtree
	//plus the paths starting in the child's subtree and ending
	//in the parent's subtree
	//plust the paths starting in the parent's subtree and ending
	//in the child's subtree
	var childID = tree.getNodeIdByLabel(child);

	var totalVal = gammaToParent[childID] + gammaFromParent[childID] +
		alphaToParent[childID]*childToParent*betaFromParent[childID] +
		alphaFromParent[childID]*parentToChild*betaToParent[childID];

	return totalVal;
}



/********* UPDATE NETWORK **********/

/**
	return the new network value, a list of flow into values for each barrier,
	and a list of flow out value for each barrier
*/
function getNetworkInformation(){
	var JSON = "{\"networkValue\": " + totalNetworkValue
		+ ",\n\"flowInto\": [";

	var rootFlowInto = riverNetwork.root.val;
	for(var i = 0; i < riverNetwork.root.neighbors.length; i++){
		var curNode = riverNetwork.getNodeIdByLabel(riverNetwork.root.neighbors[i]);
		rootFlowInto += alphaToParent[curNode]
			* riverNetwork.getDirectedProbabilityByIds(curNode,riverNetwork.root.nodeId);
	}

	JSON+="[\"" + riverNetwork.root.nodeLabel + "\"," + rootFlowInto + "],";

	for(var i = 0; i<riverNetwork.numNodes -1; i++){
		var curAlphaVal = alphaToParent[i] + alphaFromParent[i]*
			riverNetwork.getDirectedProbabilityByIds(parentId[i],i);
		var curLabel = riverNetwork.getNodeLabelById(i);
		JSON+= "[\"" + curLabel + "\","+ curAlphaVal+"]";
		if(i!=riverNetwork.numNodes -2){
			JSON += ",";
		}
	}

	var rootFlowOut = riverNetwork.root.val;
	for(var i = 0; i < riverNetwork.root.neighbors.length; i++){
		var curNode = riverNetwork.getNodeIdByLabel(riverNetwork.root.neighbors[i]);
		rootFlowOut += betaToParent[curNode]
			* riverNetwork.getDirectedProbabilityByIds(riverNetwork.root.nodeId, curNode);
	}

	JSON += "],\n\"flowOut\": [";

	JSON +="[\"" + riverNetwork.root.nodeLabel + "\"," + rootFlowOut + "],";

	for(var i = 0; i<riverNetwork.numNodes -1; i++){
		var curBetaVal = betaToParent[i] + betaFromParent[i]*
			riverNetwork.getDirectedProbabilityByIds(i, parentId[i]);
		var curLabel = riverNetwork.getNodeLabelById(i);
		JSON+= "[\"" + curLabel + "\","+ curBetaVal+"]";
		if(i!=riverNetwork.numNodes -2){
			JSON += ",";
		}
	}

	JSON += "]}";

	return JSON;
}

/*****UI FUNCTIONS*****/

/**
	Remove all elements of the tree from the canvas
*/

/**
	draw the tree and display the network values
*/
function drawUI(){
	drawTree();
	document.getElementById("totalnetworkval").textContent = "Total Network Value: " + totalNetworkValue;
}

/**
	This function creates a visual representation 
	of the tree
*/
function drawTree(){
	
	// Create the SVG element
	var width = 300;
	var height = 300;
	var margin = 40;

	svg = d3.select("h2").append("svg")
	    .attr("width", width + 2*margin)
	    .attr("height", height + 2*margin)
	  .append("g")
	    .attr("transform", "translate(" + margin + "," + margin + ")");

	// Create the diagonal path generator
	var diagonal = d3.svg.diagonal()
	    .projection(function(d) { return [d.y, d.x]; });

	// Create the tree

	var tree = d3.layout.tree().size([height, width]);
	var nodes = tree.nodes(root);
	var links = tree.links(nodes);

	var layerOffset = 100;

	// Set y position of nodes based on their depth
	nodes.forEach(function(d) { d.y = d.depth * layerOffset; });

	var edge = svg.selectAll(".edge")
	    .data(links)
	  .enter().append("line")
	    .attr("class", "edge")
	    .attr("x1", function(d) { return d.source.y; })
	    .attr("y1", function(d) { return d.source.x; })
	    .attr("x2", function(d) { return d.target.y; })
	    .attr("y2", function(d) { return d.target.x; });

	var edgeLabel = svg.selectAll(".edgelabel")
	    .data(links)
	  .enter().append("text")
	    .attr("class", "edgelabel")
	    .attr("dx", function(d) { return (d.source.y + d.target.y)/2; })
	    .attr("dy", function(d) { return (d.source.x + d.target.x)/2; })
	    .attr("text-anchor", "middle")
	    .text( function(d) { 
	    	var source = riverNetwork.getNodeIdByLabel(d.source.name);
	    	var target = riverNetwork.getNodeIdByLabel(d.target.name);
	    	var upstream = riverNetwork.getDirectedProbabilityByIds(source, target);
	    	var downstream = riverNetwork.getDirectedProbabilityByIds(target, source);
	    	return "\u2191 " + upstream + " \u2193 " + downstream ;
	    } )
	    .on("click", click);

	// Create nodes as svg groups
	var node = svg.selectAll(".node")
	    .data(nodes)
	  .enter().append("g")
	    .attr("class", "node")
	    .attr("id", "name")
	    .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
		.on("mouseover", mouseoverNode)
		.on("mouseout", mouseoutNode);

	radius = 10;

	if(showFlowIn){
	// Add circle to svg group for each node
		node.append("circle")
			.style("fill", nodeColorIn)
	    	.attr("r", radius);
	}
	else{
	// Add circle to svg group for each node
		node.append("circle")
			.style("fill", nodeColorOut)
	    	.attr("r", radius);
	}


	// Add text to svg group for each node
	node.append("text")
	    .attr("dy", -1.4*radius)
	    .attr("text-anchor", "middle")
	    .text(function(d) { return d.name; });
		
}


/**
* prompt user for updated edge values when they click on an edge
*/
function click(d) {
	var source = riverNetwork.getNodeIdByLabel(d.source.name);
	var target = riverNetwork.getNodeIdByLabel(d.target.name);
	var upstream = riverNetwork.getDirectedProbabilityByIds(source, target);
	var downstream = riverNetwork.getDirectedProbabilityByIds(target, source);
	var newUpstreamVal = prompt("Please enter the new upstream value", upstream);
	var newDownstreamVal = prompt("Please enter the new downstream value", downstream);
	riverNetwork.updateEdgeValues(riverNetwork.getBarrierId(d.source.name, d.target.name), newUpstreamVal, newDownstreamVal);
	computeNetworkValueGeneral(riverNetwork);
	updateRoot();
	d3.select("svg").remove();
	drawUI();
}

/**
	update the d3 json tree
*/
function updateRoot(){
	root = JSON.parse(createD3Tree(null,riverNetwork.root));
}

/**
	display the flow in or flow out value of the node
	the user is mousing over
*/
function mouseoverNode(d){
	
	var disVal;
	if(showFlowIn){
		disVal = "Flow In Value: "+d.flowInto;
	}
	else{
		disVal = "Flow Out Value: "+d.flowOut;
	}

	document.getElementById("nodeval").textContent = disVal;
}

/**
	stop displaying node info when mouse exits node
*/
function mouseoutNode(d){
	document.getElementById("nodeval").textContent = "Mouse Over Node To See Flow Value";
}

/**
	choose the color of the node based on the flowIn value
*/
function nodeColorIn(d){
	return chooseColor(d.flowInto);
}

/**
	choose the color of the node based on the flowOut value
*/
function nodeColorOut(d){
	return chooseColor(d.flowOut);
}

/**
	Choose the color based on the given number
*/
function chooseColor(num){
	if(num < 2){
		return "#ff0000";
	}
	else if(num < 4){
		return "#ffa500";
	}
	else if(num < 6){
		return "#ffff00";
	}
	else if(num < 8){
		return "#008000";
	}
	else if(num < 10){
		return "#0000ff";
	}
	else{
		return "#ee82ee";
	}
}

/**
	when the user chooses to change from flow in to flow out or vice versa
	update the node colors
*/
function changeColor(){
	if(showFlowIn){
		var node = svg.selectAll(".node")
			.append("circle")
			.attr("r", radius)
			.style("fill", nodeColorOut);
		document.getElementById("colorbutton").value = "Display Flow In";
		document.getElementById("flowInfo").textContent = "Displaying flow out values."
	}
	else{
		var node = svg.selectAll(".node")
			.append("circle")
			.attr("r", radius)
			.style("fill", nodeColorIn);
		document.getElementById("colorbutton").value = "Display Flow Out";
		document.getElementById("flowInfo").textContent = "Displaying flow in values."
	}
	showFlowIn = !showFlowIn;

}

/**
	change the displayed tree to tree one
*/
function setTreeOne(){
	data = tree_one;
	readTree();
	d3.select("svg").remove();
	drawUI();
}

/**
	change the displayed tree to tree two
*/
function setTreeTwo(){
	data = tree_two;
	readTree();
	d3.select("svg").remove();
	drawUI();
}

/**
	change the displayed tree to tree three
*/
function setTreeThree(){
	data = tree_three;
	readTree();
	d3.select("svg").remove();
	drawUI();
}


