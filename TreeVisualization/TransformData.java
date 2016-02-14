import java.io.*;
import java.util.*;
import java.lang.Math;
import java.lang.StringBuffer;

/**
* The class parses the 3 data files (Deerfield_barriers_coordinates_10_16_15.txt,
* Deerfield_edges_10_16_15.txt, nodes_no_loops_barriers.txt) and transforms edges
* into nodes and node into edges. After the tranformation barriers will be represented
* as edges and habitats as nodes.
*/
public class TransformData {

	/**** Data Files ****/

	//each index is one line of data from the
	//Deerfield_barriers_coordinates_10_16_15.txt data file
	private static String[] deerfield_barriers_file;

	//each index is one line of data from the
	//Deerfield_edges_10_16_15.txt data file
	private static String[] deerfield_edges_file;

	//each index is one line of data from the
	//nodes_no_loops_barriers.txt data file
	private static String[] nodes_no_loops_file;

	/**** Primary keys ****/

	//barrier ids from deerfield_barriers_file
	private static String[] bar_id;

	//node ids from nodes_no_loops
	private static String[] node_id;

	//edge ids from Deerfield_edges_10_16_15
	private static String[] edge_id;

	/**** JSON values ****/

	//The length of edge_id (edges become nodes)
	private static int numNodes;

	//An array of edge ids (edges become nodes)
	//From deerfield_edges
	private static String[] nodeLabels;

	//An array of the lengths of the habitats
	//From deerfield_edges
	private static String[] nodeValues;

	//A 2-D array of the coordinates of the node
	//taken from nodes_no_loops
	//Using the to_node coordinates
	//[latitude, longitude]
	private static String[][] nodeCoordinates;

	//A 2-D array of adjacent node information
	//each index is: 
	//[from node, to node, probability of movement in that direciton, barrier id]
	//adjacent node pairs found in deerfield_edges
	//probability found in deerfield_barriers_file
	//barrier id found in deerfield_barriers_file
	private static String[][] probabilityBtwNodes;

	//JSON representation of the network
	//after the transformation
	//Example:
	//{
	//   numNodes: <number>,
	//   nodeLabels: [a,b,c],
	//   vals: [2,5,1],
	//   coords: [ [0,1] , [3,5] , [2,2] ],
	//   probBtwNodes: [ [a,b,1,-1] , [b,a,1,-1] , [a,c,.5,0] , [c,a,.8,0] ]
	//}
	//
	//numNodes: the number of habitats in the graph. Originally represented
	//    as edges
	//nodeLabels: a list of labels, one for each habitat/node
	//vals: a list of habitat values
	//coords: a list of coordinates for each habitat
	//probBtwNodes: a list of probabilities of movement between habitats.
	//    Direction is going from the first node (identified by the node
	//    label) to the second (first index to the second). 
	//    The third index is the probability. The fourth is the barrier
	//    id. -1 mean there is not a barrier there (represents a fork
	//    in the river)
	private static String transformedDataJSON;

	/**** Intermediate Parseing Values****/

	//array of to_node values from the deerfield_edges_file
	private static String[] toNodeList;

	//each row contains information about the edges
	//in the deerfield_edges_file
	//edgeInfo[i][0] -> edge id
	//edgeInfo[i][1] -> the from node
	//edgeInfo[i][2] -> the from barrier id
	//edgeInfo[i][3] -> the to node
	//edgeInfo[i][4] -> the to barrier id
 	private static String[][] edgeInfo;

 	//each row contains values from the deerfield_barriers_file
 	//barInfo[i][0] -> bar id
 	//barInfo[i][1] -> upstream probability
	private static String[][] barInfo;

	//set of arrays of neighboring habitats and the barriers
	//connecting them
	//neighboringHabitats[i][0] -> downstream habitat
	//neighboringHabitats[i][1] -> upstream habitat
	//neighboringHabitats[i][2] -> probability
	//neighboringHabitats[i][3] -> barrier ID
	private static List<String[]> neighboringHabitats;

