package cz.diploma.shared.graphs.algorithm;

import cz.diploma.shared.graphs.DirectedGraph;
import gnu.trove.TIntCollection;
import gnu.trove.iterator.TIntIterator;
import gnu.trove.list.TIntList;
import gnu.trove.list.array.TIntArrayList;
import gnu.trove.map.TIntIntMap;
import gnu.trove.map.TIntObjectMap;
import gnu.trove.map.hash.TIntIntHashMap;
import gnu.trove.map.hash.TIntObjectHashMap;
import gnu.trove.set.TIntSet;
import gnu.trove.set.hash.TIntHashSet;
import gnu.trove.stack.TIntStack;
import gnu.trove.stack.array.TIntArrayStack;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

public class SCCDetector {

    private final Logger log = Logger.getLogger(getClass().getName());
    //--
    private final DirectedGraph graph;
    private final List<TIntSet> components = new ArrayList<>();
    //--
    private final TIntList nodeStack = new TIntArrayList();
    private final TIntIntMap nodeLowLink = new TIntIntHashMap();
    private final TIntIntMap nodeIndex = new TIntIntHashMap();
    //--
    private int currentIndex = 1;

    public SCCDetector(DirectedGraph graph) {
        this.graph = graph;
    }

    public List<TIntSet> findSCC() {
        TIntCollection nodes = graph.getNodes();

        TIntIterator nodeIterator = nodes.iterator();
        while (nodeIterator.hasNext()) {
            int node = nodeIterator.next();
            if (!nodeIndex.containsKey(node)) {
                tarjanDFS(node);
            }
        }

        return components;
    }

    private void tarjanDFS(int node) {
        TIntStack processStack = new TIntArrayStack();
        processStack.push(node);

        TIntObjectMap<TIntList> toProcessSuccessors = new TIntObjectHashMap<>();
        TIntIntMap lastProcessedSuccessors = new TIntIntHashMap();

        try {
            while (processStack.size() != 0) {
                int currentNode = processStack.pop();

                if (!nodeIndex.containsKey(currentNode)) {
                    nodeIndex.put(currentNode, currentIndex);
                    nodeLowLink.put(currentNode, currentIndex);
                    currentIndex++;
                    nodeStack.add(currentNode);
                }

                TIntCollection successors = graph.getSuccessorsOf(currentNode);
                TIntList successorsToProcess = toProcessSuccessors.get(currentNode);
                if (successorsToProcess == null) {
                    successorsToProcess = new TIntArrayList(successors);
                    toProcessSuccessors.put(currentNode, successorsToProcess);
                }

                int lastProcessedSuccessor = lastProcessedSuccessors.containsKey(currentNode) ? lastProcessedSuccessors.get(currentNode) : -1;
                if (lastProcessedSuccessor != -1) {
                    nodeLowLink.put(currentNode, Math.min(nodeLowLink.get(currentNode), nodeLowLink.get(lastProcessedSuccessor)));
                    lastProcessedSuccessors.remove(currentNode);
                }

                boolean skipToChildNode = false;
                while (!successorsToProcess.isEmpty()) {
                    int curSuccessor = successorsToProcess.removeAt(0);
                    if (!nodeIndex.containsKey(curSuccessor)) {
                        processStack.push(currentNode);
                        processStack.push(curSuccessor);
                        lastProcessedSuccessors.put(currentNode, curSuccessor);

                        skipToChildNode = true;
                        break;
                    } else if (nodeStack.contains(curSuccessor)) {
                        nodeLowLink.put(currentNode, Math.min(nodeLowLink.get(currentNode), nodeIndex.get(curSuccessor)));
                    }
                }

                if (!skipToChildNode && nodeIndex.get(currentNode) == nodeLowLink.get(currentNode)) {
                    TIntSet component = new TIntHashSet();

                    int curNodeId;
                    do {
                        curNodeId = nodeStack.removeAt(nodeStack.size() - 1);
                        component.add(curNodeId);
                    } while (curNodeId != currentNode);

                    components.add(component);
                }
            }
        } catch (Exception ex) {
            log.log(Level.SEVERE, "Error while calculating strongly connected components", ex);
        }
    }
}
