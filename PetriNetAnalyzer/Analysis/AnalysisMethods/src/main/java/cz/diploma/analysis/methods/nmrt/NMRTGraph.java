package cz.diploma.analysis.methods.nmrt;

import cz.diploma.shared.collections.IntTable;
import cz.diploma.shared.graphs.DirectedGraph;
import gnu.trove.map.TIntObjectMap;
import gnu.trove.map.hash.TIntIntHashMap;
import gnu.trove.map.hash.TIntObjectHashMap;
import gnu.trove.set.TIntSet;
import gnu.trove.set.hash.TIntHashSet;

/**
 *
 * @author Petr
 */
public class NMRTGraph extends DirectedGraph<TIntSet>{
    private final TIntIntHashMap parenthood = new TIntIntHashMap();

    private final TIntObjectHashMap<int[]> tokenStates = new TIntObjectHashMap<>(); 
    private final TIntObjectHashMap<TIntObjectHashMap<int []>> omegaNumbers = new TIntObjectHashMap<>();
    private final TIntIntHashMap stateHashes = new TIntIntHashMap(); 
    
    private int numberOfTerminalNodes = 0;
    private int numberOfFullConditionalNodes = 0;

    private int highestNodeId = 1;
    private int initialNode = -1;
    
    private boolean isNetWDependent = false;
    
    private final IntTable<TIntSet> dottedEdges = new IntTable<TIntSet>();

    public NMRTGraph() {
    }

    public int getInitialNode() {
        return initialNode;
    }

    public void setInitialNode(int initialNode) {
        this.initialNode = initialNode;
    }

    public int getParent(int node) {
        return parenthood.containsKey(node) ? parenthood.get(node) : -1;
    }
    
    /**
     * Creates node in the NMRT. Every node gets its ID, that is used as a key for storing the token state and omega-numbers of the node. <br>
     * Also the hashcode of the node is stored using its ID as a key.
     * 
     * @param state Array of ints representing the token state of the node.
     * @param omegas TIntObjectHashMap of arrays of ints representing omega-numbers of the node.
     * @param stateHash Hashcode of the node.
     * @return ID of the node.
     */
    public int createNode (int [] state, TIntObjectHashMap<int []> omegas, int stateHash) {
        int nodeId = highestNodeId++;
        nodes.add(nodeId);
        
        if (initialNode == -1) {
            initialNode = nodeId;
        }
        
        tokenStates.put(nodeId, state);
        if (omegas != null) {
            omegaNumbers.put(nodeId, omegas);
        } else {
            omegaNumbers.put(nodeId, new TIntObjectHashMap<>());
        }
        stateHashes.put(nodeId, stateHash);
        
        return nodeId;
    }
    
    /**
     * Creates edge between two nodes. Nodes are represented by their IDs. <br> 
     * The transition fired to get from parent node to child node is added to the edge.
     * 
     * @param child ID of the child node.
     * @param parent ID of the parent node.
     * @param transition Transition that moves the net from parent node to child node.
     */
    public void setEdge (int child, int parent, int transition) {
        parenthood.put(child, parent);
        
        TIntSet edge = edges.get(parent, child);
        if (edge == null) {
            edge = new TIntHashSet();
            edges.put(parent, child, edge);
        }
        edge.add(transition);
    }
    
    /**
     * Creates dotted edge between two nodes. Dotted edge means that the transition is only conditionally enabled at the parent node, but firing of the transition 
     * will move the net to the child node. Nodes are represented by their IDs.
     * 
     * @param child ID of the child node.
     * @param parent ID of the parent node.
     * @param transition Transition that moves the net from parent node to child node.
     */
    public void setDottedEdge (int child, int parent, int transition) {
        parenthood.put(child, parent);
        
        TIntSet edge = dottedEdges.get(parent, child);
        if (edge == null) {
            edge = new TIntHashSet();
            dottedEdges.put(parent, child, edge);
        }
        edge.add(transition);
    }
    
    public int [] getTokenStateOf (int nodeId) {
        return tokenStates.get(nodeId);
    }
    
    public TIntObjectHashMap<int []> getOmegaNumbersOf (int nodeID) {
        return omegaNumbers.get(nodeID);
    }
    
    public int getStateHashOf (int nodeID) {
        return stateHashes.get(nodeID);
    }
    
    public IntTable<TIntSet> getDottedEdges() {
        return dottedEdges;
    }

    public void setDottedEdgeBetween(int nodeFrom, int nodeTo, TIntSet value) {
        dottedEdges.put(nodeFrom, nodeTo, value);
    }

    public TIntSet getDottedEdgeBetween(int nodeFrom, int nodeTo) {
        return dottedEdges.get(nodeFrom, nodeTo);
    }

    public TIntSet getConditionalSuccessorsOf(int node) {
        TIntObjectMap row = dottedEdges.row(node);
        return row.keySet();
    }
    
    public void addTerminalNode () {
        numberOfTerminalNodes++;
    }
    
    public void addFullConditionalNode () {
        numberOfFullConditionalNodes++;
    }

    public int getNumberOfTerminalNodes() {
        return numberOfTerminalNodes;
    }

    public int getNumberOfFullConditionalNodes() {
        return numberOfFullConditionalNodes;
    }

    public boolean isNetWDependent() {
        return isNetWDependent;
    }

    public void setIsNetWDependent(boolean isNetWDependent) {
        this.isNetWDependent = isNetWDependent;
    }
    
}