	/**** METHODS ****/

	public static void main(String[] args){

		//parse files
		parseBarriersFile("Deerfield_barriers_coordinates_10_16_15.txt");
		parseNodeFile("nodes_no_loops_barriers.txt");
		parseEdgeFile("Deerfield_edges_10_16_15.txt");

		//get ids
		findBarID();
		findNodeID();
		findEdgeID();

		//set the value of nodeLabels
		setNodeLabels();

		//find the value of each habitat
		findNodeValues();

		//find the list of nodes each habitat
		//is pointing/flowing to
		findToNodeList();

		//find the coordinates of each node
		findCoordinates();

		//find the info about each edge
		findEdgeInfo();

		//find info about the barriers
		findBarInfo();

		//find all pairs of neighbors
		findNodePairs();

		//create the 2-D array of all neighboring
		//nodes (habitats) and the probability
		//of moving between each pair in both directions
		findProbabilityBtwNodes();

		//put all of the arrays into one string of JSON
		createJSON();

		//save the JSON string to a file
		saveJSONToFile();
	}

	/**
	* create deerfield_barriers_file from the information
	* in Deerfield_barriers_coordinates_10_16_15.txt
	*/	
	public static void parseBarriersFile(String fileName){

		//find the length of the file and subtract one
		//because the header is included in the length
		int numberOfBarriers = findFileLength(fileName) - 1;
		deerfield_barriers_file = new String[numberOfBarriers];

		//parse the file and save it in deerfield_barriers_file 
		parseDataFile(fileName, deerfield_barriers_file);

	}

	/**
	* create nodes_no_loops_file from the information
	* in nodes_no_loops_barriers.txt
	*/	
	public static void parseNodeFile(String fileName){

		//find the length of the file and subtract one
		//because the header is included in the length
		int numberOfNodes = findFileLength(fileName) - 1;
		nodes_no_loops_file = new String[numberOfNodes];

		//parse the file and save it in nodes_no_loops_file 
		parseDataFile(fileName, nodes_no_loops_file);

	}

	/**
	* create deerfield_edges_file from the information
	* in Deerfield_edges_10_16_15.txt
	*
	* Also set the value of numNodes
	*
	* Modified code from https://www.caveofprogramming.com/java/java-file-reading-and-writing-files-in-java.html
	*/	
	public static void parseEdgeFile(String fileName){

		//find the length of the file and subtract one
		//because the header is included in the length
		int numberOfEdges = findFileLength(fileName) -1;

		//save numNodes
		numNodes = numberOfEdges;

		deerfield_edges_file = new String[numberOfEdges];

		//parse the file and save it in deerfield_edges_file 
		parseDataFile(fileName, deerfield_edges_file);

	}

	/**
	* save all lines of the desired file, except the first
	* into the indexes of the dataArray
	*
	* Modified code from https://www.caveofprogramming.com/java/java-file-reading-and-writing-files-in-java.html
	*/
	private static void parseDataFile(String fileName, String[] dataArray){
		String line = null;

		 try {
            // FileReader reads text files in the default encoding.
            FileReader fileReader = 
                new FileReader(fileName);

            // Always wrap FileReader in BufferedReader.
            BufferedReader bufferedReader = 
                new BufferedReader(fileReader);

            //get the first line so it is not saved
            line = bufferedReader.readLine();

            //save each line of data into the dataArray
            int i = 0;
            while((line = bufferedReader.readLine()) != null) {
                dataArray[i] = line;
                i++;
            }   

            // Always close files.
            bufferedReader.close();         
        }
        catch(FileNotFoundException ex) {
            System.out.println(
                "Unable to open file '" + 
                fileName + "'");                
        }
        catch(IOException ex) {
            System.out.println(
                "Error reading file '" 
                + fileName + "'");                  
        }

	}

