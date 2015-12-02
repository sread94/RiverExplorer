import java.io.*;
import java.util.*;
import java.lang.Math;

/**
* Modified code from https://www.caveofprogramming.com/java/java-file-reading-and-writing-files-in-java.html
* to parse the file
*/
public class TransformData {


    //number of nodes in the network
    public static int numNodes;

    //number of edges in the network
    public static int numEdges;

    //1 index for every line in the file (edge)
    public static String[] nodes;

    //1 index for every line in the file (barrier)
    public static String[] edges;

    //node labels
    public static String[] labels;

    //node values
    public static String[] vals;

    //edge latitude values
    public static String[] latArr;

    //edge longitude values
    public static String[] longArr;

    //each index holds the barrier id and
    //the edge that ends there
    public static String[][] toNodeArray;

    //each index holds the barrier id and
    //an edge that starts there
    public static String[][] fromNodeArray;

    //list of all neighbor pairs
    //order doesn't matter
    //each pair appears once
    public static List<String[]> neighbors;

    //probability of passing a certain barrier
    public static HashMap<String, String> barrierPassageProbs; 

    //edge traversal probabilities
    public static String[][] probs; 

    //The file name that holds barrier info
    //this info will become edge info
    public static String barrierFileName = "Deerfield_barriers_coordinates_10_16_15.txt";
    
    //The file name that holds edge info
    //this info will become node info
    public static String edgeFileName = "Deerfield_edges_10_16_15.txt";

	public static void main(String [] args) {

        parseFile();
        
    }

    public static void parseFile(){

        findNumNodes(edgeFileName);
        findNumEdges(barrierFileName);
        findNodesArr(edgeFileName);
        findEdgeArr(barrierFileName);
        findLabels();
        findVals();
        findLatArr();
        findLongArr();

        findToNodeArray();
        findFromNodeArray();
        findBarrierPassageProbs();
        findNeighbors();
        findProbs();

    }


