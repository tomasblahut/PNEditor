package cz.diploma.shared.graphs;

import gnu.trove.iterator.TIntIterator;
import gnu.trove.list.TIntList;
import gnu.trove.map.TIntIntMap;
import gnu.trove.map.hash.TIntIntHashMap;
import gnu.trove.set.TIntSet;

public class NodeIndexer {

    private final TIntIntMap nodeToIndex;
    private final TIntList nodes;

    public NodeIndexer(DirectedGraph graph) {
        nodes = graph.getNodes();

        if (!nodes.isEmpty()) {
            nodeToIndex = new TIntIntHashMap(nodes.size());

            TIntIterator nodeInterator = nodes.iterator();
            while (nodeInterator.hasNext()) {
                int node = nodeInterator.next();
                nodeToIndex.put(node, nodeToIndex.size());
            }
        } else {
            nodeToIndex = null;
        }
    }

    public int getFirstNode() {
        return nodes.isEmpty() ? -1 : nodes.get(0);
    }

    public TIntList getNodesWithHigherOrEqualIndex(int node) {
        TIntList indexNodes = null;

        if (nodeToIndex != null) {
            int index = nodeToIndex.get(node);
            indexNodes = nodes.subList(index, nodes.size());
        }

        return indexNodes;
    }

    public int getLeastIndexFrom(TIntSet component) {
        int leastNode = getLeastIndexNodeFrom(component);
        return leastNode != -1 ? nodeToIndex.get(leastNode) : -1;
    }

    public int getLeastIndexNodeFrom(TIntSet component) {
        int leastIndex = -1;
        int leastNode = -1;

        if (nodeToIndex != null) {
            TIntIterator componentIterator = component.iterator();
            while (componentIterator.hasNext()) {
                int node = componentIterator.next();
                int index = nodeToIndex.get(node);
                if (leastIndex == -1 || leastIndex > index) {
                    leastIndex = index;
                    leastNode = node;
                }
            }
        }

        return leastNode;
    }

    public int getNextNode(int node) {
        int nextNode = -1;

        if (nodeToIndex != null) {
            int index = nodeToIndex.get(node);
            if (index < nodes.size() - 1) {
                nextNode = nodes.get(index + 1);
            }
        }

        return nextNode;
    }
}