	/**
	* find the number of lines in the given file
	*/
	private static int findFileLength(String fileName){
		
		int numLines = 0;
		String line = null;

		try {
            // FileReader reads text files in the default encoding.
            FileReader fileReader = 
                new FileReader(fileName);

            // Always wrap FileReader in BufferedReader.
            BufferedReader bufferedReader = 
                new BufferedReader(fileReader);

            while((line = bufferedReader.readLine()) != null) {
                numLines++;
            }   

            // Always close files.
            bufferedReader.close();
            return numLines;        
        }
        catch(FileNotFoundException ex) {
            System.out.println(
                "Unable to open file '" + 
                fileName + "'");
            return -1;                
        }
        catch(IOException ex) {
            System.out.println(
                "Error reading file '" 
                + fileName + "'");                  
            return -1;     
        }
	}

	/**
	* find the barrier ids for each row of deerfield_barriers_file
	*/
	public static void findBarID(){

		//the barrier id is the first column
		//find the first tab and substring up to that index
		bar_id = new String[deerfield_barriers_file.length];
		for(int i = 0; i < bar_id.length; i++){
			int tabIndex = deerfield_barriers_file[i].indexOf('\t');
			bar_id[i] = deerfield_barriers_file[i].substring(0,tabIndex);
		}

	}

	/**
	* find the node ids for each row of nodes_no_loops_file
	*/
	public static void findNodeID(){

		//the node id is after the first comma
		//find the first comma and the second
		//substring to get the value between the commas
		node_id = new String[nodes_no_loops_file.length];
		for(int i = 0; i < node_id.length; i++){
			int commaIndex1 = nodes_no_loops_file[i].indexOf(',');
			int commaIndex2 = nodes_no_loops_file[i].indexOf(',',commaIndex1+1);
			node_id[i] = nodes_no_loops_file[i].substring(commaIndex1+1, commaIndex2);
		}

	}

	/**
	* find the edge ids for each row of deerfield_edges_file
	*/
	public static void findEdgeID(){

		//the edge id is the first column
		//find the first tab and subtring to get
		//the value before it
		edge_id = new String[deerfield_edges_file.length];
		for(int i = 0; i < edge_id.length; i++){
			int tabIndex = deerfield_edges_file[i].indexOf('\t');
			edge_id[i] = deerfield_edges_file[i].substring(0,tabIndex);
		}

	}

	/**
	* set the value of nodeLabels
	*/
	public static void setNodeLabels(){

		//the node labels are the original edge ids
		nodeLabels = edge_id;
	}

	/**
	* find the node values which are in the deerfield_edges_file
	* the node value is the length of the river segment
	*/
	public static void findNodeValues(){

		//the node values are the length of the river segment
		nodeValues = new String[edge_id.length];
		for(int i = 0; i < edge_id.length; i++){
            nodeValues[i] = parseTabbedFile(i, 3, deerfield_edges_file);
		}

	}

	/**
	* create an array of toNodeLists corresponding
	* to each index of deerfield_edges_file
	*/
	public static void findToNodeList(){

		//a list of which node the each edge flows to
		toNodeList = new String[edge_id.length];
		for(int i = 0; i < edge_id.length; i++){
            toNodeList[i] = parseTabbedFile(i, 2, deerfield_edges_file);
		}

	}

	/**
	* find the coordinates for each node
	* Since coordinates were given to barriers
	* and nodes in the original dataset we
	* approximate location of each habitat
	* by using the coordinates of the toNode
	* from the deerfield_edges_file
	*/
	public static void findCoordinates(){

		nodeCoordinates = new String[edge_id.length][2];

		for(int i = 0; i < edge_id.length; i++){

			//get the toNode id of the edge
			String curToNode = toNodeList[i];
			int curToNodeId = Integer.parseInt(curToNode);

			//the nodes are listed in order so we take
			//the nodeId's index from the nodes file
			String curLine = nodes_no_loops_file[curToNodeId];

			//there are 2 commas in front of the longitude
			//and 3 in front of the latitude
			//find all commas necessary to parse the data
			int comma1 = curLine.indexOf(',');
            int comma2 = curLine.indexOf(',', comma1 + 1);
            int comma3 = curLine.indexOf(',', comma2 + 1);
            int comma4 = curLine.indexOf(',', comma3 + 1);

            //get the latitude and longitude of the toNode
            String latitude = curLine.substring(comma3+1, comma4);
			String longitude = curLine.substring(comma2+1, comma3);

			//save the coordinates
			nodeCoordinates[i][0] = latitude;
			nodeCoordinates[i][1] = longitude;
		}

	}

