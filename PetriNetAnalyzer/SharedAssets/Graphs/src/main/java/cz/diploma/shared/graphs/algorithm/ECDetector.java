package cz.diploma.shared.graphs.algorithm;

import cz.diploma.shared.graphs.DirectedGraph;
import cz.diploma.shared.graphs.NodeIndexer;
import gnu.trove.TIntCollection;
import gnu.trove.iterator.TIntIterator;
import gnu.trove.list.TIntList;
import gnu.trove.list.array.TIntArrayList;
import gnu.trove.map.hash.TIntObjectHashMap;
import gnu.trove.set.TIntSet;
import gnu.trove.set.hash.TIntHashSet;
import java.util.ArrayList;
import java.util.List;

public class ECDetector {

    private final DirectedGraph graph;
    private final NodeIndexer indexer;
    private final List<TIntList> cycles = new ArrayList<>();
    //--
    private final TIntSet blockedNodes = new TIntHashSet();
    private final TIntObjectHashMap<TIntList> blockedInfo = new TIntObjectHashMap<>();
    private final TIntList nodeStack = new TIntArrayList();

    public ECDetector(DirectedGraph graph) {
        this.graph = graph;
        this.indexer = new NodeIndexer(graph);
    }

    public List<TIntList> findCycles() {
        int curNode = indexer.getFirstNode();

        while (curNode != -1) {
            TIntList indexNodes = indexer.getNodesWithHigherOrEqualIndex(curNode);
            DirectedGraph subgraph = graph.subgraph(indexNodes);

            TIntSet leastScc = findLeastSCC(subgraph);
            if (leastScc != null) {
                curNode = indexer.getLeastIndexNodeFrom(leastScc);

                TIntIterator sccInterator = leastScc.iterator();
                while (sccInterator.hasNext()) {
                    int sccNode = sccInterator.next();
                    blockedNodes.remove(sccNode);
                    blockedInfo.remove(sccNode);
                }

                DirectedGraph sccGraph = graph.subgraph(leastScc);
                findCycle(sccGraph, curNode, curNode);
                curNode = indexer.getNextNode(curNode);
            } else {
                curNode = -1;
            }
        }

        return cycles;
    }

    private TIntSet findLeastSCC(DirectedGraph graph) {
        SCCDetector sccDetector = new SCCDetector(graph);
        List<TIntSet> scComponents = sccDetector.findSCC();

        int least = -1;
        TIntSet leastSCC = null;

        for (TIntSet component : scComponents) {
            int leastNodeIndex = indexer.getLeastIndexFrom(component);
            if (least == -1 || least > leastNodeIndex) {
                least = leastNodeIndex;
                leastSCC = component;
            }
        }

        return leastSCC;
    }

    private boolean findCycle(DirectedGraph graph, int v, int s) {
        TIntList graphNodes = graph.getNodes();
        if (graphNodes.isEmpty()) {
            return false;
        }
        boolean found = false;

        nodeStack.add(v);
        blockedNodes.add(v);
        TIntCollection successors = graph.getSuccessorsOf(v);

        TIntIterator successorIterator = successors.iterator();
        while (successorIterator.hasNext()) {
            int w = successorIterator.next();
            if (w == s) {
                nodeStack.add(s);
                cycles.add(new TIntArrayList(nodeStack));
                nodeStack.removeAt(nodeStack.size() - 1);
                found = true;
            } else {
                if (!blockedNodes.contains(w) && findCycle(graph, w, s)) {
                    found = true;
                }
            }
        }

        if (found) {
            unblock(v);
        } else {
            successors = graph.getSuccessorsOf(v);

            successorIterator = successors.iterator();
            while (successorIterator.hasNext()) {
                int w = successorIterator.next();
                TIntList blockList = blockedInfo.get(w);
                if (blockList == null) {
                    blockList = new TIntArrayList();
                    blockedInfo.put(w, blockList);
                }

                if (!blockList.contains(v)) {
                    blockList.add(v);
                }
            }
        }

        nodeStack.removeAt(nodeStack.size() - 1);
        return found;
    }

    private void unblock(int node) {
        blockedNodes.remove(node);

        TIntList blockList = blockedInfo.get(node);
        if (blockList != null) {
            TIntIterator blockIterator = blockList.iterator();

            while (blockIterator.hasNext()) {
                int blockListItem = blockIterator.next();
                blockIterator.remove();

                if (blockedNodes.contains(blockListItem)) {
                    unblock(blockListItem);
                }
            }
        }
    }
}