    public static void findNumNodes(String fileName){
        // This will reference one line at a time
        String line = null;
        numNodes = -1;

        try {
            // FileReader reads text files in the default encoding.
            FileReader fileReader = 
                new FileReader(fileName);

            // Always wrap FileReader in BufferedReader.
            BufferedReader bufferedReader = 
                new BufferedReader(fileReader);

            while((line = bufferedReader.readLine()) != null) {
                numNodes++;
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
            // Or we could just do this: 
            // ex.printStackTrace();
        }
        System.out.println("Num nodes " + numNodes);
    }

    public static void findNumEdges(String fileName){
        // This will reference one line at a time
        String line = null;
        numEdges = -1;

        try {
            // FileReader reads text files in the default encoding.
            FileReader fileReader = 
                new FileReader(fileName);

            // Always wrap FileReader in BufferedReader.
            BufferedReader bufferedReader = 
                new BufferedReader(fileReader);

            while((line = bufferedReader.readLine()) != null) {
                numEdges++;
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
            // Or we could just do this: 
            // ex.printStackTrace();
        }
        System.out.println("Num edges " + numEdges);
    }

    public static void findNodesArr(String fileName){
        
        String line = null;
        nodes = new String[numNodes];

        try {
            // FileReader reads text files in the default encoding.
            FileReader fileReader = 
                new FileReader(fileName);

            // Always wrap FileReader in BufferedReader.
            BufferedReader bufferedReader = 
                new BufferedReader(fileReader);

            line = bufferedReader.readLine();

            int i = 0;
            while((line = bufferedReader.readLine()) != null) {
                nodes[i] = line;
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
            // Or we could just do this: 
            // ex.printStackTrace();
        }
        System.out.println(nodes[0]);
        System.out.println(nodes[numNodes-1]);
    }

    public static void findEdgeArr(String fileName){
        
        String line = null;
        edges = new String[numEdges];

        try {
            // FileReader reads text files in the default encoding.
            FileReader fileReader = 
                new FileReader(fileName);

            // Always wrap FileReader in BufferedReader.
            BufferedReader bufferedReader = 
                new BufferedReader(fileReader);

            line = bufferedReader.readLine();

            int i = 0;
            while((line = bufferedReader.readLine()) != null) {
                edges[i] = line;
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
            // Or we could just do this: 
            // ex.printStackTrace();
        }
        System.out.println(edges[0]);
        System.out.println(edges[numEdges-1]);
    }


    public static void findLabels(){

        labels = new String[numNodes];
        int spaceIndex = -1;
        for(int i = 0; i<numNodes; i++){
            String curNode = nodes[i];
            spaceIndex = curNode.indexOf('\t');
            labels[i] = curNode.substring(0, spaceIndex);
        }

        System.out.println(labels[0]);
        System.out.println(labels[numNodes-1]);


    }

    public static void findVals(){

        vals = new String[numNodes];
        int endIndex = -1;
        for(int i = 0; i<numNodes; i++){
            String curNode = nodes[i];
            for(int j = 0; j <3; j++){
                endIndex = curNode.indexOf('\t');
                curNode= curNode.substring(endIndex + 1);
            }
            endIndex = curNode.indexOf('\t');
            vals[i] = curNode.substring(0, endIndex);
        }

        System.out.println(vals[0]);
        System.out.println(vals[numNodes-1]);

    }

    public static void findLatArr(){

        latArr = new String[numEdges];
        int endIndex = -1;
        for(int i = 0; i<numEdges; i++){
            String curNode = edges[i];
            for(int j = 0; j <8; j++){
                endIndex = curNode.indexOf('\t');
                curNode= curNode.substring(endIndex + 1);
            }
            endIndex = curNode.indexOf('\t');
            latArr[i] = curNode.substring(0, endIndex);
        }
        
        System.out.println(latArr[0]);
        System.out.println(latArr[numEdges-1]);

    }

    public static void findLongArr(){

        longArr = new String[numEdges];
        int endIndex = -1;
        for(int i = 0; i<numEdges; i++){
            String curNode = edges[i];
            for(int j = 0; j <9; j++){
                endIndex = curNode.indexOf('\t');
                curNode= curNode.substring(endIndex + 1);
            }
            endIndex = curNode.indexOf('\t');
            longArr[i] = curNode.substring(0);
        }
        
        System.out.println(longArr[0]);
        System.out.println(longArr[numEdges-1]);

    }

    public static void findToNodeArray(){

        toNodeArray = new String[numNodes][2];
        int endIndex = -1;
        for(int i = 0; i < numNodes; i++){
            toNodeArray[i][0] = labels[i];

            String curNode = nodes[i];
            for(int j = 0; j <7; j++){
                endIndex = curNode.indexOf('\t');
                curNode= curNode.substring(endIndex + 1);
            }
            endIndex = curNode.indexOf('\t');
            toNodeArray[i][1] = curNode.substring(0, endIndex);
        }

    }

    public static void findFromNodeArray(){

        fromNodeArray = new String[numNodes][2];
        int endIndex = -1;
        for(int i = 0; i < numNodes; i++){
            fromNodeArray[i][0] = labels[i];

            String curNode = nodes[i];
            for(int j = 0; j <4; j++){
                endIndex = curNode.indexOf('\t');
                curNode= curNode.substring(endIndex + 1);
            }
            endIndex = curNode.indexOf('\t');
            fromNodeArray[i][1] = curNode.substring(0, endIndex);
        } 

    }

    public static void findNeighbors(){

        neighbors = new ArrayList<String[]>();

        for(int i = 0; i < numNodes; i++){
            for(int j = 0; j <numNodes; j++){
                if(fromNodeArray[j][1].equals(toNodeArray[i][1])){
                    String[] newNeighborPair = new String[3];
                    newNeighborPair[0] = fromNodeArray[j][1];
                    newNeighborPair[1] = fromNodeArray[j][0];
                    newNeighborPair[2] = toNodeArray[i][0];
                    neighbors.add(newNeighborPair);
                }
            }
        }
    }

    public static void findBarrierPassageProbs(){

        barrierPassageProbs = new HashMap<String, String>();
        for(int i = 0; i < numEdges; i++){
            int firstSubStrIndex = edges[i].indexOf('\t');
            String id = edges[i].substring(0, firstSubStrIndex);

            int secondSubStrIndex = edges[i].indexOf('\t', firstSubStrIndex+1);

            String val = edges[i].substring(id.length()+1, secondSubStrIndex);

            barrierPassageProbs.put(id, val);
        }

    }

    public static void findProbs(){

        probs = new String[neighbors.size()*2][3];

        for(int i = 0; i < neighbors.size(); i+=2){
            String[] curPair = neighbors.get(i/2);

            String barPassage = barrierPassageProbs.get(curPair[0]);
            //System.out.println(curPair[0]);
            double barPassageVal = 1;
            double downstreamPass = 1;
            if(barPassage!=null){
                barPassageVal = Double.parseDouble(barPassage);
                downstreamPass = 1 - Math.pow(1-barPassageVal, .25);
            }
            
            //downstream
            probs[i][0] = curPair[1];
            probs[i][1] = curPair[2];

            //probability of traversing the barrier
            //where barrier id = curPair[0]
            //downstream
            probs[i][2] = downstreamPass+"";

            //upstream
            probs[i+1][0] = curPair[2];
            probs[i+1][1] = curPair[1];

            
            probs[i+1][2] = Double.toString(barPassageVal);
        }

        System.out.println(Arrays.toString(probs[0]));
        System.out.println(Arrays.toString(probs[1]));
        System.out.println(Arrays.toString(probs[neighbors.size() -2]));
        System.out.println(Arrays.toString(probs[neighbors.size() -1]));
    }

}