	/**
	* create edgeInfo. in each index store the
	* edgeId, from_node, from_bar_id, to_node, and to_bar_id
	*/
	public static void findEdgeInfo(){

		//get the desired values from deerfield_edges_file
		//for each row of data 
		edgeInfo = new String[edge_id.length][5];

		for(int i = 0; i < edge_id.length; i++){
			edgeInfo[i][0] = edge_id[i];
			edgeInfo[i][1] = parseTabbedFile(i, 1, deerfield_edges_file);
			edgeInfo[i][2] = parseTabbedFile(i, 4, deerfield_edges_file);
			edgeInfo[i][3] = parseTabbedFile(i, 2, deerfield_edges_file);
			edgeInfo[i][4] = parseTabbedFile(i, 7, deerfield_edges_file);
		}

	}

	/**
	* get the piece of data in the numTabs+1 column of the
	* given file from the index desired
	* numTabs is the number of tabs before the desired value
	* i.e. if numTabs = 0 the item in the 1st column of the
	* indexed row will be returned
	*/
	private static String parseTabbedFile(int index, int numTabs, String[] file){
		
		//get the desired line from the file
		String curLine = file[index];

		//loop through the line and find the tab specified
		int tab1 = -1;
		for(int i = 0; i < numTabs; i++){
			tab1 = curLine.indexOf('\t', tab1+1);
		}

		//get the tab after the value
		int tab2 = curLine.indexOf('\t', tab1+1);

		//return the value in the desired column
		return curLine.substring(tab1+1,tab2);
	}

	/**
	* get the barrier ids and upstream proabilities
	*/
	public static void findBarInfo(){

		//get an array of desired information from
		//deerfield_barriers_file
		barInfo = new String[bar_id.length][2];
		for(int i = 0; i < barInfo.length; i++){
			barInfo[i][0] = bar_id[i];
			barInfo[i][1] = parseTabbedFile(i, 1, deerfield_barriers_file);
		}

	}

	/**
	* create a 2-D array where each index is
	* [downstream habitat, upstream habitat, probability, barrier ID]
	* To do this match the from_node of one edge to the
	* to_node of another edge. These edges share and edge.
	*/
	public static void findNodePairs(){

		neighboringHabitats = new ArrayList<String[]>();

		//loop through and find the pairs where
		//i's to node is the same as j's from node
		//because these nodes are adjacent
		for(int i = 0; i < edge_id.length; i++){
			for(int j = 0; j < edge_id.length; j++){
				if(edgeInfo[i][3].equals(edgeInfo[j][1])){

					//create an array with the node ids
					//the probabilities of moving between
					//the nodes in the upstream direction
					//and the barrier id
					String[] newNeighbors = new String[4];
					newNeighbors[0] = edgeInfo[j][0];
					newNeighbors[1] = edgeInfo[i][0];

					int barId = Integer.parseInt(edgeInfo[j][2]);

					//if the barrier id is negative then
					//there is no barrier and the probability
					//is 1
					if(barId>=0){
						newNeighbors[2] = barInfo[barId][1];
						if(newNeighbors[2].equals("-1")){
							newNeighbors[2] = "1";
						}
					}
					else{
						newNeighbors[2] = "1";
					}
					newNeighbors[3] = edgeInfo[j][2]; 

					//store the pair
					neighboringHabitats.add(newNeighbors);
				}
			}
		}
	}

