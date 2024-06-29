package cz.diploma.shared.graphs;

import cz.diploma.shared.collections.IntTable;
import gnu.trove.TIntCollection;
import gnu.trove.iterator.TIntIterator;
import gnu.trove.list.TIntList;
import gnu.trove.list.array.TIntArrayList;
import gnu.trove.map.TIntObjectMap;
import gnu.trove.set.TIntSet;

public class DirectedGraph<T> {

    protected final TIntList nodes = new TIntArrayList(1024, -1);
    protected final IntTable<T> edges = new IntTable<>();

    public void addNode(int node) {
        if (!nodes.contains(node)) {
            nodes.add(node);
        }
    }

    public TIntList getNodes() {
        return nodes;
    }

    public IntTable<T> getEdges() {
        return edges;
    }

    public void setEdgeBetween(int nodeFrom, int nodeTo, T value) {
        edges.put(nodeFrom, nodeTo, value);
    }

    public T getEdgeBetween(int nodeFrom, int nodeTo) {
        return edges.get(nodeFrom, nodeTo);
    }

    public TIntSet getSuccessorsOf(int node) {
        TIntObjectMap row = edges.row(node);
        return row.keySet();
    }

    public DirectedGraph subgraph(TIntCollection nodes) {
        DirectedGraph subGraph = new DirectedGraph();

        TIntIterator nodeIterator = nodes.iterator();
        while (nodeIterator.hasNext()) {
            int node = nodeIterator.next();
            subGraph.nodes.add(node);

            TIntObjectMap connections = edges.row(node);
            TIntSet connectedNodes = connections.keySet();
            TIntIterator connectedNodesIterator = connectedNodes.iterator();

            while (connectedNodesIterator.hasNext()) {
                int connectedNode = connectedNodesIterator.next();
                if (nodes.contains(connectedNode)) {
                    T edgeValue = edges.get(node, connectedNode);
                    subGraph.edges.put(node, connectedNode, edgeValue);
                }
            }
        }

        return subGraph;
    }
}
