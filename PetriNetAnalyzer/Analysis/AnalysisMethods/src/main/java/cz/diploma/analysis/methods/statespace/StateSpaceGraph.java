package cz.diploma.analysis.methods.statespace;

import cz.diploma.shared.graphs.DirectedGraph;
import gnu.trove.TIntCollection;
import gnu.trove.iterator.TIntIterator;
import gnu.trove.map.TIntIntMap;
import gnu.trove.map.TIntObjectMap;
import gnu.trove.map.hash.TIntIntHashMap;
import gnu.trove.map.hash.TIntObjectHashMap;
import gnu.trove.set.TIntSet;
import gnu.trove.set.hash.TIntHashSet;
import gnu.trove.stack.TIntStack;
import gnu.trove.stack.array.TIntArrayStack;

public class StateSpaceGraph extends DirectedGraph<TIntSet> {

    private final TIntIntHashMap parenthood = new TIntIntHashMap();
    //--
    private final TIntObjectHashMap<int[]> tokenStates = new TIntObjectHashMap<>(); //Map From node id to its net state
    private final TIntObjectHashMap<boolean[]> omegaStates = new TIntObjectHashMap<>(); //Map from node id to its omega marking
    private final TIntIntHashMap stateHashes = new TIntIntHashMap(); //Map from node id to its state hash
    //--
    private int highestNodeId = 1;
    private int initialNode = -1;
    private Integer nodeLimit = null;
    
    private int lazyCoveringLevel = 1; 

    public StateSpaceGraph() {
    }

    public int getInitialNode() {
        return initialNode;
    }

    public int getParent(int node) {
        return parenthood.containsKey(node) ? parenthood.get(node) : -1;
    }

    public int registerNode(int[] state, boolean[] omega, int stateHash) {
        int nodeId = highestNodeId++;
        nodes.add(nodeId);

        if (initialNode == -1) {
            initialNode = nodeId;
        }

        tokenStates.put(nodeId, state);
        if (omega != null) {
            omegaStates.put(nodeId, omega);
        }
        stateHashes.put(nodeId, stateHash);

        return nodeId;
    }

    public void setParentOf(int node, int parent, int transIndex) {
        parenthood.put(node, parent);

        TIntSet edge = edges.get(parent, node);
        if (edge == null) {
            edge = new TIntHashSet();
            edges.put(parent, node, edge);
        }
        edge.add(transIndex);
    }

    public int[] getStateOf(int node) {
        return tokenStates.get(node);
    }

    public boolean[] getOmegaOf(int node) {
        return omegaStates.get(node);
    }

    public int getStateHashOf(int node) {
        return stateHashes.get(node);
    }

    public void transformToGraph() {
        if (initialNode == -1) {
            return;
        }

        TIntIntMap visitedNodes = new TIntIntHashMap();
        TIntStack nodeStack = new TIntArrayStack();
        nodeStack.push(initialNode);

        while (nodeStack.size() != 0) {
            int currentNode = nodeStack.pop();
            int nodeStateHash = stateHashes.get(currentNode);

            TIntSet children = getSuccessorsOf(currentNode);
            TIntIterator childIterator = children.iterator();
            while (childIterator.hasNext()) {
                nodeStack.push(childIterator.next());
            }

            int visitedNode = visitedNodes.get(nodeStateHash);
            if (visitedNode != visitedNodes.getNoEntryValue()) {
                //Repair parent link
                int parent = parenthood.remove(currentNode);
                TIntSet parentEdge = edges.remove(parent, currentNode);

                TIntSet correctParentEdge = edges.get(parent, visitedNode);
                if (correctParentEdge == null) {
                    correctParentEdge = new TIntHashSet();
                    edges.put(parent, visitedNode, correctParentEdge);
                }
                correctParentEdge.addAll(parentEdge);

                //Repair children links
                for (int child : children.toArray()) {
                    parenthood.put(child, visitedNode);
                    TIntSet childEdge = edges.remove(currentNode, child);

                    TIntSet correctChildEdge = edges.get(visitedNode, child);
                    if (correctChildEdge == null) {
                        correctChildEdge = new TIntHashSet();
                        edges.put(visitedNode, child, correctChildEdge);
                    }
                    correctChildEdge.addAll(childEdge);
                }

                //Remove this node
                nodes.remove(currentNode);
                stateHashes.remove(currentNode);
                tokenStates.remove(currentNode);
            } else {
                visitedNodes.put(nodeStateHash, currentNode);
            }
        }
    }

    public int getHighestNodeId() {
        return highestNodeId;
    }

    public Integer getNodeLimit() {
        return nodeLimit;
    }

    public void setNodeLimit(Integer nodeLimit) {
        this.nodeLimit = nodeLimit;
    }

    @Override
    public StateSpaceGraph subgraph(TIntCollection nodes) {
        StateSpaceGraph subGraph = new StateSpaceGraph();

        TIntIterator nodeIterator = nodes.iterator();
        while (nodeIterator.hasNext()) {
            int node = nodeIterator.next();
            subGraph.nodes.add(node);

            int parent = parenthood.get(node);
            if (nodes.contains(parent)) {
                subGraph.parenthood.put(node, parent);
            }

            TIntObjectMap connections = edges.row(node);
            TIntSet connectedNodes = connections.keySet();
            TIntIterator connectedNodesIterator = connectedNodes.iterator();

            while (connectedNodesIterator.hasNext()) {
                int connectedNode = connectedNodesIterator.next();
                if (nodes.contains(connectedNode)) {
                    TIntSet edgeValue = edges.get(node, connectedNode);
                    subGraph.edges.put(node, connectedNode, edgeValue);
                }
            }
        }

        return subGraph;
    }

    public int getLazyCoveringLevel() {
        return lazyCoveringLevel;
    }

    public void setLazyCoveringLevel(int lazyCoveringLevel) {
        this.lazyCoveringLevel = lazyCoveringLevel;
    }
}