	/**
	* For each set of neighbors save the probabilty
	* of going from the upstream to downstream neighbor
	* and going from the downstream to upstream neighbor
	*/
	public static void findProbabilityBtwNodes(){

		//there are double the probabilities between nodes
		//because the probabilities of moving in each direction
		//are stored separately
		int numNeighborPairs = neighboringHabitats.size();
		probabilityBtwNodes = new String[numNeighborPairs*2][4];

		for(int i = 0; i < numNeighborPairs; i++){

			String[] nextPair = neighboringHabitats.get(i);

			//neighboringHabitats stores the information
			//in the upstream direction
			//so this does not have to be recalculated
			probabilityBtwNodes[i*2] = nextPair;

			//save the downstream probability
			//switch the order of movement so node ids
			//must be in the other order
			probabilityBtwNodes[i*2+1][0] = nextPair[1];
			probabilityBtwNodes[i*2+1][1] = nextPair[0];

			//transform the upstream passability to the
			//downstream passability
			double upstreamPass = Double.parseDouble(nextPair[2]);
			double downstreamPass = 1 - Math.pow(1-upstreamPass, .25);
			probabilityBtwNodes[i*2+1][2] = Double.toString(downstreamPass);

			//it is the same barrier so use the same id
			probabilityBtwNodes[i*2+1][3] = nextPair[3];
		}

	}

	/**
    * create the JSON string
    */
	public static void createJSON(){

		//set the number of nodes
        StringBuffer jsonFormatBuffer = new StringBuffer("{ numNodes: ");
        jsonFormatBuffer.append(numNodes);

        //list all node labels comma separated
        jsonFormatBuffer.append(",\nnodeLabels: [");
        for(int i = 0; i < numNodes; i++){
            jsonFormatBuffer.append(nodeLabels[i]);
            if(i != numNodes-1){
                jsonFormatBuffer.append(",");
            }
        }

        jsonFormatBuffer.append("]");

        //list all node values comma separated
        jsonFormatBuffer.append(",\nvals: [");
        for (int i = 0; i < numNodes; i++) {
            jsonFormatBuffer.append(nodeValues[i]);
            if(i != numNodes-1){
                jsonFormatBuffer.append(",");
            }
        }

        jsonFormatBuffer.append("]");

        //list all coordinates as comma separated sets
        jsonFormatBuffer.append(",\ncoords: [");
        for (int i = 0; i < numNodes; i++) {
        	//each set of coordinates is [latitude, longitude]
            jsonFormatBuffer.append("[" + nodeCoordinates[i][0] + ", " + nodeCoordinates[i][1] + "]");
            if(i != numNodes-1){
                jsonFormatBuffer.append(",");
            }
        }
        jsonFormatBuffer.append("]");

        //list probabilities between nodes as comma separated sets
        jsonFormatBuffer.append(",\nprobBtwNodes: [");
        for (int i = 0; i < probabilityBtwNodes.length; i++) {
            String[] curArr = probabilityBtwNodes[i];

            //each set is [from_node, to_node, probability, barrier id]
            jsonFormatBuffer.append("["+ curArr[0]+","+curArr[1]+","
            	+curArr[2]+","+curArr[3]+"]");
            if(i != probabilityBtwNodes.length-1){
                jsonFormatBuffer.append(",");
            }
        }
        jsonFormatBuffer.append("]}");

        //save the JSON as a string
        transformedDataJSON = jsonFormatBuffer.toString();
	}

	/**
    * Modified code from http://www.mkyong.com/java/how-to-write-to-file-in-java-bufferedwriter-example/
    * Save the JSON string to a file
    */
	public static void saveJSONToFile(){

 		try {

 			//create a file to save the string in
            File writeFile = new File("transformedData.txt");

            // if file doesnt exists, then create it
            if (!writeFile.exists()) {
                writeFile.createNewFile();
            }

            //write the JSON to the file
            FileWriter fw = new FileWriter(writeFile.getAbsoluteFile());
            BufferedWriter bw = new BufferedWriter(fw);
            bw.write(transformedDataJSON);
            bw.close();

            //notify the user the file is written
            System.out.println("Done");

        } catch (IOException e) {
            e.printStackTrace();
        }
	}

}